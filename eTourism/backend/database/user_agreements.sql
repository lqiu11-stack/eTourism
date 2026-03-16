-- User agreement acceptance records (id, user_id, agreed_at).
-- Run once against your PostgreSQL DB, e.g. psql $DATABASE_URL -f database/user_agreements.sql
CREATE TABLE IF NOT EXISTS user_agreements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  agreed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
