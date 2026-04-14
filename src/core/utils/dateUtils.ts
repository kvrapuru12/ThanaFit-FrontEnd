/**
 * Format date as YYYY-MM-DD in local timezone.
 * Use this instead of toISOString().split('T')[0] to avoid timezone offset issues
 * (e.g. UTC midnight can appear as previous day in some timezones).
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse date string (YYYY-MM-DD) in local timezone.
 */
export function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Start of the given calendar day in the device local timezone. */
export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addLocalCalendarDays(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta);
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * For food/activity logs on a past local calendar day, returns a stable
 * timestamp string (local noon as ISO). For today, returns undefined so callers
 * use current time.
 */
export function loggedAtIsoForBackdatedLocalDay(day: Date): string | undefined {
  const normalized = startOfLocalDay(day);
  const today = startOfLocalDay(new Date());
  if (normalized.getTime() === today.getTime()) {
    return undefined;
  }
  const atNoon = new Date(
    normalized.getFullYear(),
    normalized.getMonth(),
    normalized.getDate(),
    12,
    0,
    0,
    0
  );
  return atNoon.toISOString().slice(0, 19) + 'Z';
}
