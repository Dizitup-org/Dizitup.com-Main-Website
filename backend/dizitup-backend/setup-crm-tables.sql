-- ============================================================
-- CRM PIPELINE SETUP
-- Run this SQL script in your PostgreSQL database to create
-- the required tables for the admin CRM pipeline
-- ============================================================

-- Create query_clients table for follow-up pipeline
CREATE TABLE IF NOT EXISTS query_clients (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID        NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  status      VARCHAR(50) NOT NULL DEFAULT 'active',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_query_status CHECK (status IN ('active', 'converted', 'closed'))
);

-- Create onboard_clients table for onboarded clients
CREATE TABLE IF NOT EXISTS onboard_clients (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   UUID         NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  contact_name VARCHAR(200) NOT NULL,
  email        VARCHAR(200) NOT NULL,
  company_name VARCHAR(200),
  phone        VARCHAR(50),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_query_clients_booking_id   ON query_clients(booking_id);
CREATE INDEX IF NOT EXISTS idx_query_clients_status      ON query_clients(status);
CREATE INDEX IF NOT EXISTS idx_onboard_clients_booking_id ON onboard_clients(booking_id);

-- Verify tables were created
SELECT 'query_clients table created' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'query_clients');

SELECT 'onboard_clients table created' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'onboard_clients');