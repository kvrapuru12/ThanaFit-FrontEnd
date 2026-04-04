import { parseDateLocal } from './dateUtils';

export type PhaseKey = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export function calculateCurrentPhase(
  lastPeriodStart: string,
  cycleLength: number
): PhaseKey {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = parseDateLocal(lastPeriodStart);
  startDate.setHours(0, 0, 0, 0);
  const daysSinceStart = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dayInCycle = ((daysSinceStart % cycleLength) + cycleLength) % cycleLength;

  if (dayInCycle < 5) return 'menstrual';
  if (dayInCycle < Math.floor(cycleLength / 2)) return 'follicular';
  if (dayInCycle === Math.floor(cycleLength / 2)) return 'ovulation';
  return 'luteal';
}

/** 1-based day index within the current cycle (clamped). */
export function getDayInCycle(lastPeriodStart: string, cycleLength: number): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = parseDateLocal(lastPeriodStart);
  startDate.setHours(0, 0, 0, 0);
  const daysSinceStart = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceStart < 0) return 1;
  const dayInCycle = daysSinceStart % cycleLength;
  return dayInCycle + 1;
}

export function calculateDaysUntilNextPeriod(
  lastPeriodStart: string,
  cycleLength: number
): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = parseDateLocal(lastPeriodStart);
  startDate.setHours(0, 0, 0, 0);
  const daysSinceStart = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dayInCycle = ((daysSinceStart % cycleLength) + cycleLength) % cycleLength;
  return cycleLength - dayInCycle;
}
