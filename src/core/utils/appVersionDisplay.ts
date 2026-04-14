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
 * Version / build shown in the UI.
 * In Expo Go, nativeApplicationVersion / nativeBuildVersion refer to the Expo Go
 * app itself (e.g. 2.33.x), not this project — use manifest / app.json instead.
 * In standalone or dev builds, prefer the installed binary values.
 */
export function getAppVersionDisplay(): AppVersionDisplay {
  const fromManifest = Constants.expoConfig?.version as string | undefined;
  const fallbackVersion = fromManifest ?? appJson.expo?.version ?? '1.0.0';

  const isExpoGo = Constants.appOwnership === 'expo';

  let nativeVersion: string | null = null;
  let nativeBuild: string | null = null;
  if (!isExpoGo) {
    try {
      nativeVersion = Application.nativeApplicationVersion;
      nativeBuild = Application.nativeBuildVersion;
    } catch {
      // Some web/test runtimes
    }
  }

  const expoConfig = Constants.expoConfig as
    | {
        ios?: { buildNumber?: string };
        android?: { versionCode?: number };
      }
    | undefined;
  const configBuild =
    Platform.OS === 'ios'
      ? String(expoConfig?.ios?.buildNumber ?? '')
      : Platform.OS === 'android'
        ? String(expoConfig?.android?.versionCode ?? '')
        : '';

  const manifestBuild =
    Platform.OS === 'ios'
      ? String(appJson.expo?.ios?.buildNumber ?? '')
      : Platform.OS === 'android'
        ? String(appJson.expo?.android?.versionCode ?? '')
        : '';

  const devOrientedBuild = configBuild || manifestBuild || '1';

  return {
    appVersionLabel: nativeVersion ?? fallbackVersion,
    buildLabel: isExpoGo ? devOrientedBuild : nativeBuild ?? devOrientedBuild,
  };
}
