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
