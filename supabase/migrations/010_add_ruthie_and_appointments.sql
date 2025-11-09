-- =====================================================
-- Migration 010: Add Ruthie & Scheduled Appointments
-- =====================================================
-- Adds Ruthie Martinez (7, Down syndrome) with multiple appointments
-- Makes Jennifer Martinez also a patient (not just caregiver)
-- Adds some scheduled appointments to demonstrate full system

-- =====================================================
-- 1. ADD RUTHIE MARTINEZ (7 years old, Down syndrome)
-- =====================================================

INSERT INTO users (id, email, full_name, role) VALUES
  ('20000000-0000-0000-0000-000000000006', 'ruthie.martinez@example.com', 'Ruthie Martinez', 'patient')
ON CONFLICT (id) DO NOTHING;

INSERT INTO patient_profiles (id, date_of_birth, medical_conditions, allergies, current_medications, karma_score) VALUES
  ('20000000-0000-0000-0000-000000000006',
   '2018-05-20',
   ARRAY['Down Syndrome (Trisomy 21)', 'Congenital Heart Defect (ASD)', 'Recurrent Ear Infections'],
   ARRAY['Amoxicillin'],
   ARRAY['Multivitamin with Iron', 'Zyrtec 5mg daily'],
   92)
ON CONFLICT (id) DO NOTHING;

-- Add caregiver relationship for Ruthie
INSERT INTO caregiver_relationships (caregiver_id, patient_id, relationship_type, permission_level) VALUES
  ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 'parent', 'full_access')
ON CONFLICT (caregiver_id, patient_id) DO NOTHING;

-- =====================================================
-- 2. MAKE JENNIFER ALSO A PATIENT
-- =====================================================

-- Update Jennifer's role to allow both caregiver and patient access
-- Note: We'll keep her as 'caregiver' role but add a patient profile
INSERT INTO patient_profiles (id, date_of_birth, medical_conditions, allergies, current_medications, karma_score) VALUES
  ('20000000-0000-0000-0000-000000000001',
   '1985-09-12',
   ARRAY['Anxiety'],
   ARRAY[]::TEXT[],
   ARRAY['Sertraline 50mg'],
   88)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. CREATE ORDERS FOR RUTHIE
-- =====================================================

-- Ruthie's Cardiology appointment (SCHEDULED)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, status, priority, prerequisites, estimated_revenue, created_at) VALUES
  ('40000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000006',
   '10000000-0000-0000-0000-000000000003',
   'follow-up',
   'Cardiology Follow-up - ASD Monitoring',
   'Routine cardiology follow-up for congenital heart defect (Atrial Septal Defect)',
   'scheduled',
   'routine',
   ARRAY['Bring previous echocardiogram results', 'Note any symptoms: fatigue, shortness of breath, chest pain', 'Plan for 90 minutes (echo + consultation)'],
   350,
   NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- Create the actual scheduled appointment for Ruthie's cardiology
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000006',
   '10000000-0000-0000-0000-000000000003',
   (NOW() + INTERVAL '5 days')::TIMESTAMPTZ,
   (NOW() + INTERVAL '5 days' + INTERVAL '90 minutes')::TIMESTAMPTZ,
   'Heart & Vascular Center',
   ARRAY['Cardiac Nurse Rachel', 'Echo Tech Tom'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Ruthie's Endocrinology appointment (unscheduled)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, status, priority, prerequisites, estimated_revenue, created_at) VALUES
  ('40000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000006',
   '10000000-0000-0000-0000-000000000002',
   'follow-up',
   'Endocrinology Evaluation - Growth & Development',
   'Thyroid function and growth assessment for Down syndrome patient',
   'unscheduled',
   'routine',
   ARRAY['Fasting for 8 hours (morning appointment preferred)', 'Bring growth chart', 'Current height and weight needed'],
   225,
   NOW() - INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;

-- Ruthie's Ear Tube Surgery (SCHEDULED)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, status, priority, prerequisites, estimated_revenue, created_at) VALUES
  ('40000000-0000-0000-0000-000000000003',
   '20000000-0000-0000-0000-000000000006',
   '10000000-0000-0000-0000-000000000005',
   'procedure',
   'Bilateral Ear Tube Placement (Myringotomy)',
   'Surgical placement of tympanostomy tubes for recurrent ear infections',
   'scheduled',
   'routine',
   ARRAY['NPO (nothing by mouth) after midnight before surgery', 'Arrive 90 minutes before surgery time', 'Bring comfort item (stuffed animal, blanket)', 'Parent must stay for recovery (2-3 hours total)', 'No aspirin or ibuprofen for 7 days before'],
   1200,
   NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

-- Create the scheduled surgery appointment
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000002',
   '40000000-0000-0000-0000-000000000003',
   '20000000-0000-0000-0000-000000000006',
   '10000000-0000-0000-0000-000000000005',
   (NOW() + INTERVAL '12 days' + INTERVAL '7 hours')::TIMESTAMPTZ,
   (NOW() + INTERVAL '12 days' + INTERVAL '10 hours')::TIMESTAMPTZ,
   'Surgical Center',
   ARRAY['Surgical Nurse Beth', 'Anesthesiologist Dr. Patel', 'Recovery Nurse Maria'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Ruthie's Post-Op Follow-up (unscheduled - will be scheduled after surgery)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, status, priority, prerequisites, estimated_revenue, created_at) VALUES
  ('40000000-0000-0000-0000-000000000004',
   '20000000-0000-0000-0000-000000000006',
   '10000000-0000-0000-0000-000000000005',
   'follow-up',
   'Post-Op Ear Tube Check (2 weeks after surgery)',
   'Follow-up appointment to check ear tube placement and healing',
   'unscheduled',
   'routine',
   ARRAY['Schedule for 2 weeks after surgery', 'Note any drainage, pain, or hearing changes', 'Bring questions about water precautions'],
   150,
   NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- Ruthie's Speech Therapy Evaluation (unscheduled)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, status, priority, prerequisites, estimated_revenue, created_at) VALUES
  ('40000000-0000-0000-0000-000000000005',
   '20000000-0000-0000-0000-000000000006',
   '10000000-0000-0000-0000-000000000001',
   'follow-up',
   'Speech & Language Evaluation',
   'Annual speech therapy evaluation for Down syndrome developmental support',
   'unscheduled',
   'routine',
   ARRAY['Bring IEP or school speech therapy reports', 'List current communication concerns', 'Session will be 60 minutes'],
   200,
   NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. CREATE ORDERS FOR JENNIFER (as patient)
-- =====================================================

-- Jennifer's Anxiety Follow-up (scheduled)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, status, priority, prerequisites, estimated_revenue, created_at) VALUES
  ('40000000-0000-0000-0000-000000000006',
   '20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000004',
   'follow-up',
   'Mental Health Check-in - Anxiety Management',
   'Follow-up for anxiety management and medication review',
   'scheduled',
   'routine',
   ARRAY['Note any changes in anxiety symptoms', 'Sleep quality assessment', 'Bring medication list'],
   175,
   NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- Create scheduled appointment for Jennifer
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000003',
   '40000000-0000-0000-0000-000000000006',
   '20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000004',
   (NOW() + INTERVAL '3 days' + INTERVAL '14 hours')::TIMESTAMPTZ,
   (NOW() + INTERVAL '3 days' + INTERVAL '15 hours')::TIMESTAMPTZ,
   'Behavioral Health Center',
   ARRAY['Therapist Sarah'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Jennifer's Annual Physical (unscheduled)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, status, priority, prerequisites, estimated_revenue, created_at) VALUES
  ('40000000-0000-0000-0000-000000000007',
   '20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000007',
   'follow-up',
   'Annual Physical Exam',
   'Routine annual wellness exam and health screening',
   'unscheduled',
   'routine',
   ARRAY['Fasting for 8 hours (for bloodwork)', 'Bring list of current medications', 'Note any health concerns'],
   250,
   NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. ADD MORE APPOINTMENTS FOR GRANDMA (Margaret)
-- =====================================================

-- Schedule Margaret's Blood Pressure Check
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000004',
   '30000000-0000-0000-0000-000000000006',
   '20000000-0000-0000-0000-000000000005',
   '10000000-0000-0000-0000-000000000009',
   (NOW() + INTERVAL '2 days' + INTERVAL '10 hours')::TIMESTAMPTZ,
   (NOW() + INTERVAL '2 days' + INTERVAL '10 hours 30 minutes')::TIMESTAMPTZ,
   'Senior Care Medical Group',
   ARRAY['Nurse Brenda'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Update the order to scheduled status
UPDATE orders
SET status = 'scheduled'
WHERE id = '30000000-0000-0000-0000-000000000006';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

SELECT 'Ruthie added! Jennifer is now also a patient. Family now has 6 members total with mix of scheduled and unscheduled appointments.' as message;
