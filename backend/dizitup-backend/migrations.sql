-- ============================================================
-- DIZITUP — Additional SQL Migrations
-- Run these in your database AFTER the main schema
-- ============================================================

-- 1. Add username change counter to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username_change_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- 2. Add CRM pipeline tables
CREATE TABLE IF NOT EXISTS query_clients (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID        NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  status      VARCHAR(50) NOT NULL DEFAULT 'active',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_query_status CHECK (status IN ('active', 'converted', 'closed'))
);

CREATE TABLE IF NOT EXISTS onboard_clients (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   UUID         NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  contact_name VARCHAR(200) NOT NULL,
  email        VARCHAR(200) NOT NULL,
  company_name VARCHAR(200),
  phone        VARCHAR(50),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 3. Add portfolio table
CREATE TABLE IF NOT EXISTS portfolio (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  category     VARCHAR(100),
  image_url    TEXT,
  project_url  TEXT,
  tech_stack   TEXT[],
  completed_at DATE,
  is_featured  BOOLEAN      NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 4. Add subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan         VARCHAR(50) NOT NULL DEFAULT 'free',
  status       VARCHAR(20) NOT NULL DEFAULT 'active',
  renewal_date DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_sub_status CHECK (status IN ('active', 'cancelled', 'expired'))
);

-- 5. Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_query_clients_booking_id   ON query_clients(booking_id);
CREATE INDEX IF NOT EXISTS idx_query_clients_status      ON query_clients(status);
CREATE INDEX IF NOT EXISTS idx_onboard_clients_booking_id ON onboard_clients(booking_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_featured         ON portfolio(is_featured);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id      ON subscriptions(user_id);
