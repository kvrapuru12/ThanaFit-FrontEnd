import {
  isHealthDataAvailableAsync,
  queryCategorySamples,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit';
import { CategoryValueSleepAnalysis } from '@kingstinct/react-native-healthkit/types';
import { addLocalCalendarDays, startOfLocalDay } from '../../core/utils/dateUtils';
import type { AppleHealthSleepStage } from '../../core/types/appleHealthContracts';

function overlapMs(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): number {
  const s = Math.max(aStart.getTime(), bStart.getTime());
  const e = Math.min(aEnd.getTime(), bEnd.getTime());
  return Math.max(0, e - s);
}

function isAsleepSleepAnalysisValue(value: number): boolean {
  return (
    value === CategoryValueSleepAnalysis.asleepUnspecified ||
    value === CategoryValueSleepAnalysis.asleepCore ||
    value === CategoryValueSleepAnalysis.asleepDeep ||
    value === CategoryValueSleepAnalysis.asleepREM
  );
}

function toSleepStage(value: number): AppleHealthSleepStage | null {
  const legacyAsleepValue = (CategoryValueSleepAnalysis as unknown as Record<string, number>).asleep;
  switch (value) {
    case legacyAsleepValue:
      return 'ASLEEP';
    case CategoryValueSleepAnalysis.asleepUnspecified:
      return 'ASLEEP_UNSPECIFIED';
    case CategoryValueSleepAnalysis.asleepCore:
      return 'CORE';
    case CategoryValueSleepAnalysis.asleepDeep:
      return 'DEEP';
    case CategoryValueSleepAnalysis.asleepREM:
      return 'REM';
    default:
      return null;
  }
}

function formatDateInDeviceLocalTz(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface AppleHealthSleepSegment {
  sleepStage: AppleHealthSleepStage;
  start: Date;
  end: Date;
  externalSampleId: string;
}

/**
 * Request read access for sleep analysis (time asleep segments).
 */
export async function ensureAppleHealthSleepReadAuthorization(): Promise<boolean> {
  const available = await isHealthDataAvailableAsync().catch(() => false);
  if (!available) return false;
  return requestAuthorization({
    toRead: ['HKCategoryTypeIdentifierSleepAnalysis'],
  });
}

/**
 * Total **asleep** hours overlapping the device's local calendar day containing `day`.
 * Queries a padded window so sessions crossing midnight are included; only the portion
 * overlapping [local midnight, next midnight) counts toward the total.
 */
export async function readAppleHealthAsleepHoursForLocalDay(day: Date): Promise<number | null> {
  const dayStart = startOfLocalDay(day);
  const dayEndExclusive = addLocalCalendarDays(dayStart, 1);

  const queryStart = addLocalCalendarDays(dayStart, -1);
  const queryEnd = addLocalCalendarDays(dayEndExclusive, 1);

  let samples: { startDate: Date; endDate: Date; value: number }[];
  try {
    samples = await queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
      limit: -1,
      ascending: true,
      filter: {
        date: {
          startDate: queryStart,
          endDate: queryEnd,
        },
      },
    });
  } catch {
    return null;
  }

  let asleepMs = 0;
  for (const s of samples) {
    if (!isAsleepSleepAnalysisValue(s.value)) continue;
    asleepMs += overlapMs(s.startDate, s.endDate, dayStart, dayEndExclusive);
  }

  const hours = asleepMs / (60 * 60 * 1000);
  return Math.round(hours * 100) / 100;
}

/**
 * Asleep hours grouped by stage for the local calendar day containing `day`.
 * Values are rounded to 2 decimals and zero-duration stages are excluded.
 */
export async function readAppleHealthAsleepStageHoursForLocalDay(
  day: Date
): Promise<AppleHealthSleepSegment[] | null> {
  const dayStart = startOfLocalDay(day);
  const targetLocalDate = formatDateInDeviceLocalTz(dayStart);

  const queryStart = addLocalCalendarDays(dayStart, -1);
  const queryEnd = addLocalCalendarDays(dayStart, 2);

  let samples: { startDate: Date; endDate: Date; value: number }[];
  try {
    samples = await queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
      limit: -1,
      ascending: true,
      filter: {
        date: {
          startDate: queryStart,
          endDate: queryEnd,
        },
      },
    });
  } catch {
    return null;
  }

  const byStage: AppleHealthSleepSegment[] = [];
  for (const s of samples) {
    if (!isAsleepSleepAnalysisValue(s.value)) continue;
    const stage = toSleepStage(s.value);
    if (!stage) continue;
    if (s.endDate.getTime() <= s.startDate.getTime()) continue;
    if (formatDateInDeviceLocalTz(s.endDate) !== targetLocalDate) continue;
    const externalSampleId = `HKCategoryTypeIdentifierSleepAnalysis:${stage}:${s.startDate.toISOString()}:${s.endDate.toISOString()}`;
    byStage.push({
      sleepStage: stage,
      start: s.startDate,
      end: s.endDate,
      externalSampleId,
    });
  }

  return byStage;
}
