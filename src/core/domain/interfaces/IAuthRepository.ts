import { User, AuthCredentials, AuthTokens } from '../entities/User';

// Repository Interface - Defines contract for data operations
export interface IAuthRepository {
  // Authentication methods
  login(credentials: AuthCredentials): Promise<{ user: User; tokens: AuthTokens }>;
  signup(userData: CreateUserRequest): Promise<User>;
  logout(): Promise<void>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  
  // User management
  getCurrentUser(): Promise<User>;
  updateProfile(userData: Partial<User>): Promise<User>;
  
  // Token management
  saveTokens(tokens: AuthTokens): Promise<void>;
  getStoredTokens(): Promise<AuthTokens | null>;
  clearTokens(): Promise<void>;
  
  // Session management
  isAuthenticated(): Promise<boolean>;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  username: string;
  password: string;
  dob: string;
  gender: string;
  activityLevel: string;
  dailyCalorieIntakeTarget: number;
  dailyCalorieBurnTarget: number;
  weight: number;
  height: {
    value: number;
    unit: 'CM' | 'FEET';
  };
  role: string;
}
