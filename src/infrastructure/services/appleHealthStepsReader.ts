/**
 * Non-iOS stub: Apple Health / HealthKit is iOS-only.
 */
export async function ensureAppleHealthStepReadAuthorization(): Promise<boolean> {
  return false;
}

export async function readAppleHealthStepTotalForLocalDay(
  _day: Date
): Promise<number | null> {
  return null;
}
