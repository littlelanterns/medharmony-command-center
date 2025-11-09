-- =====================================================
-- Migration 016: Fix Ruthie's Appointment for Dr. Chen
-- =====================================================
-- Updates Ruthie's cardiology appointment to have a proper future date
-- in Central Time during business hours
-- Date: November 9, 2025

-- Update Ruthie's cardiology appointment to be next week at 10:00 AM Central Time
UPDATE appointments
SET
  scheduled_start = ((CURRENT_DATE + INTERVAL '7 days') + TIME '10:00:00') AT TIME ZONE 'America/Chicago',
  scheduled_end = ((CURRENT_DATE + INTERVAL '7 days') + TIME '11:30:00') AT TIME ZONE 'America/Chicago'
WHERE id = '50000000-0000-0000-0000-000000000001';

-- Verify the update
SELECT
  a.id,
  a.scheduled_start AT TIME ZONE 'America/Chicago' as start_central,
  a.scheduled_end AT TIME ZONE 'America/Chicago' as end_central,
  p.full_name as patient,
  prov.full_name as provider,
  o.title as appointment_type
FROM appointments a
JOIN users p ON a.patient_id = p.id
JOIN users prov ON a.provider_id = prov.id
JOIN orders o ON a.order_id = o.id
WHERE a.id = '50000000-0000-0000-0000-000000000001';
