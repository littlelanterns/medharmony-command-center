-- Migration 020: Add Spendable Karma Points System
--
-- Separates karma into two types:
-- 1. karma_score: Behavioral score (existing) - reflects patient reliability
-- 2. karma_points: Spendable currency - doctor-given rewards
--
-- This allows doctors to thank patients and patients to spend points on benefits

-- Add karma_points column to patient_profiles
ALTER TABLE patient_profiles
ADD COLUMN IF NOT EXISTS karma_points INTEGER DEFAULT 0;

COMMENT ON COLUMN patient_profiles.karma_points IS 'Spendable karma currency given by providers as rewards';

-- Create karma_transactions table to track point awards and spending
CREATE TABLE IF NOT EXISTS karma_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID REFERENCES users(id), -- NULL if system-generated
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('award', 'spend', 'bonus', 'penalty')),
  points INTEGER NOT NULL, -- Positive for awards, negative for spending
  reason TEXT NOT NULL,
  related_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_karma_transactions_patient ON karma_transactions(patient_id);
CREATE INDEX idx_karma_transactions_provider ON karma_transactions(provider_id);
CREATE INDEX idx_karma_transactions_created ON karma_transactions(created_at DESC);

COMMENT ON TABLE karma_transactions IS 'Tracks all karma point awards and spending';

-- Give all existing patients some starting karma points
UPDATE patient_profiles
SET karma_points = 100
WHERE karma_points = 0;

-- Insert initial transaction records for existing patients
INSERT INTO karma_transactions (patient_id, transaction_type, points, reason)
SELECT id, 'bonus', 100, 'Welcome bonus - thank you for being part of our practice!'
FROM users
WHERE role = 'patient'
ON CONFLICT DO NOTHING;

SELECT 'Added karma points system with transactions tracking. All patients start with 100 karma points!' as message;
