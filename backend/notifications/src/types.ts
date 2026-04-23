export type PlatformKind = 'ios' | 'android' | 'web';

export interface NotificationPreferences {
  foodReminderEnabled: boolean;
  activityReminderEnabled: boolean;
  cyclePhaseReminderEnabled: boolean;
  reminderTimeLocal: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
}

export interface RegisterDeviceRequest {
  userId: number;
  token: string;
  platform: PlatformKind;
  timezone: string;
  appVersion?: string;
  buildNumber?: string;
  deviceName?: string;
}

export interface ReminderCandidate {
  userId: number;
  timezone: string;
  targetType: 'food_missing' | 'activity_missing' | 'cycle_phase_change';
  localDate: string;
  targetTab: 'food' | 'exercise' | 'cyclesync';
  title: string;
  body: string;
  dedupeKey: string;
}

export interface DeviceRecord {
  userId: number;
  deviceId: string;
  token: string;
}
