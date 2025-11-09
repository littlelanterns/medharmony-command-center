-- Provider Time Blocks for vacation, sick days, emergencies
-- Allows providers to block specific date/time ranges

CREATE TABLE IF NOT EXISTS provider_time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Time range to block
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,

  -- Reason for blocking
  block_type TEXT NOT NULL CHECK (block_type IN ('vacation', 'sick_day', 'emergency', 'conference', 'personal', 'other')),
  reason TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Notification tracking
  affected_patients_notified BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_provider_time_blocks_provider_id ON provider_time_blocks(provider_id);
CREATE INDEX idx_provider_time_blocks_datetime ON provider_time_blocks(start_datetime, end_datetime);
CREATE INDEX idx_provider_time_blocks_active ON provider_time_blocks(is_active);

-- Grant permissions
GRANT ALL ON provider_time_blocks TO anon, authenticated;
