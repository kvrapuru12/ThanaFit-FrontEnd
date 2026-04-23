import { Pool } from 'pg';
import type { DeviceRecord, NotificationPreferences, RegisterDeviceRequest, ReminderCandidate } from './types.js';

export class NotificationRepository {
  constructor(private readonly pool: Pool) {}

  async upsertDevice(payload: RegisterDeviceRequest, deviceId: string): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO notification_devices
      (user_id, device_id, expo_push_token, platform, timezone, app_version, build_number, device_name, is_active, last_seen_at, updated_at)
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, NOW(), NOW())
      ON CONFLICT (device_id)
      DO UPDATE SET
        expo_push_token = EXCLUDED.expo_push_token,
        timezone = EXCLUDED.timezone,
        app_version = EXCLUDED.app_version,
        build_number = EXCLUDED.build_number,
        device_name = EXCLUDED.device_name,
        is_active = TRUE,
        last_seen_at = NOW(),
        updated_at = NOW()
      `,
      [
        payload.userId,
        deviceId,
        payload.token,
        payload.platform,
        payload.timezone,
        payload.appVersion ?? null,
        payload.buildNumber ?? null,
        payload.deviceName ?? null,
      ]
    );
  }

  async deactivateDevice(userId: number, deviceId: string): Promise<void> {
    await this.pool.query(
      `UPDATE notification_devices SET is_active = FALSE, updated_at = NOW() WHERE device_id = $1 AND user_id = $2`,
      [deviceId, userId]
    );
  }

  async getPreferences(userId: number): Promise<NotificationPreferences> {
    const result = await this.pool.query(
      `
      SELECT
        food_reminder_enabled AS "foodReminderEnabled",
        activity_reminder_enabled AS "activityReminderEnabled",
        cycle_phase_reminder_enabled AS "cyclePhaseReminderEnabled",
        TO_CHAR(reminder_time_local, 'HH24:MI') AS "reminderTimeLocal",
        quiet_hours_enabled AS "quietHoursEnabled",
        TO_CHAR(quiet_hours_start, 'HH24:MI') AS "quietHoursStart",
        TO_CHAR(quiet_hours_end, 'HH24:MI') AS "quietHoursEnd",
        timezone
      FROM notification_preferences
      WHERE user_id = $1
      `,
      [userId]
    );

    if (result.rowCount && result.rows[0]) {
      return result.rows[0] as NotificationPreferences;
    }

    await this.pool.query(
      `INSERT INTO notification_preferences (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );
    return this.getPreferences(userId);
  }

  async upsertPreferences(userId: number, preferences: NotificationPreferences): Promise<NotificationPreferences> {
    await this.pool.query(
      `
      INSERT INTO notification_preferences
      (user_id, food_reminder_enabled, activity_reminder_enabled, cycle_phase_reminder_enabled, reminder_time_local, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone, updated_at)
      VALUES
      ($1, $2, $3, $4, $5::time, $6, $7::time, $8::time, $9, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        food_reminder_enabled = EXCLUDED.food_reminder_enabled,
        activity_reminder_enabled = EXCLUDED.activity_reminder_enabled,
        cycle_phase_reminder_enabled = EXCLUDED.cycle_phase_reminder_enabled,
        reminder_time_local = EXCLUDED.reminder_time_local,
        quiet_hours_enabled = EXCLUDED.quiet_hours_enabled,
        quiet_hours_start = EXCLUDED.quiet_hours_start,
        quiet_hours_end = EXCLUDED.quiet_hours_end,
        timezone = EXCLUDED.timezone,
        updated_at = NOW()
      `,
      [
        userId,
        preferences.foodReminderEnabled,
        preferences.activityReminderEnabled,
        preferences.cyclePhaseReminderEnabled,
        preferences.reminderTimeLocal,
        preferences.quietHoursEnabled,
        preferences.quietHoursStart,
        preferences.quietHoursEnd,
        preferences.timezone,
      ]
    );
    return this.getPreferences(userId);
  }

  async getActiveDevicesByUser(userId: number): Promise<DeviceRecord[]> {
    const result = await this.pool.query(
      `
      SELECT user_id AS "userId", device_id AS "deviceId", expo_push_token AS "token"
      FROM notification_devices
      WHERE user_id = $1 AND is_active = TRUE
      `,
      [userId]
    );
    return result.rows as DeviceRecord[];
  }

  async isDedupeKeyAlreadySent(dedupeKey: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM notification_delivery_log WHERE dedupe_key = $1 LIMIT 1`,
      [dedupeKey]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async enqueueLog(candidate: ReminderCandidate, device: DeviceRecord): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO notification_delivery_log
      (user_id, device_id, type, dedupe_key, local_date, status, created_at)
      VALUES
      ($1, $2, $3, $4, $5::date, 'queued', NOW())
      ON CONFLICT (dedupe_key) DO NOTHING
      `,
      [candidate.userId, device.deviceId, candidate.targetType, `${candidate.dedupeKey}:${device.deviceId}`, candidate.localDate]
    );
  }

  async markSent(dedupeKeyWithDevice: string, ticketId: string): Promise<void> {
    await this.pool.query(
      `
      UPDATE notification_delivery_log
      SET status = 'sent', provider_ticket_id = $2, sent_at = NOW()
      WHERE dedupe_key = $1
      `,
      [dedupeKeyWithDevice, ticketId]
    );
  }

  async markFailed(dedupeKeyWithDevice: string, errorCode: string, errorDetails: string): Promise<void> {
    await this.pool.query(
      `
      UPDATE notification_delivery_log
      SET status = 'failed', error_code = $2, error_details = $3
      WHERE dedupe_key = $1
      `,
      [dedupeKeyWithDevice, errorCode, errorDetails]
    );
  }

  async markDeliveredByTicket(ticketId: string): Promise<void> {
    await this.pool.query(
      `
      UPDATE notification_delivery_log
      SET status = 'delivered', delivered_at = NOW()
      WHERE provider_ticket_id = $1
      `,
      [ticketId]
    );
  }

  async deactivateByToken(token: string): Promise<void> {
    await this.pool.query(
      `UPDATE notification_devices SET is_active = FALSE, updated_at = NOW() WHERE expo_push_token = $1`,
      [token]
    );
  }
}
