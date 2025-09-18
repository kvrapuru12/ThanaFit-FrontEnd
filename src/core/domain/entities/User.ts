// Domain Entities - Core business objects
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber: string;
  dob: string;
  gender: Gender;
  activityLevel: ActivityLevel;
  dailyCalorieIntakeTarget: number;
  dailyCalorieBurnTarget: number;
  weight: number;
  height: Height;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
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
