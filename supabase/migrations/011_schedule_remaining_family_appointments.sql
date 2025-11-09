-- =====================================================
-- Migration 011: Schedule Remaining Family Appointments
-- =====================================================
-- Ensures each family member has at least one scheduled appointment
-- Adds recurring speech therapy for Ruthie (Tuesdays at 2:00 PM)

-- =====================================================
-- 1. SCHEDULE EMMA'S A1C TEST
-- =====================================================

INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000005',
   '30000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000002',
   (NOW() + INTERVAL '4 days' + INTERVAL '9 hours')::TIMESTAMPTZ,
   (NOW() + INTERVAL '4 days' + INTERVAL '9 hours 30 minutes')::TIMESTAMPTZ,
   'Endocrinology & Diabetes Center',
   ARRAY['Lab Tech Maria', 'Diabetes Educator Tom'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Update Emma's order to scheduled status
UPDATE orders
SET status = 'scheduled'
WHERE id = '30000000-0000-0000-0000-000000000001';

-- =====================================================
-- 2. SCHEDULE LUCAS'S ADHD MEDICATION FOLLOW-UP
-- =====================================================

INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000006',
   '30000000-0000-0000-0000-000000000003',
   '20000000-0000-0000-0000-000000000003',
   '10000000-0000-0000-0000-000000000004',
   (NOW() + INTERVAL '6 days' + INTERVAL '15 hours')::TIMESTAMPTZ,
   (NOW() + INTERVAL '6 days' + INTERVAL '16 hours')::TIMESTAMPTZ,
   'Behavioral Health Center',
   ARRAY['Therapist Sarah', 'Medical Assistant Jake'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Update Lucas's order to scheduled status
UPDATE orders
SET status = 'scheduled'
WHERE id = '30000000-0000-0000-0000-000000000003';

-- =====================================================
-- 3. SCHEDULE SOFIA'S WELL-CHILD VISIT
-- =====================================================

INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000007',
   '30000000-0000-0000-0000-000000000005',
   '20000000-0000-0000-0000-000000000004',
   '10000000-0000-0000-0000-000000000001',
   (NOW() + INTERVAL '7 days' + INTERVAL '10 hours')::TIMESTAMPTZ,
   (NOW() + INTERVAL '7 days' + INTERVAL '11 hours')::TIMESTAMPTZ,
   'Primary Care Medical Group',
   ARRAY['Nurse Brenda', 'Medical Assistant Kim'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Update Sofia's order to scheduled status
UPDATE orders
SET status = 'scheduled'
WHERE id = '30000000-0000-0000-0000-000000000005';

-- =====================================================
-- 4. ADD RECURRING SPEECH THERAPY FOR RUTHIE
-- =====================================================
-- Tuesdays at 2:00 PM for the next 4 weeks

-- Helper function to get next Tuesday from a given date
-- We'll calculate the next 4 Tuesdays from today

-- Week 1: Next Tuesday at 2:00 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000008',
   '40000000-0000-0000-0000-000000000005',
   '20000000-0000-0000-0000-000000000006',
   '10000000-0000-0000-0000-000000000001',
   -- Calculate next Tuesday at 2:00 PM
   (DATE_TRUNC('week', NOW()) + INTERVAL '1 day' + INTERVAL '14 hours' +
    CASE
      WHEN EXTRACT(DOW FROM NOW()) <= 2 THEN INTERVAL '0 days'
      ELSE INTERVAL '7 days'
    END)::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '1 day' + INTERVAL '15 hours' +
    CASE
      WHEN EXTRACT(DOW FROM NOW()) <= 2 THEN INTERVAL '0 days'
      ELSE INTERVAL '7 days'
    END)::TIMESTAMPTZ,
   'Primary Care Medical Group',
   ARRAY['Speech Therapist Linda'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Week 2: Tuesday at 2:00 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000009',
   '40000000-0000-0000-0000-000000000005',
   '20000000-0000-0000-0000-000000000006',
   '10000000-0000-0000-0000-000000000001',
   (DATE_TRUNC('week', NOW()) + INTERVAL '1 day' + INTERVAL '14 hours' + INTERVAL '7 days' +
    CASE
      WHEN EXTRACT(DOW FROM NOW()) <= 2 THEN INTERVAL '0 days'
      ELSE INTERVAL '7 days'
    END)::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '1 day' + INTERVAL '15 hours' + INTERVAL '7 days' +
    CASE
      WHEN EXTRACT(DOW FROM NOW()) <= 2 THEN INTERVAL '0 days'
      ELSE INTERVAL '7 days'
    END)::TIMESTAMPTZ,
   'Primary Care Medical Group',
   ARRAY['Speech Therapist Linda'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Week 3: Tuesday at 2:00 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-00000000000A',
   '40000000-0000-0000-0000-000000000005',
   '20000000-0000-0000-0000-000000000006',
   '10000000-0000-0000-0000-000000000001',
   (DATE_TRUNC('week', NOW()) + INTERVAL '1 day' + INTERVAL '14 hours' + INTERVAL '14 days' +
    CASE
      WHEN EXTRACT(DOW FROM NOW()) <= 2 THEN INTERVAL '0 days'
      ELSE INTERVAL '7 days'
    END)::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '1 day' + INTERVAL '15 hours' + INTERVAL '14 days' +
    CASE
      WHEN EXTRACT(DOW FROM NOW()) <= 2 THEN INTERVAL '0 days'
      ELSE INTERVAL '7 days'
    END)::TIMESTAMPTZ,
   'Primary Care Medical Group',
   ARRAY['Speech Therapist Linda'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Week 4: Tuesday at 2:00 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-00000000000B',
   '40000000-0000-0000-0000-000000000005',
   '20000000-0000-0000-0000-000000000006',
   '10000000-0000-0000-0000-000000000001',
   (DATE_TRUNC('week', NOW()) + INTERVAL '1 day' + INTERVAL '14 hours' + INTERVAL '21 days' +
    CASE
      WHEN EXTRACT(DOW FROM NOW()) <= 2 THEN INTERVAL '0 days'
      ELSE INTERVAL '7 days'
    END)::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '1 day' + INTERVAL '15 hours' + INTERVAL '21 days' +
    CASE
      WHEN EXTRACT(DOW FROM NOW()) <= 2 THEN INTERVAL '0 days'
      ELSE INTERVAL '7 days'
    END)::TIMESTAMPTZ,
   'Primary Care Medical Group',
   ARRAY['Speech Therapist Linda'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Update Ruthie's speech therapy order to scheduled status
UPDATE orders
SET status = 'scheduled'
WHERE id = '40000000-0000-0000-0000-000000000005';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

SELECT 'All family members now have scheduled appointments! Emma, Lucas, and Sofia have appointments. Ruthie has 4 recurring speech therapy sessions on Tuesdays at 2:00 PM.' as message;
