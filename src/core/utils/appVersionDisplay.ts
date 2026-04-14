import { Platform } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const appJson = require('../../../app.json') as {
  expo?: {
    version?: string;
    ios?: { buildNumber?: string };
    android?: { versionCode?: number };
  };
};

export type AppVersionDisplay = { appVersionLabel: string; buildLabel: string };

/**
 * Version / build shown in the UI: prefers values from the installed binary,
 * then the embedded Expo manifest, then app.json (e.g. web).
 */
export function getAppVersionDisplay(): AppVersionDisplay {
  const fromManifest = Constants.expoConfig?.version as string | undefined;
  const fallbackVersion = fromManifest ?? appJson.expo?.version ?? '1.0.0';

  let nativeVersion: string | null = null;
  let nativeBuild: string | null = null;
  try {
    nativeVersion = Application.nativeApplicationVersion;
    nativeBuild = Application.nativeBuildVersion;
  } catch {
    // Some web/test runtimes
  }

  const manifestBuild =
    Platform.OS === 'ios'
      ? String(appJson.expo?.ios?.buildNumber ?? '')
      : Platform.OS === 'android'
        ? String(appJson.expo?.android?.versionCode ?? '')
        : '';

  return {
    appVersionLabel: nativeVersion ?? fallbackVersion,
    buildLabel: nativeBuild ?? (manifestBuild || '1'),
  };
}
