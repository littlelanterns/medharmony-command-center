-- =====================================================
-- Migration 013: Fix Appointment Times to Standard Slots
-- =====================================================
-- Rounds all appointment times to standard 15-minute scheduling slots
-- Standard slots: :00, :15, :30, :45
-- Ensures all appointments are exactly 30 minutes in duration
-- Date: November 9, 2025

-- Function to round a timestamp to the nearest 15-minute interval
CREATE OR REPLACE FUNCTION round_to_15_minutes(ts TIMESTAMPTZ)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  minutes INT;
  rounded_minutes INT;
BEGIN
  minutes := EXTRACT(MINUTE FROM ts)::INT;

  -- Round to nearest 15-minute mark
  -- 0-7 -> :00, 8-22 -> :15, 23-37 -> :30, 38-52 -> :45, 53-59 -> :00 (next hour)
  rounded_minutes := CASE
    WHEN minutes < 8 THEN 0
    WHEN minutes < 23 THEN 15
    WHEN minutes < 38 THEN 30
    WHEN minutes < 53 THEN 45
    ELSE 0  -- Round 53-59 up to next hour
  END;

  -- If rounding up to next hour (minutes >= 53)
  IF minutes >= 53 THEN
    RETURN DATE_TRUNC('hour', ts) + INTERVAL '1 hour';
  ELSE
    RETURN DATE_TRUNC('hour', ts) + (rounded_minutes || ' minutes')::INTERVAL;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update all appointments to use rounded 15-minute slots
-- Start time is rounded to nearest 15-minute mark (:00, :15, :30, :45)
-- End time is set to exactly 30 minutes after start time
UPDATE appointments
SET
  scheduled_start = round_to_15_minutes(scheduled_start),
  scheduled_end = round_to_15_minutes(scheduled_start) + INTERVAL '30 minutes';

-- Verify the update
SELECT
  COUNT(*) as total_appointments,
  MIN(scheduled_start) as earliest_appointment,
  MAX(scheduled_start) as latest_appointment,
  'All appointments fixed to use standard 15-minute slots (:00, :15, :30, :45)' as message
FROM appointments;

-- Drop the helper function (no longer needed after migration)
DROP FUNCTION round_to_15_minutes(TIMESTAMPTZ);
