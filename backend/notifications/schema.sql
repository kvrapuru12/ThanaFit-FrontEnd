CREATE TABLE IF NOT EXISTS notification_devices (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  device_id TEXT NOT NULL,
  expo_push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  timezone TEXT NOT NULL,
  app_version TEXT,
  build_number TEXT,
  device_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (device_id),
  UNIQUE (user_id, expo_push_token)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id BIGINT PRIMARY KEY,
  food_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  activity_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  cycle_phase_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_time_local TIME NOT NULL DEFAULT '20:00',
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  quiet_hours_start TIME NOT NULL DEFAULT '22:00',
  quiet_hours_end TIME NOT NULL DEFAULT '07:00',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_delivery_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  device_id TEXT NOT NULL,
  type TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  local_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'opened')),
  provider_ticket_id TEXT,
  provider_receipt_id TEXT,
  error_code TEXT,
  error_details TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_phase_state (
  user_id BIGINT PRIMARY KEY,
  last_phase TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_devices_user_active
  ON notification_devices (user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_notification_log_user_type_date
  ON notification_delivery_log (user_id, type, local_date);
