-- Migration 021: Debug Ruthie's Heart Surgery Order
--
-- Check if the order exists and verify all related data

-- Check if Ruthie exists
SELECT 'Ruthie Patient Record:' as check_type, id, full_name, email, role
FROM users
WHERE id = '20000000-0000-0000-0000-000000000006';

-- Check if Dr. Chen exists
SELECT 'Dr. Chen Record:' as check_type, id, full_name, email, role
FROM users
WHERE email = 'dr.chen@medharmony.demo';

-- Check if Dr. Chen has a provider profile
SELECT 'Dr. Chen Provider Profile:' as check_type, pp.*, u.full_name
FROM provider_profiles pp
JOIN users u ON u.id = pp.id
WHERE u.email = 'dr.chen@medharmony.demo';

-- Check if the heart surgery order exists
SELECT 'Heart Surgery Order:' as check_type, *
FROM orders
WHERE id = 'a0000000-0000-0000-0000-000000000010';

-- Check ALL orders for Ruthie
SELECT 'All Ruthie Orders:' as check_type, o.id, o.title, o.status, o.priority, o.estimated_revenue, o.requires_confirmation, o.duration_minutes, o.provider_id
FROM orders o
WHERE o.patient_id = '20000000-0000-0000-0000-000000000006';

-- Check if Jennifer has access to Ruthie
SELECT 'Jennifer-Ruthie Relationship:' as check_type, *
FROM caregiver_relationships
WHERE caregiver_id = '20000000-0000-0000-0000-000000000001'
AND patient_id = '20000000-0000-0000-0000-000000000006';

-- Check prerequisites for the surgery
SELECT 'Surgery Prerequisites:' as check_type, *
FROM prerequisites
WHERE order_id = 'a0000000-0000-0000-0000-000000000010';

SELECT 'Debug complete. Check results above.' as message;
