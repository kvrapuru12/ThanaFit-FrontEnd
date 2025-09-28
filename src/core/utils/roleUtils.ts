import { User, UserRole } from '../domain/entities/User';

/**
 * Check if user has access to voice logging features
 * Only PREMIUM and ADMIN users can access voice logging
 */
export const hasVoiceLogAccess = (user: User | null | undefined): boolean => {
  if (!user) return false;
  
  return user.role === UserRole.PREMIUM || user.role === UserRole.ADMIN;
};

/**
 * Get user role display name
 */
export const getUserRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case UserRole.USER:
      return 'Free User';
    case UserRole.PREMIUM:
      return 'Premium User';
    case UserRole.ADMIN:
      return 'Admin';
    case UserRole.COACH:
      return 'Coach';
    default:
      return 'Unknown';
  }
};

/**
 * Check if user is admin
 */
export const isAdmin = (user: User | null | undefined): boolean => {
  return user?.role === UserRole.ADMIN;
};

/**
 * Check if user is premium or admin
 */
export const isPremiumOrAdmin = (user: User | null | undefined): boolean => {
  return hasVoiceLogAccess(user);
};
