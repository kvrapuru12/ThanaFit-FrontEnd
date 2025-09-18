import { IAuthRepository } from '../../interfaces/IAuthRepository';

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
