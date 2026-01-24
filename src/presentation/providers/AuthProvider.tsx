import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { User, AuthCredentials } from '../../core/domain/entities/User';
import { IAuthRepository } from '../../core/domain/interfaces/IAuthRepository';
import { LoginUseCase, SignupUseCase, LogoutUseCase } from '../../core/domain/usecases/auth/LoginUseCase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth Context Types
interface AuthContextType {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  profileComplete: boolean; // Profile completion status
  
  // Actions
  login: (credentials: AuthCredentials) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  signup: (userData: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  
  // Utilities
  refreshUserData: () => Promise<void>;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Props
interface AuthProviderProps {
  children: ReactNode;
  authRepository: IAuthRepository; // Dependency injection
}

// Auth Provider Component with Clean Architecture
export const AuthProvider: React.FC<AuthProviderProps> = ({ children, authRepository }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize use cases
  const loginUseCase = new LoginUseCase(authRepository);
  const signupUseCase = new SignupUseCase(authRepository);
  const logoutUseCase = new LogoutUseCase(authRepository);

  // Initialize authentication state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated
      const isAuth = await authRepository.isAuthenticated();
      if (isAuth) {
        // Get stored user data
        const storedUser = await getStoredUserData();
        if (storedUser) {
          setUser(storedUser);
        } else {
          // Try to fetch current user from API
          try {
            // Get userId from stored tokens or login response
            const tokens = await authRepository.getStoredTokens();
            if (tokens) {
              // Extract userId from token or use stored userId
              const storedUserId = await AsyncStorage.getItem('userId');
              if (storedUserId) {
                const currentUser = await authRepository.getCurrentUser(parseInt(storedUserId));
                setUser(currentUser);
                await saveUserData(currentUser);
              }
            }
          } catch (error) {
            console.error('Failed to fetch current user:', error);
            // Clear invalid authentication
            await authRepository.clearTokens();
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: AuthCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('=== AUTH PROVIDER LOGIN START ===');
      console.log('Credentials:', JSON.stringify(credentials, null, 2));
      
      const result = await loginUseCase.execute(credentials);
      
      console.log('Login result:', JSON.stringify(result, null, 2));
      console.log('=== AUTH PROVIDER LOGIN SUCCESS ===');
      
      setUser(result.user);
      await saveUserData(result.user);
      
      return true;
    } catch (error: any) {
      console.error('=== AUTH PROVIDER LOGIN ERROR ===');
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Handle specific error cases
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.status === 401) {
        errorMessage = 'Invalid username or password. Please try again.';
      } else if (error.status === 403) {
        errorMessage = 'Account is locked. Please contact support.';
      } else if (error.status === 0) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Login Error:', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      console.log('[AuthProvider] loginWithGoogle called');
      setIsLoading(true);

      // Import Google Auth Service
      console.log('[AuthProvider] Importing Google Auth Service...');
      const { getGoogleAuthService } = await import('../../infrastructure/services/googleAuthService');
      const googleAuth = getGoogleAuthService();
      console.log('[AuthProvider] Google Auth Service initialized');

      // Sign in with Google to get ID token
      console.log('[AuthProvider] Starting Google Sign-In flow...');
      const idToken = await googleAuth.signIn();
      console.log('[AuthProvider] Received ID token from Google');

      // Get platform
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      console.log(`[AuthProvider] Platform: ${platform}, Sending token to backend...`);

      // Login with Google token via backend
      const result = await authRepository.loginWithGoogle(idToken, platform);
      console.log('[AuthProvider] Backend login successful, user:', result.user.firstName);

      // Save tokens for future API calls
      await authRepository.saveTokens(result.tokens);
      console.log('[AuthProvider] Tokens saved successfully');

      setUser(result.user);
      await saveUserData(result.user);

      return true;
    } catch (error: any) {
      console.error('Google login error:', error);
      // Re-throw the error so LoginScreen can handle it and show appropriate message
      // This allows LoginScreen to show user-friendly error messages for QR code/Passkey scenarios
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('=== AUTH PROVIDER SIGNUP START ===');
      console.log('User data received:', JSON.stringify(userData, null, 2));
      
      const newUser = await signupUseCase.execute(userData);
      
      console.log('=== SIGNUP SUCCESSFUL ===');
      console.log('New user created:', JSON.stringify(newUser, null, 2));
      
      // Automatically login the user after successful signup
      console.log('=== AUTO-LOGIN AFTER SIGNUP ===');
      const loginCredentials = {
        username: userData.username,
        password: userData.password
      };
      
      console.log('Login credentials for auto-login:', JSON.stringify(loginCredentials, null, 2));
      
      try {
        const loginResult = await loginUseCase.execute(loginCredentials);
        
        console.log('=== AUTO-LOGIN SUCCESS ===');
        console.log('Login result:', JSON.stringify(loginResult, null, 2));
        
        setUser(loginResult.user);
        await saveUserData(loginResult.user);
        
        console.log('User automatically logged in after signup');
        return true;
      } catch (loginError: any) {
        console.error('=== AUTO-LOGIN FAILED ===');
        console.error('Auto-login error:', JSON.stringify(loginError, null, 2));
        
        // Even if auto-login fails, signup was successful
        // User can manually login with their credentials
        console.log('Signup successful but auto-login failed. User can login manually.');
        return true;
      }
      
    } catch (error: any) {
      console.error('=== AUTH PROVIDER SIGNUP ERROR ===');
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error message:', error.message);
      console.error('Error status:', error.status);
      console.error('Error response:', error.response);
      
      // Handle specific error cases
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error.status === 400) {
        if (error.message && error.message.includes('already exists')) {
          errorMessage = 'Username or email already exists. Please try a different one.';
        } else {
          errorMessage = 'Please check your information and try again.';
        }
      } else if (error.status === 0) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Signup Error:', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      console.log('[AuthProvider] Starting logout - clearing all cached data...');
      
      // Clear user context and global state first
      setUser(null);
      
      // Execute client-side logout (clears tokens from SecureStore and AsyncStorage)
      try {
        await logoutUseCase.execute();
        console.log('[AuthProvider] Tokens cleared from SecureStore');
      } catch (tokenError) {
        // Ignore token clearing errors (account might already be deleted)
        console.error('Token clearing error (ignored):', tokenError);
      }
      
      // Clear all cached user data from AsyncStorage
      try {
        await clearUserData();
      } catch (clearError) {
        // Ignore data clearing errors
        console.error('Data clearing error (ignored):', clearError);
      }
      
      console.log('[AuthProvider] Logout complete - all cached data cleared');
      
      // Note: Navigation back to login screen is handled automatically
      // by the AppNavigator component based on isAuthenticated state
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if logout fails
      setUser(null);
      try {
        await clearUserData();
      } catch (clearError) {
        // Ignore errors during cleanup
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      if (!user || !user.id) {
        throw new Error('User not available for update');
      }
      
      // Don't set global isLoading here - it causes navigation to reset
      // Profile components handle their own loading states
      
      const updatedUser = await authRepository.updateProfile(user.id, userData);
      setUser(updatedUser);
      await saveUserData(updatedUser);
      
      console.log('Profile updated successfully:', JSON.stringify(updatedUser, null, 2));
    } catch (error: any) {
      console.error('Profile update failed:', error);
      
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (error.status === 400) {
        errorMessage = 'Please check your information and try again.';
      } else if (error.status === 0) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Update Error:', errorMessage);
      throw error; // Re-throw so caller can handle it
    }
  };

  const refreshUserData = async (): Promise<void> => {
    try {
      const isAuth = await authRepository.isAuthenticated();
      if (isAuth) {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          try {
            const currentUser = await authRepository.getCurrentUser(parseInt(storedUserId));
            setUser(currentUser);
            await saveUserData(currentUser);
          } catch (fetchError: any) {
            // Log the error but don't log out the user
            // This could be a temporary backend issue (e.g., role not set in JWT)
            console.warn('Failed to refresh user data from API, using cached data:', fetchError.message);
            // Don't clear user or logout - keep using cached user data
            // The user can still use the app with the data we have from login
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Only clear user data if it's a critical error (not a 400/403 which might be backend config issues)
      // Keep the user logged in with cached data
    }
  };

  // Local storage utilities
  const saveUserData = async (userData: User): Promise<void> => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  };

  const getStoredUserData = async (): Promise<User | null> => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get stored user data:', error);
      return null;
    }
  };

  const clearUserData = async (): Promise<void> => {
    try {
      // Clear all user-related data from AsyncStorage
      await AsyncStorage.multiRemove([
        'userData',
        'userId',
        'tokenExpiry',
      ]);
      console.log('[AuthProvider] Cleared all cached user data from AsyncStorage');
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    profileComplete: user?.profileComplete !== false, // Default to true if not set
    login,
    loginWithGoogle,
    signup,
    logout,
    updateUser,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
