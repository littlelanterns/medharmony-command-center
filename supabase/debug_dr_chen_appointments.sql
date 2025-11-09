-- =====================================================
-- Debug Query: Dr. Chen's Appointments
-- =====================================================
-- Run this in Supabase SQL Editor to see what appointments
-- Dr. Chen actually has in the database

-- Dr. Chen's ID: 10000000-0000-0000-0000-000000000003

SELECT
  a.id,
  a.scheduled_start,
  a.scheduled_start AT TIME ZONE 'America/Chicago' as start_central_time,
  a.scheduled_end AT TIME ZONE 'America/Chicago' as end_central_time,
  a.status,
  a.location,
  p.full_name as patient_name,
  o.title as appointment_type,
  EXTRACT(DOW FROM (a.scheduled_start AT TIME ZONE 'America/Chicago')) as day_of_week,
  EXTRACT(HOUR FROM (a.scheduled_start AT TIME ZONE 'America/Chicago')) as hour_central
FROM appointments a
JOIN users p ON a.patient_id = p.id
JOIN orders o ON a.order_id = o.id
WHERE a.provider_id = '10000000-0000-0000-0000-000000000003'
ORDER BY a.scheduled_start;

-- This will show:
-- - All of Dr. Chen's appointments
-- - Times in both UTC and Central Time
-- - What day of week (0=Sunday, 1=Monday, etc.)
-- - What hour in Central Time
