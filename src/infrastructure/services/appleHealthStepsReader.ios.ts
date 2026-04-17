import {
  isHealthDataAvailableAsync,
  queryStatisticsForQuantity,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit';
import { addLocalCalendarDays, startOfLocalDay } from '../../core/utils/dateUtils';

/**
 * Request read access for step count only (phase 1).
 */
export async function ensureAppleHealthStepReadAuthorization(): Promise<boolean> {
  const available = await isHealthDataAvailableAsync().catch(() => false);
  if (!available) return false;
  return requestAuthorization({
    toRead: ['HKQuantityTypeIdentifierStepCount'],
  });
}

/**
 * Total steps for the device's local calendar day containing `day`.
 */
export async function readAppleHealthStepTotalForLocalDay(day: Date): Promise<number | null> {
  const start = startOfLocalDay(day);
  const endExclusive = addLocalCalendarDays(start, 1);

  const stats = await queryStatisticsForQuantity(
    'HKQuantityTypeIdentifierStepCount',
    ['cumulativeSum'],
    {
      filter: {
        date: {
          startDate: start,
          endDate: endExclusive,
        },
      },
      unit: 'count',
    }
  );

  const sum = stats.sumQuantity?.quantity;
  if (sum == null || Number.isNaN(sum)) return null;
  return Math.round(sum);
}
