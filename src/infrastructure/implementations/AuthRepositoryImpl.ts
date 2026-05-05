import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from '../../core/utils/tokenStorage';
import { IAuthRepository, CreateUserRequest, AppleSignInPayload } from '../../core/domain/interfaces/IAuthRepository';
import { User, AuthCredentials, AuthTokens, Gender, ActivityLevel, UserRole, AccountStatus } from '../../core/domain/entities/User';
import { apiClient } from '../api/ApiClient';
import { HttpMethod } from '../api/ApiClient';

// API Response interfaces
interface LoginResponse {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
  userId: number;
  username: string;
  role: string;
  gender: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileComplete?: boolean;
  message: string;
}

interface RefreshTokenResponse {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
} 

// Concrete implementation of Auth Repository
export class AuthRepositoryImpl implements IAuthRepository {
  
  // Authentication methods
  async login(credentials: AuthCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials, {
        skipAuth: true,
        retryAttempts: 0,
      });
      
      // Validate response structure
      if (!response.data || !response.data.token || !response.data.userId) {
        throw new Error('Invalid login response structure');
      }
      
      const { token, refreshToken, expiresIn, userId, username, role, gender, profileComplete } = response.data;
      
      // Store userId for later use
      await AsyncStorage.setItem('userId', userId.toString());
      
      // Create user object from backend response
      // Backend returns profileComplete in LoginResponse (POST /auth/login)
      const user: User = {
        id: userId,
        firstName: username, // Backend doesn't return firstName, using username
        lastName: '', // Backend doesn't return lastName
        email: '', // Backend doesn't return email
        username: username,
        phoneNumber: null, // Backend doesn't return phoneNumber
        dob: null, // Backend doesn't return dob
        gender: this.mapGender(gender || null), // Use gender from backend response
        activityLevel: ActivityLevel.MODERATE, // Default value
        dailyCalorieIntakeTarget: 2000, // Default value
        dailyCalorieBurnTarget: 500, // Default value
        weight: 70, // Default value
        height: { value: 170, unit: 'CM' }, // Default value
        role: role as UserRole,
        accountStatus: AccountStatus.ACTIVE, // Default value
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileComplete: profileComplete ?? false,
      };
    
      const tokens: AuthTokens = {
        accessToken: token,
        refreshToken: refreshToken || undefined,
        expiresIn: typeof expiresIn === 'number' && expiresIn > 0 ? expiresIn : 3600,
      };
      
      return { user, tokens };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async loginWithGoogle(idToken: string, platform: string): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const requestBody = {
        idToken,
        platform,
      };
      
      const response = await apiClient.post<LoginResponse>('/auth/google', requestBody, {
        skipAuth: true,
        retryAttempts: 0,
      });

      // Validate response structure
      if (!response.data || !response.data.token || !response.data.userId) {
        throw new Error('Invalid Google login response structure');
      }

      const { token, refreshToken, expiresIn, userId, username, role, gender, firstName, lastName, email, profileComplete } = response.data;

      // Store userId for later use
      await AsyncStorage.setItem('userId', userId.toString());

      // Map role with fallback to USER if missing or null
      const mappedRole = this.mapRole(role);

      // Create user object from backend response
      const user: User = {
        id: userId,
        firstName: firstName || username || '', // Backend should return firstName from Google profile
        lastName: lastName || '', // Backend should return lastName from Google profile
        email: email || username || '', // Backend should return email
        username: username,
        phoneNumber: '',
        dob: null, // Will be fetched from getCurrentUser if needed
        gender: this.mapGender(gender || null), // Handle null gender
        activityLevel: ActivityLevel.MODERATE,
        dailyCalorieIntakeTarget: 2000,
        dailyCalorieBurnTarget: 500,
        weight: 70,
        height: { value: 170, unit: 'CM' },
        role: mappedRole,
        accountStatus: AccountStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileComplete: profileComplete ?? false, // Backend returns in LoginResponse (POST /auth/google)
      };

      const tokens: AuthTokens = {
        accessToken: token,
        refreshToken: refreshToken || undefined,
        expiresIn: typeof expiresIn === 'number' && expiresIn > 0 ? expiresIn : 3600,
      };

      return { user, tokens };
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  }

  async loginWithApple(payload: AppleSignInPayload): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const requestBody: Record<string, unknown> = {
        idToken: payload.idToken,
        platform: payload.platform,
      };
      if (payload.email != null && payload.email !== '') requestBody.email = payload.email;
      if (payload.firstName != null && payload.firstName !== '') requestBody.firstName = payload.firstName;
      if (payload.lastName != null && payload.lastName !== '') requestBody.lastName = payload.lastName;
      const response = await apiClient.post<LoginResponse>('/auth/apple', requestBody, {
        skipAuth: true,
        retryAttempts: 0,
      });
      if (!response.data || !response.data.token || !response.data.userId) {
        throw new Error('Invalid Apple login response structure');
      }
      const { token, refreshToken, expiresIn, userId, username, role, gender, firstName, lastName, email, profileComplete } = response.data;
      await AsyncStorage.setItem('userId', userId.toString());
      const mappedRole = this.mapRole(role);
      const user: User = {
        id: userId,
        firstName: firstName || username || '',
        lastName: lastName || '',
        email: email || username || '',
        username: username,
        phoneNumber: '',
        dob: null,
        gender: this.mapGender(gender || null),
        activityLevel: ActivityLevel.MODERATE,
        dailyCalorieIntakeTarget: 2000,
        dailyCalorieBurnTarget: 500,
        weight: 70,
        height: { value: 170, unit: 'CM' },
        role: mappedRole,
        accountStatus: AccountStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileComplete: profileComplete ?? false,
      };
      const tokens: AuthTokens = {
        accessToken: token,
        refreshToken: refreshToken || undefined,
        expiresIn: typeof expiresIn === 'number' && expiresIn > 0 ? expiresIn : 3600,
      };
      return { user, tokens };
    } catch (error: any) {
      console.error('Apple login failed:', error);
      throw error;
    }
  }

  async signup(userData: CreateUserRequest): Promise<User> {
    try {
      const response = await apiClient.post<User>('/users', userData);
      
      if (!response.data) {
        throw new Error('No response data received from server');
      }

      return response.data;
    } catch (error: any) {
      console.error('Signup request failed:', error?.message ?? 'Unknown error');
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', { refreshToken });
    
    const { token, refreshToken: newRefreshToken, expiresIn } = response.data;
    
    return {
      accessToken: token,
      refreshToken: newRefreshToken,
      expiresIn: typeof expiresIn === 'number' && expiresIn > 0 ? expiresIn : 3600,
    };
  }

  // User management
  async getCurrentUser(userId: number): Promise<User> {
    const response = await apiClient.get<any>(`/users/${userId}`);
    
    // Map backend response to frontend User entity
    const backendUser = response.data;
    const user: User = {
      id: backendUser.id,
      firstName: backendUser.firstName,
      lastName: backendUser.lastName,
      email: backendUser.email,
      username: backendUser.username,
      phoneNumber: backendUser.phoneNumber,
      dob: backendUser.dob,
      gender: this.mapGender(backendUser.gender || null),
      activityLevel: this.mapActivityLevel(backendUser.activityLevel),
      dailyCalorieIntakeTarget: backendUser.dailyCalorieIntakeTarget,
      dailyCalorieBurnTarget: backendUser.dailyCalorieBurnTarget,
      weight: backendUser.weight,
      height: backendUser.heightCm ? { value: backendUser.heightCm.value, unit: backendUser.heightCm.unit } : null,
      role: this.mapRole(backendUser.role),
      accountStatus: this.mapAccountStatus(backendUser.accountStatus),
      createdAt: backendUser.createdAt,
      updatedAt: backendUser.updatedAt,
      
      // Target fields
      targetFat: backendUser.targetFat,
      targetProtein: backendUser.targetProtein,
      targetCarbs: backendUser.targetCarbs,
      targetSleepHours: backendUser.targetSleepHours,
      targetWaterLitres: backendUser.targetWaterLitres,
      targetSteps: backendUser.targetSteps,
      targetWeight: backendUser.targetWeight,
      lastPeriodDate: backendUser.lastPeriodDate,

      // Profile completion (UserResponse from GET /users/:id)
      profileComplete: backendUser.profileComplete,
    };
    
    return user;
  }

  async updateProfile(userId: number, userData: Partial<User>): Promise<User> {
    const response = await apiClient.patch<User>(`/users/${userId}`, userData);
    return response.data;
  }

  async deleteAccount(userId: number): Promise<void> {
    await apiClient.delete(`/users/${userId}`);
  }

  // Token management (SecureStore on native, AsyncStorage on web via tokenStorage)
  async saveTokens(tokens: AuthTokens): Promise<void> {
    try {
      await tokenStorage.setItemAsync('authToken', tokens.accessToken);
      if (tokens.refreshToken) {
        await tokenStorage.setItemAsync('refreshToken', tokens.refreshToken);
      }
      await AsyncStorage.setItem('tokenExpiry', (Date.now() + tokens.expiresIn * 1000).toString());
    } catch (error) {
      console.error('Failed to save tokens:', error);
      throw new Error('Failed to save authentication tokens');
    }
  }

  async getStoredTokens(): Promise<AuthTokens | null> {
    try {
      const accessToken = await tokenStorage.getItemAsync('authToken');
      const refreshToken = await tokenStorage.getItemAsync('refreshToken');
      const expiry = await AsyncStorage.getItem('tokenExpiry');

      if (!accessToken) {
        return null;
      }

      return {
        accessToken,
        refreshToken: refreshToken || undefined,
        expiresIn: expiry ? Math.floor((parseInt(expiry) - Date.now()) / 1000) : 0,
      };
    } catch (error) {
      console.error('Failed to get stored tokens:', error);
      return null;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await tokenStorage.deleteItemAsync('authToken');
      await tokenStorage.deleteItemAsync('refreshToken');
      await AsyncStorage.multiRemove([
        'tokenExpiry',
        'userData',
        'userId',
      ]);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
      throw new Error('Failed to clear authentication data');
    }
  }

  // Session management
  async isAuthenticated(): Promise<boolean> {
    try {
      const refreshToken = await tokenStorage.getItemAsync('refreshToken');
      const tokens = await this.getStoredTokens();
      const expiryRaw = await AsyncStorage.getItem('tokenExpiry');

      if (!tokens?.accessToken) {
        return !!refreshToken;
      }

      // No local expiry record (legacy / partial save) — treat as session present; API + refresh handle reality
      if (!expiryRaw) {
        return true;
      }

      if (tokens.expiresIn > 0) {
        return true;
      }

      // Access token past local expiry — session recoverable via refresh
      return !!refreshToken;
    } catch (error) {
      console.error('Failed to check authentication status:', error);
      return false;
    }
  }

  // Additional utility methods
  async isTokenExpired(): Promise<boolean> {
    try {
      const expiry = await AsyncStorage.getItem('tokenExpiry');
      if (!expiry) return true;
      
      return Date.now() > parseInt(expiry);
    } catch (error) {
      console.error('Failed to check token expiry:', error);
      return true;
    }
  }

  async getValidToken(): Promise<string | null> {
    try {
      const tokens = await this.getStoredTokens();
      if (!tokens) return null;

      // Check if token is expired
      if (tokens.expiresIn <= 0) {
        // Try to refresh token
        if (tokens.refreshToken) {
          try {
            const newTokens = await this.refreshToken(tokens.refreshToken);
            await this.saveTokens(newTokens);
            return newTokens.accessToken;
          } catch (error) {
            // Refresh failed, clear tokens
            await this.clearTokens();
            return null;
          }
        } else {
          // No refresh token, clear tokens
          await this.clearTokens();
          return null;
        }
      }

      return tokens.accessToken;
    } catch (error) {
      console.error('Failed to get valid token:', error);
      return null;
    }
  }

  // Helper methods for mapping backend values to frontend enums
  private mapGender(backendGender: string | null): Gender | null {
    if (!backendGender) {
      return null;
    }
    switch (backendGender.toUpperCase()) {
      case 'FEMALE':
        return Gender.FEMALE;
      case 'MALE':
        return Gender.MALE;
      case 'NON_BINARY':
        return Gender.NON_BINARY;
      case 'OTHER':
        return Gender.OTHER;
      default:
        return null;
    }
  }

  private mapActivityLevel(backendActivityLevel: string): ActivityLevel {
    switch (backendActivityLevel.toUpperCase()) {
      case 'SEDENTARY':
        return ActivityLevel.SEDENTARY;
      case 'LIGHT':
        return ActivityLevel.LIGHT;
      case 'MODERATE':
        return ActivityLevel.MODERATE;
      case 'ACTIVE':
        return ActivityLevel.ACTIVE;
      case 'VERY_ACTIVE':
        return ActivityLevel.VERY_ACTIVE;
      default:
        return ActivityLevel.MODERATE;
    }
  }

  private mapRole(backendRole: string): UserRole {
    switch (backendRole.toUpperCase()) {
      case 'ADMIN':
        return UserRole.ADMIN;
      case 'PREMIUM':
        return UserRole.PREMIUM;
      case 'COACH':
        return UserRole.COACH;
      case 'USER':
      default:
        return UserRole.USER;
    }
  }

  private mapAccountStatus(backendStatus: string): AccountStatus {
    switch (backendStatus.toUpperCase()) {
      case 'ACTIVE':
        return AccountStatus.ACTIVE;
      case 'INACTIVE':
        return AccountStatus.INACTIVE;
      case 'DELETED':
        return AccountStatus.DELETED;
      default:
        return AccountStatus.ACTIVE;
    }
  }
}

