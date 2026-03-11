-- Meeting Link Configuration (PostgreSQL)
-- Creates a per-experience meeting link template configured by eHost.

BEGIN;

CREATE TABLE IF NOT EXISTS experience_meeting_links (
  id BIGSERIAL PRIMARY KEY,
  experience_id BIGINT NOT NULL UNIQUE REFERENCES experiences(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  meeting_url TEXT NOT NULL,
  meeting_password TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experience_meeting_links_experience_id
  ON experience_meeting_links (experience_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_experience_meeting_links_set_updated_at ON experience_meeting_links;

CREATE TRIGGER trg_experience_meeting_links_set_updated_at
BEFORE UPDATE ON experience_meeting_links
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
