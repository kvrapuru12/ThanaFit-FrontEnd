import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationApiService } from './notificationApi';

type TargetTab = 'dashboard' | 'food' | 'exercise' | 'cyclesync' | 'progress' | 'profile';

const SUPPORTED_TABS: TargetTab[] = ['dashboard', 'food', 'exercise', 'cyclesync', 'progress', 'profile'];
const LAST_REGISTERED_PUSH_KEY = 'notifications:lastRegisteredPushToken';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getProjectId(): string | undefined {
  const easProjectId = Constants?.expoConfig?.extra?.eas?.projectId;
  if (typeof easProjectId === 'string' && easProjectId.length > 0) {
    return easProjectId;
  }
  return undefined;
}

function parseTargetTab(input: unknown): TargetTab | null {
  if (typeof input !== 'string') return null;
  return SUPPORTED_TABS.includes(input as TargetTab) ? (input as TargetTab) : null;
}

function getTargetTabFromPayload(data: Record<string, unknown> | undefined): TargetTab | null {
  if (!data) return null;
  const direct = parseTargetTab(data.targetTab);
  if (direct) return direct;

  const targetScreen = typeof data.targetScreen === 'string' ? data.targetScreen.toLowerCase() : '';
  if (targetScreen === 'food' || targetScreen === 'foodtracking') return 'food';
  if (targetScreen === 'exercise' || targetScreen === 'exercisetracking') return 'exercise';
  if (targetScreen === 'cyclesync' || targetScreen === 'cycle') return 'cyclesync';
  if (targetScreen === 'profile') return 'profile';
  if (targetScreen === 'progress') return 'progress';
  if (targetScreen === 'dashboard' || targetScreen === 'home') return 'dashboard';

  const type = typeof data.type === 'string' ? data.type.toLowerCase() : '';
  if (type.includes('food')) return 'food';
  if (type.includes('activity') || type.includes('exercise')) return 'exercise';
  if (type.includes('phase') || type.includes('cycle')) return 'cyclesync';

  return null;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getExpoPushToken(): Promise<string | null> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  const projectId = getProjectId();
  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  return tokenResponse?.data ?? null;
}

export async function registerDeviceForUser(userId: number): Promise<string | null> {
  const token = await getExpoPushToken();
  if (!token) return null;

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const appVersion = Application.nativeApplicationVersion ?? undefined;
  const buildNumber = Application.nativeBuildVersion ?? undefined;
  const deviceName = Application.applicationName ?? undefined;

  const cacheKey = `${userId}:${token}:${timezone}`;
  const lastRegistered = await AsyncStorage.getItem(LAST_REGISTERED_PUSH_KEY);
  if (lastRegistered === cacheKey) {
    return token;
  }

  await notificationApiService.registerDevice({
    userId,
    token,
    timezone,
    appVersion,
    buildNumber,
    deviceName,
    platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
  });
  await AsyncStorage.setItem(LAST_REGISTERED_PUSH_KEY, cacheKey);

  return token;
}

export function addNotificationResponseListener(onTargetTab: (tab: TargetTab) => void): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown> | undefined;
    const targetTab = getTargetTabFromPayload(data);
    if (targetTab) {
      onTargetTab(targetTab);
    }
  });

  return () => {
    subscription.remove();
  };
}

export async function handleInitialNotificationResponse(
  onTargetTab: (tab: TargetTab) => void
): Promise<void> {
  const initialResponse = await Notifications.getLastNotificationResponseAsync();
  if (!initialResponse) return;
  const data = initialResponse.notification.request.content.data as Record<string, unknown> | undefined;
  const targetTab = getTargetTabFromPayload(data);
  if (targetTab) {
    onTargetTab(targetTab);
  }
}
