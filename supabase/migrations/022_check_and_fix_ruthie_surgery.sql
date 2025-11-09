-- Migration 022: Check and Fix Ruthie's Heart Surgery Order
--
-- Ensures the order exists with correct data

-- First, delete if it exists (to allow re-running)
DELETE FROM prerequisites WHERE order_id = 'a0000000-0000-0000-0000-000000000010';
DELETE FROM orders WHERE id = 'a0000000-0000-0000-0000-000000000010';

-- Get Dr. Chen's provider ID
DO $$
DECLARE
  ruthie_id UUID := '20000000-0000-0000-0000-000000000006';
  dr_chen_id UUID;
BEGIN
  -- Get Dr. Chen's ID from users table
  SELECT id INTO dr_chen_id
  FROM users
  WHERE email = 'dr.chen@medharmony.demo';

  IF dr_chen_id IS NULL THEN
    RAISE EXCEPTION 'Dr. Chen not found with email dr.chen@medharmony.demo';
  END IF;

  RAISE NOTICE 'Dr. Chen ID: %', dr_chen_id;
  RAISE NOTICE 'Ruthie ID: %', ruthie_id;

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
    50000,
    true,
    300,
    NOW() - INTERVAL '2 days'
  );

  RAISE NOTICE 'Created order for Ruthie';

  -- Add prerequisites
  INSERT INTO prerequisites (order_id, provider_id, prerequisite_type, description, is_required)
  VALUES
    ('a0000000-0000-0000-0000-000000000010', dr_chen_id, 'pre_op_test', 'Pre-operative cardiac catheterization', true),
    ('a0000000-0000-0000-0000-000000000010', dr_chen_id, 'pre_op_test', 'Pre-operative blood work and chest X-ray', true),
    ('a0000000-0000-0000-0000-000000000010', dr_chen_id, 'consultation', 'Consultation with pediatric anesthesiologist', true),
    ('a0000000-0000-0000-0000-000000000010', dr_chen_id, 'preparation', 'NPO (nothing by mouth) 8 hours before surgery', true),
    ('a0000000-0000-0000-0000-000000000010', dr_chen_id, 'logistics', 'Arrange 3-5 day hospital stay post-surgery', true);

  RAISE NOTICE 'Added 5 prerequisites';

  -- Create notification for Jennifer (only if it doesn't exist)
  INSERT INTO notifications (user_id, notification_type, title, message, related_order_id, priority, is_read)
  VALUES (
    '20000000-0000-0000-0000-000000000001',
    'order_requires_confirmation',
    '⚠️ Heart Surgery Requires Your Confirmation',
    'Dr. Chen has recommended cardiac surgery for Ruthie Martinez (VSD repair). Please review and confirm this order before it can be scheduled.',
    'a0000000-0000-0000-0000-000000000010',
    'urgent',
    false
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Created notification for Jennifer';

END $$;

-- Verify the order was created
SELECT
  'VERIFICATION:' as status,
  o.id,
  o.title,
  o.patient_id,
  o.provider_id,
  o.status,
  o.priority,
  o.estimated_revenue,
  o.requires_confirmation,
  o.duration_minutes,
  u.full_name as provider_name
FROM orders o
LEFT JOIN users u ON u.id = o.provider_id
WHERE o.id = 'a0000000-0000-0000-0000-000000000010';

SELECT 'Heart surgery order created/updated successfully for Ruthie: $50,000, 5 hours, requires confirmation' as message;
