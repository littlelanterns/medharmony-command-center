-- Migration 024: Check if Dr. Chen has provider schedules
-- The AI scheduler is offering 1:15 AM times - likely because Dr. Chen has no schedules

-- Check if Dr. Chen has schedules
SELECT 'Dr. Chen schedules:' as check_type,
  ps.id, ps.provider_id, ps.day_of_week, ps.start_time, ps.end_time,
  ps.location, ps.is_active, u.full_name
FROM provider_schedules ps
JOIN users u ON u.id = ps.provider_id
WHERE u.email = 'dr.chen@medharmony.demo'
ORDER BY ps.day_of_week;

-- Count schedules
SELECT 'Total schedules for Dr. Chen:' as check_type, COUNT(*) as schedule_count
FROM provider_schedules ps
JOIN users u ON u.id = ps.provider_id
WHERE u.email = 'dr.chen@medharmony.demo';

SELECT 'Check complete!' as message;
