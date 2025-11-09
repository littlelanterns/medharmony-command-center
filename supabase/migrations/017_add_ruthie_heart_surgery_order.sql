-- Migration 017: Add Heart Surgery Order for Ruthie
--
-- Adds a heart surgery order from Dr. Chen that requires confirmation
-- Note: duration_minutes will be set by migration 018

-- Get Ruthie's ID and Dr. Chen's ID
DO $$
DECLARE
  ruthie_id UUID := '20000000-0000-0000-0000-000000000006';
  dr_chen_id UUID;
BEGIN
  -- Get Dr. Chen's provider ID
  SELECT id INTO dr_chen_id
  FROM users
  WHERE email = 'dr.chen@medharmony.demo';

  -- Insert heart surgery order
  INSERT INTO orders (
    id,
    patient_id,
    provider_id,
    order_type,
    title,
    description,
    status,
    priority,
    estimated_revenue,
    requires_confirmation,
    duration_minutes,
    created_at
  ) VALUES (
    'a0000000-0000-0000-0000-000000000010',
    ruthie_id,
    dr_chen_id,
    'procedure',
    'Cardiac Surgery - Ventricular Septal Defect Repair',
    'Surgical repair of VSD (hole in heart wall between ventricles). This is a common procedure for children with Down syndrome to prevent complications. Pre-op evaluation completed, surgery recommended within 3 months. ⚠️ REQUIRES PARENTAL CONFIRMATION before scheduling.',
    'unscheduled',
    'urgent',
    50000, -- Based on Freeman Health System: cardiac surgery $15k-$150k, typical $50k
    true, -- Requires confirmation
    300, -- 5 hours for cardiac surgery (based on real hospital data)
    NOW() - INTERVAL '2 days' -- Order was created 2 days ago
  );

  -- Add prerequisites for the heart surgery
  INSERT INTO prerequisites (order_id, provider_id, prerequisite_type, description, is_required)
  VALUES
    ('a0000000-0000-0000-0000-000000000010', dr_chen_id, 'pre_op_test', 'Pre-operative cardiac catheterization', true),
    ('a0000000-0000-0000-0000-000000000010', dr_chen_id, 'pre_op_test', 'Pre-operative blood work and chest X-ray', true),
    ('a0000000-0000-0000-0000-000000000010', dr_chen_id, 'consultation', 'Consultation with pediatric anesthesiologist', true),
    ('a0000000-0000-0000-0000-000000000010', dr_chen_id, 'preparation', 'NPO (nothing by mouth) 8 hours before surgery', true),
    ('a0000000-0000-0000-0000-000000000010', dr_chen_id, 'logistics', 'Arrange 3-5 day hospital stay post-surgery', true);

  -- Create notification for Jennifer (caregiver)
  INSERT INTO notifications (user_id, notification_type, title, message, related_order_id, priority, is_read)
  VALUES (
    '20000000-0000-0000-0000-000000000001', -- Jennifer's ID
    'order_requires_confirmation',
    '⚠️ Heart Surgery Requires Your Confirmation',
    'Dr. Chen has recommended cardiac surgery for Ruthie Martinez (VSD repair). Please review and confirm this order before it can be scheduled.',
    'a0000000-0000-0000-0000-000000000010',
    'urgent',
    false
  );

END $$;

SELECT 'Added heart surgery order for Ruthie: $50,000 (based on Freeman Health System data), 5 hours duration, requires Jennifer''s confirmation.' as message;
