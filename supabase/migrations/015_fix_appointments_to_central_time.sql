-- =====================================================
-- Migration 015: Fix Appointments to Central Time Business Hours
-- =====================================================
-- Direct fix for appointments showing at wrong times
-- Ensures all appointments are during 7 AM - 6 PM Central Time
-- Date: November 9, 2025

-- Update all appointments to be at sensible times in Central Time
-- For any appointment outside business hours, shift to 9:15 AM Central Time
UPDATE appointments
SET
  scheduled_start = CASE
    -- If the hour in Central Time is outside 7 AM - 6 PM, set to 9:15 AM Central
    WHEN EXTRACT(HOUR FROM (scheduled_start AT TIME ZONE 'America/Chicago'))::INT < 7
      OR EXTRACT(HOUR FROM (scheduled_start AT TIME ZONE 'America/Chicago'))::INT >= 18
    THEN
      -- Get the date, set time to 9:15 AM in Central Time, convert to UTC for storage
      (DATE_TRUNC('day', scheduled_start AT TIME ZONE 'America/Chicago')::date || ' 09:15:00')::timestamp AT TIME ZONE 'America/Chicago'
    ELSE
      scheduled_start
  END,
  scheduled_end = CASE
    WHEN EXTRACT(HOUR FROM (scheduled_start AT TIME ZONE 'America/Chicago'))::INT < 7
      OR EXTRACT(HOUR FROM (scheduled_start AT TIME ZONE 'America/Chicago'))::INT >= 18
    THEN
      -- Set end time to 9:45 AM Central Time (30 minutes after start)
      (DATE_TRUNC('day', scheduled_start AT TIME ZONE 'America/Chicago')::date || ' 09:45:00')::timestamp AT TIME ZONE 'America/Chicago'
    ELSE
      scheduled_end
  END;

-- Verify all appointments are now in business hours
SELECT
  COUNT(*) as total_appointments,
  COUNT(*) FILTER (
    WHERE EXTRACT(HOUR FROM (scheduled_start AT TIME ZONE 'America/Chicago'))::INT >= 7
      AND EXTRACT(HOUR FROM (scheduled_start AT TIME ZONE 'America/Chicago'))::INT < 18
  ) as appointments_in_business_hours
FROM appointments;
