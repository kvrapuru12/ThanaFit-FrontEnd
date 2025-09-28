import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  
  // Actions
  login: (credentials: AuthCredentials) => Promise<boolean>;
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
      
      // Execute client-side logout (clears tokens locally only)
      await logoutUseCase.execute();
      
      // Clear user context and global state
      setUser(null);
      await clearUserData();
      
      // Note: Navigation back to login screen is handled automatically
      // by the AppNavigator component based on isAuthenticated state
      
      console.log('Client-side logout successful - tokens and user context cleared');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if token clearing fails
      setUser(null);
      await clearUserData();
      console.log('Logout completed with errors - local state cleared');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      setIsLoading(true);
      
      const updatedUser = await authRepository.updateProfile(userData);
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
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async (): Promise<void> => {
    try {
      const isAuth = await authRepository.isAuthenticated();
      if (isAuth) {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          const currentUser = await authRepository.getCurrentUser(parseInt(storedUserId));
          setUser(currentUser);
          await saveUserData(currentUser);
        }
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If refresh fails, user might be logged out
      setUser(null);
      await clearUserData();
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
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
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
