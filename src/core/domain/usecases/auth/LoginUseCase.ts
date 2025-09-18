import { IAuthRepository } from '../../interfaces/IAuthRepository';
import { AuthCredentials, User, AuthTokens } from '../../entities/User';

// Use Case - Business logic for login
export class LoginUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(credentials: AuthCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    // Business logic validation
    this.validateCredentials(credentials);
    
    // Execute login
    const result = await this.authRepository.login(credentials);
    
    // Save tokens for future use
    await this.authRepository.saveTokens(result.tokens);
    
    return result;
  }

  private validateCredentials(credentials: AuthCredentials): void {
    if (!credentials.username || !credentials.password) {
      throw new Error('Username and password are required');
    }
    
    if (credentials.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
  }
}

// Use Case - Business logic for signup
export class SignupUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(userData: any): Promise<User> {
    // Business logic validation
    this.validateUserData(userData);
    
    // Execute signup
    return await this.authRepository.signup(userData);
  }

  private validateUserData(userData: any): void {
    if (!userData.email || !userData.password) {
      throw new Error('Email and password are required');
    }
    
    if (userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    // Add more business validation rules
  }
}

// Use Case - Business logic for logout (client-side only)
export class LogoutUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(): Promise<void> {
    // Clear local tokens from SecureStore and AsyncStorage
    await this.authRepository.clearTokens();
    
    // Note: No backend call needed - this is a client-side logout only
    // The backend will handle token invalidation based on token expiry
  }
}
