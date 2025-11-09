-- Migration 023: Check Dr. Chen's Provider Profile
--
-- The heart surgery order exists but isn't showing up.
-- This is likely because Dr. Chen doesn't have a provider_profile record.

-- Check if Dr. Chen exists in users
SELECT 'Dr. Chen in users table:' as check_type, id, full_name, email, role
FROM users
WHERE email = 'dr.chen@medharmony.demo';

-- Check if Dr. Chen has a provider_profile
SELECT 'Dr. Chen provider_profile:' as check_type, pp.*, u.full_name
FROM provider_profiles pp
JOIN users u ON u.id = pp.id
WHERE u.email = 'dr.chen@medharmony.demo';

-- Check if the order exists (we know it does from the error)
SELECT 'Heart surgery order exists:' as check_type,
  o.id,
  o.title,
  o.patient_id,
  o.provider_id,
  o.status,
  o.requires_confirmation,
  u.full_name as provider_name,
  CASE WHEN pp.id IS NULL THEN 'NO PROVIDER PROFILE!' ELSE 'has profile' END as profile_status
FROM orders o
LEFT JOIN users u ON u.id = o.provider_id
LEFT JOIN provider_profiles pp ON pp.id = o.provider_id
WHERE o.id = 'a0000000-0000-0000-0000-000000000010';

-- If Dr. Chen doesn't have a provider profile, create one
DO $$
DECLARE
  dr_chen_id UUID;
BEGIN
  SELECT id INTO dr_chen_id
  FROM users
  WHERE email = 'dr.chen@medharmony.demo';

  -- Check if provider profile exists
  IF NOT EXISTS (SELECT 1 FROM provider_profiles WHERE id = dr_chen_id) THEN
    RAISE NOTICE 'Creating provider profile for Dr. Chen...';

    INSERT INTO provider_profiles (
      id,
      specialty,
      license_number,
      phone,
      verified,
      accepting_new_patients
    ) VALUES (
      dr_chen_id,
      'Cardiology',
      'MO-CARD-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0'),
      '417-555-0003',
      true,
      true
    );

    RAISE NOTICE 'Provider profile created for Dr. Chen';
  ELSE
    RAISE NOTICE 'Dr. Chen already has a provider profile';
  END IF;
END $$;

-- Verify the fix
SELECT 'VERIFICATION - Order should now be visible:' as status,
  o.id,
  o.title,
  o.patient_id,
  o.provider_id,
  pp.specialty,
  u.full_name as provider_name
FROM orders o
JOIN users u ON u.id = o.provider_id
JOIN provider_profiles pp ON pp.id = o.provider_id
WHERE o.id = 'a0000000-0000-0000-0000-000000000010';

SELECT 'Dr. Chen provider profile check and fix complete!' as message;
