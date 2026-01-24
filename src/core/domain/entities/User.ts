// Domain Entities - Core business objects
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber: string | null;
  dob: string | null;
  gender: Gender | null;
  activityLevel: ActivityLevel;
  dailyCalorieIntakeTarget: number | null;
  dailyCalorieBurnTarget: number | null;
  weight: number | null;
  height: Height | null;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
  
  // Target fields
  targetFat?: number | null;
  targetProtein?: number | null;
  targetCarbs?: number | null;
  targetSleepHours?: number | null;
  targetWaterLitres?: number | null;
  targetSteps?: number | null;
  targetWeight?: number | null;
  lastPeriodDate?: string | null;
  
  // Profile completion
  profileComplete?: boolean;
}

export enum Gender {
  FEMALE = 'FEMALE',
  MALE = 'MALE',
  NON_BINARY = 'NON_BINARY',
  OTHER = 'OTHER'
}

export enum ActivityLevel {
  SEDENTARY = 'SEDENTARY',
  LIGHT = 'LIGHT',
  MODERATE = 'MODERATE',
  ACTIVE = 'ACTIVE',
  VERY_ACTIVE = 'VERY_ACTIVE'
}

export enum UserRole {
  USER = 'USER',
  PREMIUM = 'PREMIUM',
  ADMIN = 'ADMIN',
  COACH = 'COACH'
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED'
}

// Value Objects
export interface Height {
  value: number;
  unit: 'CM' | 'FEET';
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}
