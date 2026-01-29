import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { IAuthRepository, CreateUserRequest } from '../../core/domain/interfaces/IAuthRepository';
import { User, AuthCredentials, AuthTokens, Gender, ActivityLevel, UserRole, AccountStatus } from '../../core/domain/entities/User';
import { apiClient } from '../api/ApiClient';
import { HttpMethod } from '../api/ApiClient';

// API Response interfaces
interface LoginResponse {
  token: string;
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
} 

// Concrete implementation of Auth Repository
export class AuthRepositoryImpl implements IAuthRepository {
  
  // Authentication methods
  async login(credentials: AuthCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      
      // Log the actual response structure
      console.log('Login response data:', JSON.stringify(response.data, null, 2));
      console.log('Response data type:', typeof response.data);
      console.log('Response data keys:', response.data ? Object.keys(response.data) : 'No data');
      
      // Validate response structure
      if (!response.data || !response.data.token || !response.data.userId) {
        console.error('Invalid login response structure. Expected: { token, userId }, Got:', response.data);
        throw new Error('Invalid login response structure');
      }
      
      const { token, userId, username, role, gender, profileComplete } = response.data;
      
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
        refreshToken: undefined, // Backend doesn't return refreshToken
        expiresIn: 3600, // Default 1 hour
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
      console.log('[AuthRepository] Google login request body:', JSON.stringify(requestBody, null, 2));
      console.log('[AuthRepository] API Base URL:', process.env.EXPO_PUBLIC_API_BASE_URL);
      console.log('[AuthRepository] Full endpoint URL:', `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api'}/auth/google`);
      
      const response = await apiClient.post<LoginResponse>('/auth/google', requestBody);

      // Validate response structure
      if (!response.data || !response.data.token || !response.data.userId) {
        throw new Error('Invalid Google login response structure');
      }

      const { token, userId, username, role, gender, firstName, lastName, email, profileComplete } = response.data;

      // Log the role received from backend for debugging
      console.log('[AuthRepository] Google login response - role:', role, 'userId:', userId, 'profileComplete:', profileComplete);

      // Store userId for later use
      await AsyncStorage.setItem('userId', userId.toString());

      // Map role with fallback to USER if missing or null
      const mappedRole = this.mapRole(role);
      console.log('[AuthRepository] Mapped role:', mappedRole, '(from backend role:', role, ')');

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
        refreshToken: undefined,
        expiresIn: 3600,
      };

      return { user, tokens };
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  }

  async signup(userData: CreateUserRequest): Promise<User> {
    try {
      console.log('=== SIGNUP REQUEST START ===');
      console.log('Signup endpoint: /users');
      console.log('Signup payload:', JSON.stringify(userData, null, 2));
      
      const response = await apiClient.post<User>('/users', userData);
      
      console.log('=== SIGNUP RESPONSE ===');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      console.log('Response data type:', typeof response.data);
      console.log('Response data keys:', response.data ? Object.keys(response.data) : 'No data');
      
      if (!response.data) {
        console.error('No response data received from signup endpoint');
        throw new Error('No response data received from server');
      }
      
      console.log('=== SIGNUP SUCCESS ===');
      return response.data;
    } catch (error: any) {
      console.error('=== SIGNUP ERROR ===');
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error message:', error.message);
      console.error('Error status:', error.status);
      console.error('Error response:', error.response);
      
      // Re-throw with more context
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
    
    const { token, refreshToken: newRefreshToken } = response.data;
    
    return {
      accessToken: token,
      refreshToken: newRefreshToken,
      expiresIn: 3600,
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

  // Token management
  async saveTokens(tokens: AuthTokens): Promise<void> {
    try {
      // Store sensitive tokens in SecureStore
      await SecureStore.setItemAsync('authToken', tokens.accessToken);
      if (tokens.refreshToken) {
        await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
      }
      
      // Store non-sensitive data in AsyncStorage
      await AsyncStorage.setItem('tokenExpiry', (Date.now() + tokens.expiresIn * 1000).toString());
    } catch (error) {
      console.error('Failed to save tokens:', error);
      throw new Error('Failed to save authentication tokens');
    }
  }

  async getStoredTokens(): Promise<AuthTokens | null> {
    try {
      // Get sensitive tokens from SecureStore
      const accessToken = await SecureStore.getItemAsync('authToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      
      // Get non-sensitive data from AsyncStorage
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
      // Clear sensitive tokens from SecureStore
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
      
      // Clear non-sensitive data from AsyncStorage
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
      // Check if we have a valid token
      const tokens = await this.getStoredTokens();
      if (!tokens || !tokens.accessToken) {
        return false;
      }
      
      // Check if token is expired
      if (tokens.expiresIn <= 0) {
        return false;
      }
      
      return true;
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

