import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * Secure token storage abstraction.
 * Uses expo-secure-store on iOS/Android and AsyncStorage (localStorage) on web,
 * since SecureStore is not available in the browser.
 */
export const tokenStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    const SecureStore = await import('expo-secure-store');
    return SecureStore.getItemAsync(key);
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
      return;
    }
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync(key, value);
  },

  async deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
      return;
    }
    const SecureStore = await import('expo-secure-store');
    await SecureStore.deleteItemAsync(key);
  },
};

/** Get the stored auth token (convenience for ApiClient). */
export async function getStoredAuthToken(): Promise<string | null> {
  try {
    return await tokenStorage.getItemAsync(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get stored token:', error);
    return null;
  }
}
