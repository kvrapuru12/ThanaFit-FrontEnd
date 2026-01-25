import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api'; // Load from environment variable
const API_TIMEOUT = 10000; // 10 seconds

// Storage Keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  REFRESH_TOKEN: 'refreshToken',
};

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  username: string;
  role: string;
  gender: string;
  message: string;
  user?: UserData;
  refreshToken?: string;
}

export interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: 'FEMALE' | 'MALE' | 'NON_BINARY' | 'OTHER';
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
  dailyCalorieIntakeTarget: number;
  dailyCalorieBurnTarget: number;
  weightKg: number;
  heightCm: number;
  role: 'USER' | 'ADMIN' | 'COACH';
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  createdAt: string;
  updatedAt: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  username: string;
  password: string;
  dob: string;
  gender: 'FEMALE' | 'MALE' | 'NON_BINARY' | 'OTHER';
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
  dailyCalorieIntakeTarget: number;
  dailyCalorieBurnTarget: number;
  weight: number;
  height: {
    value: number;
    unit: 'CM' | 'FEET';
  };
  role: 'USER' | 'ADMIN' | 'COACH';
}

// API Error Types
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API Service Class - Focused on Authentication Only
class ApiService {
  private token: string | null = null;

  constructor() {
    this.initializeToken();
  }

  // Initialize token from storage
  private async initializeToken() {
    try {
      this.token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Failed to initialize token:', error);
    }
  }

  // Set authentication token
  public setToken(token: string) {
    this.token = token;
    AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  // Get current token
  public getToken(): string | null {
    return this.token;
  }

  // Clear authentication data
  public async clearAuth() {
    this.token = null;
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.REFRESH_TOKEN,
    ]);
  }

  // Generic API request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Default headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token exists
    if (this.token) {
      (headers as Record<string, string>).Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new ApiError('Request timeout', 408)), API_TIMEOUT);
      });

      // Make API request with timeout
      const response = await Promise.race([
        fetch(url, config),
        timeoutPromise,
      ]);

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || `HTTP ${response.status}`,
          response.status,
          data.code
        );
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new ApiError('Network error - please check your connection', 0);
      }

      throw new ApiError('An unexpected error occurred', 500);
    }
  }

  // Authentication Methods

  /**
   * Login user
   */
  public async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data) {
      // Store token and user data
      this.setToken(response.data.token);
      if (response.data.user) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
      }
      
      if (response.data.refreshToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);
      }
    }

    return response.data!;
  }

  /**
   * Register new user
   */
  public async signup(userData: SignupRequest): Promise<UserData> {
    const response = await this.request<UserData>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    return response.data!;
  }

  /**
   * Get current user profile
   */
  public async getCurrentUser(userId: number): Promise<UserData> {
    const response = await this.request<UserData>(`/users/${userId}`);
    return response.data!;
  }

  /**
   * Update user profile
   */
  public async updateProfile(userId: number, userData: Partial<UserData>): Promise<UserData> {
    const response = await this.request<UserData>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });

    return response.data!;
  }

  /**
   * Logout user
   */
  public async logout(): Promise<void> {
    try {
      // Call logout endpoint if available
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local storage
      await this.clearAuth();
    }
  }

  /**
   * Refresh authentication token
   */
  public async refreshToken(): Promise<string> {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    if (!refreshToken) {
      throw new ApiError('No refresh token available', 401);
    }

    const response = await this.request<{ token: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (response.data) {
      this.setToken(response.data.token);
    }

    return response.data!.token;
  }

  // Utility Methods

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Get stored user data
   */
  public async getStoredUserData(): Promise<UserData | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get stored user data:', error);
      return null;
    }
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
