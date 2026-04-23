import { Pool } from 'pg';
import type { ReminderCandidate } from './types.js';

function toLocalDateString(timezone: string, date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function toLocalHourMinute(timezone: string, date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export async function evaluateReminderCandidates(pool: Pool, now: Date): Promise<ReminderCandidate[]> {
  const usersResult = await pool.query(
    `
    SELECT
      np.user_id AS "userId",
      np.food_reminder_enabled AS "foodEnabled",
      np.activity_reminder_enabled AS "activityEnabled",
      np.cycle_phase_reminder_enabled AS "cycleEnabled",
      TO_CHAR(np.reminder_time_local, 'HH24:MI') AS "reminderTime",
      np.timezone AS timezone
    FROM notification_preferences np
    `
  );

  const candidates: ReminderCandidate[] = [];

  for (const userRow of usersResult.rows) {
    const userId = Number(userRow.userId);
    const timezone = String(userRow.timezone || 'UTC');
    const localDate = toLocalDateString(timezone, now);
    const localTime = toLocalHourMinute(timezone, now);
    const reminderTime = String(userRow.reminderTime);
    const reachedReminderWindow = localTime >= reminderTime;
    if (!reachedReminderWindow) continue;

    if (userRow.foodEnabled) {
      const foodResult = await pool.query(
        `
        SELECT 1
        FROM food_logs
        WHERE user_id = $1
          AND DATE(logged_at AT TIME ZONE $2) = $3::date
        LIMIT 1
        `,
        [userId, timezone, localDate]
      );
      if (foodResult.rowCount === 0) {
        candidates.push({
          userId,
          timezone,
          targetType: 'food_missing',
          localDate,
          targetTab: 'food',
          title: 'Log your meals today',
          body: 'You have not logged food yet. Add meals to keep your nutrition plan on track.',
          dedupeKey: `food_missing:${userId}:${localDate}`,
        });
      }
    }

    if (userRow.activityEnabled) {
      const activityResult = await pool.query(
        `
        SELECT 1
        FROM activity_logs
        WHERE user_id = $1
          AND DATE(logged_at AT TIME ZONE $2) = $3::date
        LIMIT 1
        `,
        [userId, timezone, localDate]
      );
      if (activityResult.rowCount === 0) {
        candidates.push({
          userId,
          timezone,
          targetType: 'activity_missing',
          localDate,
          targetTab: 'exercise',
          title: 'Track your activity',
          body: 'You have not logged activity yet. Add your workouts to complete your day.',
          dedupeKey: `activity_missing:${userId}:${localDate}`,
        });
      }
    }

    if (userRow.cycleEnabled) {
      const phaseResult = await pool.query(
        `
        SELECT
          CASE
            WHEN c.id IS NULL THEN NULL
            WHEN (
              ((DATE($1 AT TIME ZONE $3) - c.period_start_date)::int % c.cycle_length) + 1
            ) <= c.period_duration THEN 'menstrual'
            WHEN (
              ((DATE($1 AT TIME ZONE $3) - c.period_start_date)::int % c.cycle_length) + 1
            ) BETWEEN c.period_duration + 1 AND 13 THEN 'follicular'
            WHEN (
              ((DATE($1 AT TIME ZONE $3) - c.period_start_date)::int % c.cycle_length) + 1
            ) BETWEEN 14 AND 16 THEN 'ovulation'
            ELSE 'luteal'
          END AS current_phase
        FROM cycles c
        WHERE c.user_id = $2
        ORDER BY c.period_start_date DESC
        LIMIT 1
        `,
        [now.toISOString(), userId, timezone]
      );

      const currentPhase = phaseResult.rows[0]?.current_phase as string | undefined;
      if (currentPhase) {
        const previousPhaseResult = await pool.query(
          `SELECT last_phase FROM notification_phase_state WHERE user_id = $1`,
          [userId]
        );
        const previousPhase = previousPhaseResult.rows[0]?.last_phase as string | undefined;

        if (!previousPhase || previousPhase !== currentPhase) {
          await pool.query(
            `
            INSERT INTO notification_phase_state (user_id, last_phase, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET last_phase = EXCLUDED.last_phase, updated_at = NOW()
            `,
            [userId, currentPhase]
          );

          candidates.push({
            userId,
            timezone,
            targetType: 'cycle_phase_change',
            localDate,
            targetTab: 'cyclesync',
            title: 'Cycle phase update',
            body: `You are now in ${currentPhase} phase. Check your food and activity guidance.`,
            dedupeKey: `cycle_phase_change:${userId}:${currentPhase}:${localDate}`,
          });
        }
      }
    }
  }

  return candidates;
}
