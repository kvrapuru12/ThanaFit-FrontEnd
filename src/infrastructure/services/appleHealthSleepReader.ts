/**
 * Non-iOS stub: Apple Health / HealthKit is iOS-only.
 */
import type { AppleHealthSleepStage } from '../../core/types/appleHealthContracts';

export interface AppleHealthSleepSegment {
  sleepStage: AppleHealthSleepStage;
  start: Date;
  end: Date;
  externalSampleId: string;
}

export async function ensureAppleHealthSleepReadAuthorization(): Promise<boolean> {
  return false;
}

export async function readAppleHealthAsleepHoursForLocalDay(
  _day: Date
): Promise<number | null> {
  return null;
}

export async function readAppleHealthAsleepStageHoursForLocalDay(
  _day: Date
): Promise<AppleHealthSleepSegment[] | null> {
  return null;
}
