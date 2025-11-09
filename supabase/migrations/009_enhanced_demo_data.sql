-- =====================================================
-- Migration 009: Enhanced Demo Data
-- =====================================================
-- Adds realistic caregiver scenario with Jennifer Martinez managing 4 family members
-- Adds 9 specialist doctors across different medical disciplines
-- Creates caregiver_relationships table for multi-patient management
-- Adds diverse medical orders showcasing system capabilities

-- =====================================================
-- 1. ADD MISSING COLUMNS TO TABLES
-- =====================================================

-- Add columns for enhanced provider information
ALTER TABLE provider_profiles
ADD COLUMN IF NOT EXISTS years_experience INTEGER,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Add columns for patient medical information
ALTER TABLE patient_profiles
ADD COLUMN IF NOT EXISTS medical_conditions TEXT[],
ADD COLUMN IF NOT EXISTS allergies TEXT[],
ADD COLUMN IF NOT EXISTS current_medications TEXT[];

-- Add prerequisites column to orders table for easier querying
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS prerequisites TEXT[];

-- =====================================================
-- 2. CREATE CAREGIVER RELATIONSHIPS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS caregiver_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('parent', 'child', 'spouse', 'sibling', 'guardian', 'other')),
  permission_level TEXT NOT NULL DEFAULT 'full_access' CHECK (permission_level IN ('view_only', 'schedule_only', 'full_access')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(caregiver_id, patient_id)
);

CREATE INDEX IF NOT EXISTS idx_caregiver_relationships_caregiver ON caregiver_relationships(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_relationships_patient ON caregiver_relationships(patient_id);

-- =====================================================
-- 3. ADD 9 SPECIALIST DOCTORS
-- =====================================================

-- Dr. Raj Patel - Pediatrician
INSERT INTO users (id, email, full_name, role) VALUES
  ('10000000-0000-0000-0000-000000000001', 'dr.patel@medharmony.demo', 'Dr. Raj Patel', 'provider')
ON CONFLICT (id) DO NOTHING;

INSERT INTO provider_profiles (id, specialty, organization, years_experience, bio, verified) VALUES
  ('10000000-0000-0000-0000-000000000001',
   'Pediatrics',
   'Children''s Hospital Network',
   12,
   'Board-certified pediatrician specializing in developmental pediatrics and adolescent medicine',
   true)
ON CONFLICT (id) DO NOTHING;

-- Dr. Lisa Kim - Endocrinologist
INSERT INTO users (id, email, full_name, role) VALUES
  ('10000000-0000-0000-0000-000000000002', 'dr.kim@medharmony.demo', 'Dr. Lisa Kim', 'provider')
ON CONFLICT (id) DO NOTHING;

INSERT INTO provider_profiles (id, specialty, organization, years_experience, bio, verified) VALUES
  ('10000000-0000-0000-0000-000000000002',
   'Endocrinology',
   'Diabetes Care Center',
   15,
   'Diabetes specialist with expertise in Type 1 diabetes and insulin pump therapy',
   true)
ON CONFLICT (id) DO NOTHING;

-- Dr. Michael Chen - Cardiologist
INSERT INTO users (id, email, full_name, role) VALUES
  ('10000000-0000-0000-0000-000000000003', 'dr.chen@medharmony.demo', 'Dr. Michael Chen', 'provider')
ON CONFLICT (id) DO NOTHING;

INSERT INTO provider_profiles (id, specialty, organization, years_experience, bio, verified) VALUES
  ('10000000-0000-0000-0000-000000000003',
   'Cardiology',
   'Heart & Vascular Center',
   20,
   'Interventional cardiologist specializing in preventive cardiology and heart disease management',
   true)
ON CONFLICT (id) DO NOTHING;

-- Dr. Amanda Rodriguez - Psychiatrist
INSERT INTO users (id, email, full_name, role) VALUES
  ('10000000-0000-0000-0000-000000000004', 'dr.rodriguez@medharmony.demo', 'Dr. Amanda Rodriguez', 'provider')
ON CONFLICT (id) DO NOTHING;

INSERT INTO provider_profiles (id, specialty, organization, years_experience, bio, verified) VALUES
  ('10000000-0000-0000-0000-000000000004',
   'Psychiatry',
   'Behavioral Health Center',
   10,
   'Child and adolescent psychiatrist specializing in ADHD and developmental disorders',
   true)
ON CONFLICT (id) DO NOTHING;

-- Dr. Jennifer Walsh - Ophthalmologist
INSERT INTO users (id, email, full_name, role) VALUES
  ('10000000-0000-0000-0000-000000000005', 'dr.walsh@medharmony.demo', 'Dr. Jennifer Walsh', 'provider')
ON CONFLICT (id) DO NOTHING;

INSERT INTO provider_profiles (id, specialty, organization, years_experience, bio, verified) VALUES
  ('10000000-0000-0000-0000-000000000005',
   'Ophthalmology',
   'Eye Care Associates',
   18,
   'Comprehensive ophthalmologist with subspecialty training in diabetic retinopathy',
   true)
ON CONFLICT (id) DO NOTHING;

-- Dr. Thomas Anderson - Orthopedic Surgeon
INSERT INTO users (id, email, full_name, role) VALUES
  ('10000000-0000-0000-0000-000000000006', 'dr.anderson@medharmony.demo', 'Dr. Thomas Anderson', 'provider')
ON CONFLICT (id) DO NOTHING;

INSERT INTO provider_profiles (id, specialty, organization, years_experience, bio, verified) VALUES
  ('10000000-0000-0000-0000-000000000006',
   'Orthopedics',
   'Sports Medicine & Orthopedics',
   16,
   'Orthopedic surgeon specializing in sports medicine and joint preservation',
   true)
ON CONFLICT (id) DO NOTHING;

-- Dr. Maria Santos - Family Medicine
INSERT INTO users (id, email, full_name, role) VALUES
  ('10000000-0000-0000-0000-000000000007', 'dr.santos@medharmony.demo', 'Dr. Maria Santos', 'provider')
ON CONFLICT (id) DO NOTHING;

INSERT INTO provider_profiles (id, specialty, organization, years_experience, bio, verified) VALUES
  ('10000000-0000-0000-0000-000000000007',
   'Family Medicine',
   'Community Health Clinic',
   8,
   'Family physician providing comprehensive care for all ages',
   true)
ON CONFLICT (id) DO NOTHING;

-- Dr. Robert Kim - Radiologist
INSERT INTO users (id, email, full_name, role) VALUES
  ('10000000-0000-0000-0000-000000000008', 'dr.rkim@medharmony.demo', 'Dr. Robert Kim', 'provider')
ON CONFLICT (id) DO NOTHING;

INSERT INTO provider_profiles (id, specialty, organization, years_experience, bio, verified) VALUES
  ('10000000-0000-0000-0000-000000000008',
   'Radiology',
   'Advanced Imaging Center',
   14,
   'Board-certified radiologist specializing in diagnostic imaging',
   true)
ON CONFLICT (id) DO NOTHING;

-- Dr. Emily Johnson - Internal Medicine
INSERT INTO users (id, email, full_name, role) VALUES
  ('10000000-0000-0000-0000-000000000009', 'dr.ejohnson@medharmony.demo', 'Dr. Emily Johnson', 'provider')
ON CONFLICT (id) DO NOTHING;

INSERT INTO provider_profiles (id, specialty, organization, years_experience, bio, verified) VALUES
  ('10000000-0000-0000-0000-000000000009',
   'Internal Medicine',
   'Senior Care Medical Group',
   11,
   'Internist specializing in geriatric medicine and chronic disease management',
   true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. ADD JENNIFER MARTINEZ'S FAMILY
-- =====================================================

-- Jennifer Martinez (Caregiver)
INSERT INTO users (id, email, full_name, role) VALUES
  ('20000000-0000-0000-0000-000000000001', 'jennifer.martinez@example.com', 'Jennifer Martinez', 'caregiver')
ON CONFLICT (id) DO NOTHING;

-- Emma Martinez (14 years old, Type 1 Diabetes)
INSERT INTO users (id, email, full_name, role) VALUES
  ('20000000-0000-0000-0000-000000000002', 'emma.martinez@example.com', 'Emma Martinez', 'patient')
ON CONFLICT (id) DO NOTHING;

INSERT INTO patient_profiles (id, date_of_birth, medical_conditions, allergies, current_medications, karma_score) VALUES
  ('20000000-0000-0000-0000-000000000002',
   '2011-03-15',
   ARRAY['Type 1 Diabetes'],
   ARRAY['Penicillin'],
   ARRAY['Insulin (Humalog)', 'Insulin (Lantus)'],
   85)
ON CONFLICT (id) DO NOTHING;

-- Lucas Martinez (9 years old, ADHD)
INSERT INTO users (id, email, full_name, role) VALUES
  ('20000000-0000-0000-0000-000000000003', 'lucas.martinez@example.com', 'Lucas Martinez', 'patient')
ON CONFLICT (id) DO NOTHING;

INSERT INTO patient_profiles (id, date_of_birth, medical_conditions, allergies, current_medications, karma_score) VALUES
  ('20000000-0000-0000-0000-000000000003',
   '2016-08-22',
   ARRAY['ADHD'],
   ARRAY[]::TEXT[],
   ARRAY['Adderall XR 10mg'],
   90)
ON CONFLICT (id) DO NOTHING;

-- Sofia Martinez (4 years old, Healthy)
INSERT INTO users (id, email, full_name, role) VALUES
  ('20000000-0000-0000-0000-000000000004', 'sofia.martinez@example.com', 'Sofia Martinez', 'patient')
ON CONFLICT (id) DO NOTHING;

INSERT INTO patient_profiles (id, date_of_birth, medical_conditions, allergies, current_medications, karma_score) VALUES
  ('20000000-0000-0000-0000-000000000004',
   '2021-01-10',
   ARRAY[]::TEXT[],
   ARRAY[]::TEXT[],
   ARRAY[]::TEXT[],
   95)
ON CONFLICT (id) DO NOTHING;

-- Margaret Chen (68 years old, Jennifer's mother)
INSERT INTO users (id, email, full_name, role, phone_number, sms_notifications_enabled) VALUES
  ('20000000-0000-0000-0000-000000000005', 'margaret.chen@example.com', 'Margaret Chen', 'patient', '+15558881234', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO patient_profiles (id, date_of_birth, medical_conditions, allergies, current_medications, karma_score) VALUES
  ('20000000-0000-0000-0000-000000000005',
   '1957-11-05',
   ARRAY['Hypertension', 'Osteoporosis', 'History of Atrial Fibrillation'],
   ARRAY['Sulfa drugs'],
   ARRAY['Lisinopril 10mg', 'Alendronate 70mg weekly', 'Apixaban 5mg'],
   80)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. CREATE CAREGIVER RELATIONSHIPS
-- =====================================================

INSERT INTO caregiver_relationships (caregiver_id, patient_id, relationship_type, permission_level) VALUES
  ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'parent', 'full_access'),
  ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'parent', 'full_access'),
  ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'parent', 'full_access'),
  ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 'child', 'full_access')
ON CONFLICT (caregiver_id, patient_id) DO NOTHING;

-- =====================================================
-- 6. CREATE MEDICAL ORDERS FOR FAMILY
-- =====================================================

-- Emma's Orders (Type 1 Diabetes management)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, status, priority, prerequisites, estimated_revenue, created_at) VALUES
  ('30000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000002',
   'lab',
   'Quarterly A1C Test',
   'Routine hemoglobin A1C test to monitor diabetes control',
   'unscheduled',
   'routine',
   ARRAY['Fasting for 8 hours before test', 'Bring current insulin log or CGM data', 'List any hypoglycemic episodes in past 3 months'],
   150,
   NOW() - INTERVAL '3 days'),

  ('30000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000005',
   'imaging',
   'Annual Diabetic Eye Exam',
   'Comprehensive dilated eye exam to screen for diabetic retinopathy',
   'unscheduled',
   'routine',
   ARRAY['Pupils will be dilated - bring sunglasses', 'Plan for 1-2 hours at appointment', 'Cannot drive for 4-6 hours after'],
   200,
   NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- Lucas's Orders (ADHD management)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, status, priority, prerequisites, estimated_revenue, created_at) VALUES
  ('30000000-0000-0000-0000-000000000003',
   '20000000-0000-0000-0000-000000000003',
   '10000000-0000-0000-0000-000000000004',
   'follow-up',
   'ADHD Medication Follow-up',
   'Follow-up appointment to assess Adderall effectiveness and dosage',
   'unscheduled',
   'routine',
   ARRAY['Bring completed teacher evaluation form', 'Note any sleep issues or appetite changes', 'Current height and weight will be measured'],
   175,
   NOW() - INTERVAL '1 day'),

  ('30000000-0000-0000-0000-000000000004',
   '20000000-0000-0000-0000-000000000003',
   '10000000-0000-0000-0000-000000000001',
   'procedure',
   'School Physical & Sports Clearance',
   'Annual physical exam required for school and soccer team participation',
   'unscheduled',
   'routine',
   ARRAY['Bring immunization records', 'Wear athletic clothes for movement assessment', 'Parent/guardian must be present'],
   125,
   NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- Sofia's Order (Well-child visit)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, status, priority, prerequisites, estimated_revenue, created_at) VALUES
  ('30000000-0000-0000-0000-000000000005',
   '20000000-0000-0000-0000-000000000004',
   '10000000-0000-0000-0000-000000000001',
   'follow-up',
   '4-Year Well-Child Visit',
   'Annual wellness exam including developmental screening and vaccinations',
   'unscheduled',
   'routine',
   ARRAY['Bring immunization card', 'List any concerns about behavior or speech', 'Child should be well-rested'],
   150,
   NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Margaret's Orders (Geriatric care)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, status, priority, prerequisites, estimated_revenue, created_at) VALUES
  ('30000000-0000-0000-0000-000000000006',
   '20000000-0000-0000-0000-000000000005',
   '10000000-0000-0000-0000-000000000009',
   'follow-up',
   'Blood Pressure Check',
   'Routine blood pressure monitoring and hypertension medication review',
   'unscheduled',
   'routine',
   ARRAY['Bring current blood pressure log', 'List all current medications', 'Note any dizziness or side effects'],
   100,
   NOW() - INTERVAL '4 days'),

  ('30000000-0000-0000-0000-000000000007',
   '20000000-0000-0000-0000-000000000005',
   '10000000-0000-0000-0000-000000000008',
   'imaging',
   'DEXA Scan - Bone Density',
   'Follow-up bone density scan to monitor osteoporosis treatment',
   'unscheduled',
   'routine',
   ARRAY['Fasting not required', 'Wear comfortable clothing without metal', 'Plan for 30 minutes'],
   250,
   NOW() - INTERVAL '6 days'),

  ('30000000-0000-0000-0000-000000000008',
   '20000000-0000-0000-0000-000000000005',
   '10000000-0000-0000-0000-000000000003',
   'follow-up',
   'Cardiology Consultation - URGENT',
   'Cardiology follow-up for recent heart palpitations and dizziness',
   'unscheduled',
   'urgent',
   ARRAY['Bring list of palpitation episodes with dates/times', 'Note any chest pain or shortness of breath', 'Bring current EKG if available', 'List all medications including anticoagulant'],
   300,
   NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 7. ADD PROVIDER SCHEDULES FOR NEW DOCTORS
-- =====================================================

-- Dr. Raj Patel - Pediatrics
INSERT INTO provider_schedules (provider_id, location, day_of_week, start_time, end_time, staff_available) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Children''s Hospital - Pediatric Clinic', 1, '09:00', '17:00', ARRAY['Nurse Amy', 'MA Carlos']),
  ('10000000-0000-0000-0000-000000000001', 'Children''s Hospital - Pediatric Clinic', 2, '09:00', '17:00', ARRAY['Nurse Amy', 'MA Carlos']),
  ('10000000-0000-0000-0000-000000000001', 'Children''s Hospital - Pediatric Clinic', 3, '09:00', '17:00', ARRAY['Nurse Amy', 'MA Carlos']),
  ('10000000-0000-0000-0000-000000000001', 'Children''s Hospital - Pediatric Clinic', 4, '09:00', '17:00', ARRAY['Nurse Amy', 'MA Carlos']),
  ('10000000-0000-0000-0000-000000000001', 'Children''s Hospital - Pediatric Clinic', 5, '09:00', '15:00', ARRAY['Nurse Amy'])
ON CONFLICT DO NOTHING;

-- Dr. Lisa Kim - Endocrinology
INSERT INTO provider_schedules (provider_id, location, day_of_week, start_time, end_time, staff_available) VALUES
  ('10000000-0000-0000-0000-000000000002', 'Main Hospital - Endocrinology', 1, '08:00', '16:00', ARRAY['Nurse Patricia', 'Diabetes Educator Susan']),
  ('10000000-0000-0000-0000-000000000002', 'Diabetes Care Center', 2, '10:00', '18:00', ARRAY['Nurse Mike', 'CDE Jennifer']),
  ('10000000-0000-0000-0000-000000000002', 'Main Hospital - Endocrinology', 3, '08:00', '16:00', ARRAY['Nurse Patricia', 'Diabetes Educator Susan']),
  ('10000000-0000-0000-0000-000000000002', 'Diabetes Care Center', 4, '10:00', '18:00', ARRAY['Nurse Mike', 'CDE Jennifer']),
  ('10000000-0000-0000-0000-000000000002', 'Main Hospital - Endocrinology', 5, '08:00', '14:00', ARRAY['Nurse Patricia'])
ON CONFLICT DO NOTHING;

-- Dr. Michael Chen - Cardiology
INSERT INTO provider_schedules (provider_id, location, day_of_week, start_time, end_time, staff_available) VALUES
  ('10000000-0000-0000-0000-000000000003', 'Heart & Vascular Center', 1, '07:00', '15:00', ARRAY['Cardiac Nurse Rachel', 'Echo Tech Tom']),
  ('10000000-0000-0000-0000-000000000003', 'Heart & Vascular Center', 2, '07:00', '15:00', ARRAY['Cardiac Nurse Rachel', 'Echo Tech Tom']),
  ('10000000-0000-0000-0000-000000000003', 'Downtown Cardiology Clinic', 3, '13:00', '20:00', ARRAY['Nurse Linda']),
  ('10000000-0000-0000-0000-000000000003', 'Downtown Cardiology Clinic', 4, '13:00', '20:00', ARRAY['Nurse Linda'])
ON CONFLICT DO NOTHING;

-- Dr. Amanda Rodriguez - Psychiatry
INSERT INTO provider_schedules (provider_id, location, day_of_week, start_time, end_time, staff_available) VALUES
  ('10000000-0000-0000-0000-000000000004', 'Behavioral Health Center', 1, '10:00', '18:00', ARRAY['Therapist Sarah']),
  ('10000000-0000-0000-0000-000000000004', 'Behavioral Health Center', 2, '10:00', '18:00', ARRAY['Therapist Sarah']),
  ('10000000-0000-0000-0000-000000000004', 'Behavioral Health Center', 3, '10:00', '18:00', ARRAY['Therapist Sarah']),
  ('10000000-0000-0000-0000-000000000004', 'Behavioral Health Center', 4, '10:00', '18:00', ARRAY['Therapist Sarah']),
  ('10000000-0000-0000-0000-000000000004', 'Behavioral Health Center', 5, '12:00', '17:00', ARRAY['Therapist Sarah'])
ON CONFLICT DO NOTHING;

-- Dr. Jennifer Walsh - Ophthalmology
INSERT INTO provider_schedules (provider_id, location, day_of_week, start_time, end_time, staff_available) VALUES
  ('10000000-0000-0000-0000-000000000005', 'Eye Care Associates', 1, '08:00', '17:00', ARRAY['Ophthalmic Tech Kim', 'MA Derek']),
  ('10000000-0000-0000-0000-000000000005', 'Eye Care Associates', 2, '08:00', '17:00', ARRAY['Ophthalmic Tech Kim', 'MA Derek']),
  ('10000000-0000-0000-0000-000000000005', 'Surgical Center', 3, '07:00', '15:00', ARRAY['Surgical Nurse Beth']),
  ('10000000-0000-0000-0000-000000000005', 'Eye Care Associates', 4, '08:00', '17:00', ARRAY['Ophthalmic Tech Kim', 'MA Derek'])
ON CONFLICT DO NOTHING;

-- Dr. Thomas Anderson - Orthopedics
INSERT INTO provider_schedules (provider_id, location, day_of_week, start_time, end_time, staff_available) VALUES
  ('10000000-0000-0000-0000-000000000006', 'Sports Medicine & Orthopedics', 1, '08:00', '16:00', ARRAY['Nurse James', 'PT Assistant Kelly']),
  ('10000000-0000-0000-0000-000000000006', 'Sports Medicine & Orthopedics', 2, '08:00', '16:00', ARRAY['Nurse James', 'PT Assistant Kelly']),
  ('10000000-0000-0000-0000-000000000006', 'Sports Medicine & Orthopedics', 3, '08:00', '16:00', ARRAY['Nurse James', 'PT Assistant Kelly']),
  ('10000000-0000-0000-0000-000000000006', 'Sports Medicine & Orthopedics', 4, '08:00', '16:00', ARRAY['Nurse James', 'PT Assistant Kelly']),
  ('10000000-0000-0000-0000-000000000006', 'Sports Medicine & Orthopedics', 5, '08:00', '14:00', ARRAY['Nurse James'])
ON CONFLICT DO NOTHING;

-- Dr. Maria Santos - Family Medicine
INSERT INTO provider_schedules (provider_id, location, day_of_week, start_time, end_time, staff_available) VALUES
  ('10000000-0000-0000-0000-000000000007', 'Community Health Clinic', 1, '08:00', '17:00', ARRAY['Nurse Diana', 'MA Robert']),
  ('10000000-0000-0000-0000-000000000007', 'Community Health Clinic', 2, '12:00', '20:00', ARRAY['Nurse Kevin']),
  ('10000000-0000-0000-0000-000000000007', 'Community Health Clinic', 3, '08:00', '17:00', ARRAY['Nurse Diana', 'MA Robert']),
  ('10000000-0000-0000-0000-000000000007', 'Community Health Clinic', 4, '12:00', '20:00', ARRAY['Nurse Kevin']),
  ('10000000-0000-0000-0000-000000000007', 'Community Health Clinic', 5, '08:00', '17:00', ARRAY['Nurse Diana', 'MA Robert']),
  ('10000000-0000-0000-0000-000000000007', 'Community Health Clinic', 6, '09:00', '13:00', ARRAY['Nurse Diana'])
ON CONFLICT DO NOTHING;

-- Dr. Robert Kim - Radiology
INSERT INTO provider_schedules (provider_id, location, day_of_week, start_time, end_time, staff_available) VALUES
  ('10000000-0000-0000-0000-000000000008', 'Advanced Imaging Center', 1, '07:00', '16:00', ARRAY['Rad Tech Maria', 'Rad Tech John']),
  ('10000000-0000-0000-0000-000000000008', 'Advanced Imaging Center', 2, '07:00', '16:00', ARRAY['Rad Tech Maria', 'Rad Tech John']),
  ('10000000-0000-0000-0000-000000000008', 'Advanced Imaging Center', 3, '07:00', '16:00', ARRAY['Rad Tech Maria', 'Rad Tech John']),
  ('10000000-0000-0000-0000-000000000008', 'Advanced Imaging Center', 4, '07:00', '16:00', ARRAY['Rad Tech Maria', 'Rad Tech John']),
  ('10000000-0000-0000-0000-000000000008', 'Advanced Imaging Center', 5, '07:00', '15:00', ARRAY['Rad Tech Maria'])
ON CONFLICT DO NOTHING;

-- Dr. Emily Johnson - Internal Medicine
INSERT INTO provider_schedules (provider_id, location, day_of_week, start_time, end_time, staff_available) VALUES
  ('10000000-0000-0000-0000-000000000009', 'Senior Care Medical Group', 1, '09:00', '17:00', ARRAY['Nurse Brenda', 'Social Worker Lisa']),
  ('10000000-0000-0000-0000-000000000009', 'Senior Care Medical Group', 2, '09:00', '17:00', ARRAY['Nurse Brenda', 'Social Worker Lisa']),
  ('10000000-0000-0000-0000-000000000009', 'Senior Care Medical Group', 3, '09:00', '17:00', ARRAY['Nurse Brenda', 'Social Worker Lisa']),
  ('10000000-0000-0000-0000-000000000009', 'Senior Care Medical Group', 4, '09:00', '17:00', ARRAY['Nurse Brenda', 'Social Worker Lisa']),
  ('10000000-0000-0000-0000-000000000009', 'Senior Care Medical Group', 5, '09:00', '15:00', ARRAY['Nurse Brenda'])
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. SET NOTIFICATION PREFERENCES FOR MARGARET
-- =====================================================

-- Margaret prefers voice calls (for Phase 2)
UPDATE users
SET email_notifications_enabled = false,
    sms_notifications_enabled = false
WHERE id = '20000000-0000-0000-0000-000000000005';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

SELECT 'Enhanced demo data loaded successfully! Jennifer Martinez family and 9 specialist doctors are ready.' as message;
