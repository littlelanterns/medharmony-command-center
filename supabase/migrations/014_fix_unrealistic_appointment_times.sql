-- =====================================================
-- Migration 014: Fix Unrealistic Appointment Times
-- =====================================================
-- Moves appointments that are outside business hours (7 AM - 6 PM Central Time)
-- to reasonable times within business hours
-- Date: November 9, 2025

-- Function to shift a timestamp to reasonable business hours in Central Time
CREATE OR REPLACE FUNCTION shift_to_business_hours(ts TIMESTAMPTZ)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  hour_of_day INT;
  minute_of_hour INT;
  shifted_ts TIMESTAMPTZ;
  ts_central TIMESTAMPTZ;
BEGIN
  -- Convert to Central Time (America/Chicago) for checking
  ts_central := ts AT TIME ZONE 'America/Chicago';

  -- Extract the hour and minute in Central Time
  hour_of_day := EXTRACT(HOUR FROM ts_central)::INT;
  minute_of_hour := EXTRACT(MINUTE FROM ts_central)::INT;

  -- If before 7 AM Central Time, shift to 9 AM Central Time same day
  IF hour_of_day < 7 THEN
    -- Get the date part in Central Time, then add 9 hours
    shifted_ts := (DATE_TRUNC('day', ts_central) + INTERVAL '9 hours' + (minute_of_hour || ' minutes')::INTERVAL) AT TIME ZONE 'America/Chicago';
    RETURN shifted_ts;
  END IF;

  -- If after 6 PM (18:00) Central Time, shift to 2 PM Central Time same day
  IF hour_of_day >= 18 THEN
    -- Get the date part in Central Time, then add 14 hours (2 PM)
    shifted_ts := (DATE_TRUNC('day', ts_central) + INTERVAL '14 hours' + (minute_of_hour || ' minutes')::INTERVAL) AT TIME ZONE 'America/Chicago';
    RETURN shifted_ts;
  END IF;

  -- Otherwise, time is already within business hours
  RETURN ts;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update appointments that are outside business hours (checking in Central Time)
UPDATE appointments
SET
  scheduled_start = shift_to_business_hours(scheduled_start),
  scheduled_end = shift_to_business_hours(scheduled_start) + INTERVAL '30 minutes'
WHERE
  EXTRACT(HOUR FROM (scheduled_start AT TIME ZONE 'America/Chicago'))::INT < 7
  OR EXTRACT(HOUR FROM (scheduled_start AT TIME ZONE 'America/Chicago'))::INT >= 18;

-- Show what was fixed
SELECT
  COUNT(*) as total_appointments,
  SUM(CASE
    WHEN EXTRACT(HOUR FROM (scheduled_start AT TIME ZONE 'America/Chicago'))::INT >= 7
      AND EXTRACT(HOUR FROM (scheduled_start AT TIME ZONE 'America/Chicago'))::INT < 18
    THEN 1 ELSE 0 END) as appointments_in_business_hours,
  'Fixed appointments to be within Central Time business hours (7 AM - 6 PM)' as message
FROM appointments;

-- Drop the helper function
DROP FUNCTION shift_to_business_hours(TIMESTAMPTZ);
