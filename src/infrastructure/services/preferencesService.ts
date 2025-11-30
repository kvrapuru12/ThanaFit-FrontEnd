import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCES_KEY = '@ThanaFit:preferences';

export interface AppPreferences {
  units: 'METRIC' | 'IMPERIAL';
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

const DEFAULT_PREFERENCES: AppPreferences = {
  units: 'METRIC',
  theme: 'light',
  language: 'en',
};

export const PreferencesService = {
  // Get all preferences
  async getPreferences(): Promise<AppPreferences> {
    try {
      const data = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Error loading preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  },

  // Save preferences
  async savePreferences(preferences: Partial<AppPreferences>): Promise<void> {
    try {
      const current = await this.getPreferences();
      const updated = { ...current, ...preferences };
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  },

  // Get specific preference
  async getPreference<K extends keyof AppPreferences>(
    key: K
  ): Promise<AppPreferences[K]> {
    const preferences = await this.getPreferences();
    return preferences[key];
  },

  // Set specific preference
  async setPreference<K extends keyof AppPreferences>(
    key: K,
    value: AppPreferences[K]
  ): Promise<void> {
    await this.savePreferences({ [key]: value });
  },
};



