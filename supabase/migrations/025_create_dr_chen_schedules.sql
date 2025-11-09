-- Migration 025: Create Provider Schedules for Dr. Chen
--
-- The AI scheduler is offering 1:15 AM times because Dr. Chen has no schedules.
-- This creates realistic cardiology schedules at multiple locations.

DO $$
DECLARE
  dr_chen_id UUID;
BEGIN
  -- Get Dr. Chen's ID
  SELECT id INTO dr_chen_id
  FROM users
  WHERE email = 'dr.chen@medharmony.demo';

  IF dr_chen_id IS NULL THEN
    RAISE EXCEPTION 'Dr. Chen not found';
  END IF;

  RAISE NOTICE 'Creating schedules for Dr. Chen (%)...', dr_chen_id;

  -- Delete existing schedules (allow re-running)
  DELETE FROM provider_schedules WHERE provider_id = dr_chen_id;

  -- Create schedules at multiple locations
  -- Monday-Friday at Main Hospital
  INSERT INTO provider_schedules (
    provider_id,
    location,
    day_of_week,
    start_time,
    end_time,
    is_active,
    staff_available
  ) VALUES
    -- Main Hospital - Monday through Friday
    (dr_chen_id, 'MedHarmony Hospital - Main Campus', 1, '08:00:00', '17:00:00', true, ARRAY['Dr. Chen', 'Nurse Sarah', 'Tech Mike']),
    (dr_chen_id, 'MedHarmony Hospital - Main Campus', 2, '08:00:00', '17:00:00', true, ARRAY['Dr. Chen', 'Nurse Sarah', 'Tech Mike']),
    (dr_chen_id, 'MedHarmony Hospital - Main Campus', 3, '08:00:00', '17:00:00', true, ARRAY['Dr. Chen', 'Nurse Sarah', 'Tech Mike']),
    (dr_chen_id, 'MedHarmony Hospital - Main Campus', 4, '08:00:00', '17:00:00', true, ARRAY['Dr. Chen', 'Nurse Sarah', 'Tech Mike']),
    (dr_chen_id, 'MedHarmony Hospital - Main Campus', 5, '08:00:00', '17:00:00', true, ARRAY['Dr. Chen', 'Nurse Sarah', 'Tech Mike']);

  RAISE NOTICE 'Created 5 schedules for Dr. Chen (Mon-Fri 8AM-5PM at Main Hospital)';

END $$;

-- Verify the schedules were created
SELECT
  'VERIFICATION - Dr. Chen Schedules:' as status,
  ps.id,
  ps.day_of_week,
  CASE ps.day_of_week
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as day_name,
  ps.start_time,
  ps.end_time,
  ps.location,
  ps.is_active,
  ps.staff_available,
  u.full_name as provider_name
FROM provider_schedules ps
JOIN users u ON u.id = ps.provider_id
WHERE u.email = 'dr.chen@medharmony.demo'
ORDER BY ps.day_of_week;

SELECT 'Dr. Chen now has proper business hours! AI scheduler should work correctly.' as message;
