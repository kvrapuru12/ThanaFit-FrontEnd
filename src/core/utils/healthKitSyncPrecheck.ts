import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = '@ThanaFit:healthkit_sync_precheck_v1';

/** Shown once before the first Apple Health sync (steps or sleep) so HealthKit is explained before the system permission sheet. */
export const HEALTHKIT_PRECHECK_ALERT_BODY =
  'ThanaFit uses Apple HealthKit when you sync from the Dashboard.\n\n' +
  'We read: step count and sleep (sleep analysis).\n\n' +
  'Why: to update your dashboard, insights, and reminders.\n\n' +
  'We do not write to Apple Health or use this data for advertising.\n\n' +
  'You can change access anytime in Settings → Privacy and Security → Health → ThanaFit.';

export async function shouldShowHealthKitSyncPrecheck(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    return v !== '1';
  } catch {
    return true;
  }
}

export async function markHealthKitSyncPrecheckComplete(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  await AsyncStorage.setItem(STORAGE_KEY, '1');
}
