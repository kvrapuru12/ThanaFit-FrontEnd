import { IAuthRepository } from '../../interfaces/IAuthRepository';
import { User } from '../../entities/User';

// Use Case - Business logic for signup
export class SignupUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(userData: any): Promise<User> {
    console.log('=== SIGNUP USE CASE START ===');
    console.log('User data received for validation:', JSON.stringify(userData, null, 2));
    
    // Business logic validation
    console.log('Validating user data...');
    this.validateUserData(userData);
    console.log('User data validation passed');
    
    // Execute signup
    console.log('Calling auth repository signup...');
    const result = await this.authRepository.signup(userData);
    
    console.log('=== SIGNUP USE CASE SUCCESS ===');
    console.log('Signup result:', JSON.stringify(result, null, 2));
    
    return result;
  }

  private validateUserData(userData: any): void {
    console.log('Starting user data validation...');
    
    if (!userData.email || !userData.password) {
      console.error('Validation failed: Email and password are required');
      throw new Error('Email and password are required');
    }
    
    if (userData.password.length < 8) {
      console.error('Validation failed: Password too short');
      throw new Error('Password must be at least 8 characters');
    }
    
    if (!this.isValidEmail(userData.email)) {
      console.error('Validation failed: Invalid email format');
      throw new Error('Please enter a valid email address');
    }
    
    if (!userData.firstName || !userData.lastName) {
      console.error('Validation failed: First name and last name are required');
      throw new Error('First name and last name are required');
    }
    
    if (!userData.username) {
      console.error('Validation failed: Username is required');
      throw new Error('Username is required');
    }
    
    if (userData.username.length < 3) {
      console.error('Validation failed: Username too short');
      throw new Error('Username must be at least 3 characters');
    }
    
    console.log('All user data validation checks passed');
  }

  private isValidEmail(email: string): boolean {
    return /\S+@\S+\.\S+/.test(email);
  }
}
