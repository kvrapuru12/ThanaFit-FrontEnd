import { Platform } from 'react-native';
import { apiClient } from '../api/ApiClient';

export interface NotificationPreferences {
  foodReminderEnabled: boolean;
  activityReminderEnabled: boolean;
  cyclePhaseReminderEnabled: boolean;
  reminderTimeLocal: string; // HH:mm
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
  timezone: string;
}

export interface RegisterDevicePayload {
  userId: number;
  token: string;
  platform: 'ios' | 'android' | 'web';
  timezone: string;
  appVersion?: string;
  buildNumber?: string;
  deviceName?: string;
}

const DEFAULT_PREFS: NotificationPreferences = {
  foodReminderEnabled: true,
  activityReminderEnabled: true,
  cyclePhaseReminderEnabled: true,
  reminderTimeLocal: '20:00',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
};

export class NotificationApiService {
  async registerDevice(payload: RegisterDevicePayload): Promise<void> {
    await apiClient.post('/notifications/devices/register', payload);
  }

  async unregisterDevice(deviceId: string): Promise<void> {
    await apiClient.delete(`/notifications/devices/${encodeURIComponent(deviceId)}`);
  }

  /**
   * Loads preferences from the API. On server errors (5xx) or network failure, returns app defaults
   * so the UI stays usable while the backend is fixed or migrations are applied.
   */
  async getPreferences(): Promise<{
    preferences: NotificationPreferences;
    fromServer: boolean;
  }> {
    try {
      const response = await apiClient.get<Partial<NotificationPreferences>>('/notifications/preferences');
      return {
        preferences: {
          ...DEFAULT_PREFS,
          ...(response.data || {}),
        },
        fromServer: true,
      };
    } catch (e) {
      console.warn(
        'notificationApi.getPreferences: using defaults (server unreachable or error). Fix backend / DB if this persists.',
        e
      );
      return {
        preferences: { ...DEFAULT_PREFS },
        fromServer: false,
      };
    }
  }

  async updatePreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
    const response = await apiClient.patch<NotificationPreferences>('/notifications/preferences', preferences);
    return {
      ...DEFAULT_PREFS,
      ...(response.data || {}),
    };
  }

  async sendTestNotification(targetTab: string = 'dashboard'): Promise<void> {
    await apiClient.post('/notifications/test', {
      title: 'ThanaFit Reminder',
      body: 'This is a test push notification.',
      data: {
        type: 'test',
        targetTab,
        source: 'mobile-app',
      },
      platform: Platform.OS,
    });
  }
}

export const notificationApiService = new NotificationApiService();
