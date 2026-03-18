-- Booking Preferences (EH-05) PostgreSQL migration

BEGIN;

CREATE TABLE IF NOT EXISTS experience_booking_preferences (
  id BIGSERIAL PRIMARY KEY,
  experience_id BIGINT NOT NULL UNIQUE REFERENCES experiences(id) ON DELETE CASCADE,
  min_notice_minutes INTEGER NOT NULL DEFAULT 0,
  min_group_size INTEGER NOT NULL DEFAULT 1,
  max_group_size INTEGER NULL,
  group_rule VARCHAR(50) NOT NULL DEFAULT 'any',
  cancellation_policy JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experience_booking_preferences_experience_id
  ON experience_booking_preferences (experience_id);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS group_gender_breakdown JSONB NULL;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cancellation_policy_snapshot JSONB NULL;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_experience_booking_preferences_set_updated_at ON experience_booking_preferences;

CREATE TRIGGER trg_experience_booking_preferences_set_updated_at
BEFORE UPDATE ON experience_booking_preferences
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
