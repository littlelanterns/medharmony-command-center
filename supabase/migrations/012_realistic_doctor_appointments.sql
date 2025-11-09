-- =====================================================
-- Migration 012: Realistic Doctor Appointments
-- =====================================================
-- Creates filled calendars with 40+ appointments
-- Adds 20 new patients with karma distribution
-- Adds 30 unscheduled orders for marketplace
-- Date: November 8, 2025

-- =====================================================
-- PART 1: ADDITIONAL PATIENTS (26 new patients)
-- =====================================================

-- High Karma Patients (80-100) - 6 patients
-- These will be first in line for cancelled slots
INSERT INTO users (id, email, full_name, role) VALUES
  ('30000000-0000-0000-0000-000000000001', 'robert.chen@example.com', 'Robert Chen', 'patient'),
  ('30000000-0000-0000-0000-000000000002', 'maria.gonzalez@example.com', 'Maria Gonzalez', 'patient'),
  ('30000000-0000-0000-0000-000000000003', 'james.williams@example.com', 'James Williams', 'patient'),
  ('30000000-0000-0000-0000-000000000004', 'lisa.patel@example.com', 'Lisa Patel', 'patient'),
  ('30000000-0000-0000-0000-000000000005', 'david.kim@example.com', 'David Kim', 'patient'),
  ('30000000-0000-0000-0000-000000000006', 'sarah.johnson@example.com', 'Sarah Johnson', 'patient')
ON CONFLICT (id) DO NOTHING;

INSERT INTO patient_profiles (id, date_of_birth, karma_score, reliability_percentage) VALUES
  ('30000000-0000-0000-0000-000000000001', '1978-04-12', 95, 98.0),
  ('30000000-0000-0000-0000-000000000002', '1985-09-23', 92, 96.0),
  ('30000000-0000-0000-0000-000000000003', '1972-11-08', 88, 94.0),
  ('30000000-0000-0000-0000-000000000004', '1990-02-14', 87, 93.0),
  ('30000000-0000-0000-0000-000000000005', '1982-07-30', 85, 92.0),
  ('30000000-0000-0000-0000-000000000006', '1995-12-05', 83, 90.0)
ON CONFLICT (id) DO NOTHING;

-- Medium Karma Patients (60-79) - 14 patients
-- Second tier for cancelled slots
INSERT INTO users (id, email, full_name, role) VALUES
  ('30000000-0000-0000-0000-000000000007', 'michael.brown@example.com', 'Michael Brown', 'patient'),
  ('30000000-0000-0000-0000-000000000008', 'jennifer.lee@example.com', 'Jennifer Lee', 'patient'),
  ('30000000-0000-0000-0000-000000000009', 'thomas.anderson@example.com', 'Thomas Anderson', 'patient'),
  ('30000000-0000-0000-0000-000000000010', 'patricia.white@example.com', 'Patricia White', 'patient'),
  ('30000000-0000-0000-0000-000000000011', 'christopher.taylor@example.com', 'Christopher Taylor', 'patient'),
  ('30000000-0000-0000-0000-000000000012', 'amanda.harris@example.com', 'Amanda Harris', 'patient'),
  ('30000000-0000-0000-0000-000000000013', 'daniel.clark@example.com', 'Daniel Clark', 'patient'),
  ('30000000-0000-0000-0000-000000000014', 'rebecca.lewis@example.com', 'Rebecca Lewis', 'patient'),
  ('30000000-0000-0000-0000-000000000021', 'angela.moore@example.com', 'Angela Moore', 'patient'),
  ('30000000-0000-0000-0000-000000000022', 'mark.jackson@example.com', 'Mark Jackson', 'patient'),
  ('30000000-0000-0000-0000-000000000023', 'laura.martin@example.com', 'Laura Martin', 'patient'),
  ('30000000-0000-0000-0000-000000000024', 'eric.thompson@example.com', 'Eric Thompson', 'patient'),
  ('30000000-0000-0000-0000-000000000025', 'rachel.garcia@example.com', 'Rachel Garcia', 'patient'),
  ('30000000-0000-0000-0000-000000000026', 'william.davis@example.com', 'William Davis', 'patient')
ON CONFLICT (id) DO NOTHING;

INSERT INTO patient_profiles (id, date_of_birth, karma_score, reliability_percentage) VALUES
  ('30000000-0000-0000-0000-000000000007', '1988-03-17', 78, 85.0),
  ('30000000-0000-0000-0000-000000000008', '1992-06-22', 75, 83.0),
  ('30000000-0000-0000-0000-000000000009', '1980-08-11', 72, 80.0),
  ('30000000-0000-0000-0000-000000000010', '1975-01-29', 70, 78.0),
  ('30000000-0000-0000-0000-000000000011', '1987-10-03', 68, 75.0),
  ('30000000-0000-0000-0000-000000000012', '1993-05-18', 65, 72.0),
  ('30000000-0000-0000-0000-000000000013', '1984-12-25', 63, 70.0),
  ('30000000-0000-0000-0000-000000000014', '1991-07-07', 61, 68.0),
  ('30000000-0000-0000-0000-000000000021', '1986-09-15', 76, 84.0),
  ('30000000-0000-0000-0000-000000000022', '1989-11-30', 74, 82.0),
  ('30000000-0000-0000-0000-000000000023', '1983-02-20', 71, 79.0),
  ('30000000-0000-0000-0000-000000000024', '1994-08-08', 69, 76.0),
  ('30000000-0000-0000-0000-000000000025', '1990-04-25', 67, 74.0),
  ('30000000-0000-0000-0000-000000000026', '1985-12-12', 64, 71.0)
ON CONFLICT (id) DO NOTHING;

-- Lower Karma Patients (40-59) - 6 patients
-- Will receive notifications after higher tiers
INSERT INTO users (id, email, full_name, role) VALUES
  ('30000000-0000-0000-0000-000000000015', 'brian.martinez@example.com', 'Brian Martinez', 'patient'),
  ('30000000-0000-0000-0000-000000000016', 'stephanie.garcia@example.com', 'Stephanie Garcia', 'patient'),
  ('30000000-0000-0000-0000-000000000017', 'kevin.rodriguez@example.com', 'Kevin Rodriguez', 'patient'),
  ('30000000-0000-0000-0000-000000000018', 'nicole.wilson@example.com', 'Nicole Wilson', 'patient'),
  ('30000000-0000-0000-0000-000000000019', 'jason.moore@example.com', 'Jason Moore', 'patient'),
  ('30000000-0000-0000-0000-000000000020', 'melissa.thomas@example.com', 'Melissa Thomas', 'patient')
ON CONFLICT (id) DO NOTHING;

INSERT INTO patient_profiles (id, date_of_birth, karma_score, reliability_percentage) VALUES
  ('30000000-0000-0000-0000-000000000015', '1989-02-28', 58, 65.0),
  ('30000000-0000-0000-0000-000000000016', '1994-09-14', 55, 62.0),
  ('30000000-0000-0000-0000-000000000017', '1981-11-20', 52, 60.0),
  ('30000000-0000-0000-0000-000000000018', '1996-04-05', 48, 55.0),
  ('30000000-0000-0000-0000-000000000019', '1983-08-16', 45, 52.0),
  ('30000000-0000-0000-0000-000000000020', '1990-12-30', 42, 50.0)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PART 2: UNSCHEDULED ORDERS (30 orders)
-- =====================================================
-- These represent patients waiting to schedule
-- When someone cancels, these patients can claim the slot

-- Dr. Patel (10000000-0000-0000-0000-000000000001) - Pediatrics (6 orders)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, priority, status, estimated_revenue) VALUES
  ('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'follow-up', 'Annual Physical Exam', 'Routine yearly check-up', 'routine', 'unscheduled', 180),
  ('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 'follow-up', 'Well-Child Visit', '6-month wellness check', 'routine', 'unscheduled', 150),
  ('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 'vaccination', 'School Immunizations', 'Required vaccines for school', 'routine', 'unscheduled', 120),
  ('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000001', 'follow-up', 'Sports Physical', 'Athletic participation clearance', 'routine', 'unscheduled', 100),
  ('40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000001', 'sick-visit', 'Persistent Cough Follow-Up', 'Re-check after treatment', 'routine', 'unscheduled', 140),
  ('40000000-0000-0000-0000-000000000015', '30000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000001', 'follow-up', 'Growth & Development Check', 'Monitor development milestones', 'routine', 'unscheduled', 160)
ON CONFLICT (id) DO NOTHING;

-- Dr. Kim (10000000-0000-0000-0000-000000000002) - Endocrinology (5 orders)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, priority, status, estimated_revenue) VALUES
  ('40000000-0000-0000-0000-000000000020', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'lab', 'A1C Blood Test', 'Diabetes monitoring', 'routine', 'unscheduled', 85),
  ('40000000-0000-0000-0000-000000000021', '30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', 'follow-up', 'Thyroid Follow-Up', 'Re-check thyroid levels', 'routine', 'unscheduled', 150),
  ('40000000-0000-0000-0000-000000000022', '30000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002', 'lab', 'Metabolic Panel', 'Comprehensive metabolic screening', 'routine', 'unscheduled', 120),
  ('40000000-0000-0000-0000-000000000023', '30000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000002', 'follow-up', 'Diabetes Education Session', 'Learn insulin management', 'routine', 'unscheduled', 200),
  ('40000000-0000-0000-0000-000000000024', '30000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000002', 'imaging', 'Diabetic Eye Exam', 'Annual retinal screening', 'routine', 'unscheduled', 150)
ON CONFLICT (id) DO NOTHING;

-- Dr. Washington (10000000-0000-0000-0000-000000000003) - Cardiology (5 orders)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, priority, status, estimated_revenue) VALUES
  ('40000000-0000-0000-0000-000000000030', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'follow-up', 'Hypertension Follow-Up', 'Blood pressure management review', 'routine', 'unscheduled', 180),
  ('40000000-0000-0000-0000-000000000031', '30000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000003', 'imaging', 'Echocardiogram', 'Heart function assessment', 'routine', 'unscheduled', 450),
  ('40000000-0000-0000-0000-000000000032', '30000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000003', 'procedure', 'Stress Test', 'Cardiac stress evaluation', 'routine', 'unscheduled', 380),
  ('40000000-0000-0000-0000-000000000033', '30000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000003', 'follow-up', 'Cholesterol Management', 'Lipid panel review', 'routine', 'unscheduled', 150),
  ('40000000-0000-0000-0000-000000000034', '30000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000003', 'follow-up', 'Heart Rhythm Check', 'Arrhythmia monitoring', 'routine', 'unscheduled', 200)
ON CONFLICT (id) DO NOTHING;

-- Dr. Rodriguez (10000000-0000-0000-0000-000000000004) - Psychiatry (4 orders)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, priority, status, estimated_revenue) VALUES
  ('40000000-0000-0000-0000-000000000040', '30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'follow-up', 'Anxiety Management Session', 'Therapy check-in', 'routine', 'unscheduled', 180),
  ('40000000-0000-0000-0000-000000000041', '30000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000004', 'follow-up', 'Medication Adjustment', 'Antidepressant review', 'routine', 'unscheduled', 150),
  ('40000000-0000-0000-0000-000000000042', '30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', 'follow-up', 'ADHD Medication Review', 'Monthly check-in', 'routine', 'unscheduled', 120),
  ('40000000-0000-0000-0000-000000000043', '30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', 'therapy', 'Cognitive Behavioral Therapy', 'CBT session', 'routine', 'unscheduled', 200)
ON CONFLICT (id) DO NOTHING;

-- Dr. Thompson (10000000-0000-0000-0000-000000000005) - Orthopedics (4 orders)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, priority, status, estimated_revenue) VALUES
  ('40000000-0000-0000-0000-000000000050', '30000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000005', 'follow-up', 'Knee Pain Follow-Up', 'Post-treatment check', 'routine', 'unscheduled', 160),
  ('40000000-0000-0000-0000-000000000051', '30000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000005', 'imaging', 'Shoulder MRI', 'Rotator cuff evaluation', 'routine', 'unscheduled', 380),
  ('40000000-0000-0000-0000-000000000052', '30000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000005', 'procedure', 'Joint Injection', 'Cortisone injection', 'routine', 'unscheduled', 250),
  ('40000000-0000-0000-0000-000000000053', '30000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000005', 'follow-up', 'Physical Therapy Consult', 'Rehabilitation planning', 'routine', 'unscheduled', 140)
ON CONFLICT (id) DO NOTHING;

-- Dr. Chen (10000000-0000-0000-0000-000000000006) - Dermatology (3 orders)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, priority, status, estimated_revenue) VALUES
  ('40000000-0000-0000-0000-000000000060', '30000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000006', 'procedure', 'Skin Lesion Removal', 'Mole removal', 'routine', 'unscheduled', 200),
  ('40000000-0000-0000-0000-000000000061', '30000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000006', 'follow-up', 'Acne Treatment Follow-Up', 'Skin check', 'routine', 'unscheduled', 120),
  ('40000000-0000-0000-0000-000000000062', '30000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000006', 'screening', 'Full Body Skin Check', 'Annual screening', 'routine', 'unscheduled', 180)
ON CONFLICT (id) DO NOTHING;

-- Dr. Evans (10000000-0000-0000-0000-000000000007) - OB/GYN (3 orders)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, priority, status, estimated_revenue) VALUES
  ('40000000-0000-0000-0000-000000000070', '30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000007', 'screening', 'Annual Well-Woman Exam', 'Preventive care', 'routine', 'unscheduled', 170),
  ('40000000-0000-0000-0000-000000000071', '30000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000007', 'lab', 'Pregnancy Confirmation', 'Blood test', 'routine', 'unscheduled', 95),
  ('40000000-0000-0000-0000-000000000072', '30000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000007', 'follow-up', 'Hormone Therapy Check', 'Medication review', 'routine', 'unscheduled', 150)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PART 3: SCHEDULED ORDERS (40 orders for appointments)
-- =====================================================
-- Create orders that will be scheduled with appointments

-- Dr. Patel - Pediatrics scheduled orders (10)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, priority, status, estimated_revenue) VALUES
  ('41000000-0000-0000-0000-000000000100', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'follow-up', 'Well-Child Visit', '12-month wellness check', 'routine', 'scheduled', 150),
  ('41000000-0000-0000-0000-000000000101', '30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 'vaccination', 'Flu Shot', 'Annual influenza vaccine', 'routine', 'scheduled', 100),
  ('41000000-0000-0000-0000-000000000102', '30000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 'follow-up', 'School Physical', 'Annual school check-up', 'routine', 'scheduled', 140),
  ('41000000-0000-0000-0000-000000000103', '30000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000001', 'sick-visit', 'Ear Infection Check', 'Follow-up visit', 'routine', 'scheduled', 130),
  ('41000000-0000-0000-0000-000000000104', '30000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000001', 'follow-up', 'Growth Assessment', 'Height and weight check', 'routine', 'scheduled', 120),
  ('41000000-0000-0000-0000-000000000105', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'vaccination', 'MMR Vaccine', 'Measles, mumps, rubella', 'routine', 'scheduled', 110),
  ('41000000-0000-0000-0000-000000000106', '30000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000001', 'follow-up', 'Asthma Check-Up', 'Respiratory evaluation', 'routine', 'scheduled', 160),
  ('41000000-0000-0000-0000-000000000107', '30000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000001', 'follow-up', 'Allergy Consultation', 'Seasonal allergies', 'routine', 'scheduled', 140),
  ('41000000-0000-0000-0000-000000000108', '30000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000001', 'sick-visit', 'Cold Symptoms', 'Upper respiratory infection', 'routine', 'scheduled', 120),
  ('41000000-0000-0000-0000-000000000109', '30000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000001', 'follow-up', 'Developmental Screening', 'Milestone check', 'routine', 'scheduled', 150)
ON CONFLICT (id) DO NOTHING;

-- Dr. Kim - Endocrinology scheduled orders (8)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, priority, status, estimated_revenue) VALUES
  ('41000000-0000-0000-0000-000000000110', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'lab', 'Diabetes Screening', 'A1C and glucose test', 'routine', 'scheduled', 90),
  ('41000000-0000-0000-0000-000000000111', '30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'follow-up', 'Thyroid Check', 'TSH levels review', 'routine', 'scheduled', 150),
  ('41000000-0000-0000-0000-000000000112', '30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'follow-up', 'Insulin Management', 'Diabetes care review', 'routine', 'scheduled', 180),
  ('41000000-0000-0000-0000-000000000113', '30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'lab', 'Lipid Panel', 'Cholesterol screening', 'routine', 'scheduled', 85),
  ('41000000-0000-0000-0000-000000000114', '30000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', 'follow-up', 'Metabolic Syndrome Review', 'Comprehensive check', 'routine', 'scheduled', 200),
  ('41000000-0000-0000-0000-000000000115', '30000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000002', 'lab', 'Hormone Panel', 'Endocrine function test', 'routine', 'scheduled', 120),
  ('41000000-0000-0000-0000-000000000116', '30000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000002', 'follow-up', 'Diabetes Education', 'Lifestyle counseling', 'routine', 'scheduled', 150),
  ('41000000-0000-0000-0000-000000000117', '30000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000002', 'imaging', 'Bone Density Scan', 'Osteoporosis screening', 'routine', 'scheduled', 220)
ON CONFLICT (id) DO NOTHING;

-- Dr. Washington - Cardiology scheduled orders (8)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, priority, status, estimated_revenue) VALUES
  ('41000000-0000-0000-0000-000000000120', '30000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000003', 'imaging', 'EKG', 'Heart rhythm test', 'routine', 'scheduled', 150),
  ('41000000-0000-0000-0000-000000000121', '30000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000003', 'follow-up', 'Blood Pressure Check', 'Hypertension monitoring', 'routine', 'scheduled', 120),
  ('41000000-0000-0000-0000-000000000122', '30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', 'procedure', 'Holter Monitor Setup', '24-hour EKG monitoring', 'routine', 'scheduled', 280),
  ('41000000-0000-0000-0000-000000000123', '30000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000003', 'imaging', 'Echocardiogram', 'Heart ultrasound', 'routine', 'scheduled', 450),
  ('41000000-0000-0000-0000-000000000124', '30000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000003', 'follow-up', 'Cardiac Risk Assessment', 'Heart health evaluation', 'routine', 'scheduled', 180),
  ('41000000-0000-0000-0000-000000000125', '30000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000003', 'lab', 'Lipid Profile', 'Cholesterol and triglycerides', 'routine', 'scheduled', 95),
  ('41000000-0000-0000-0000-000000000126', '30000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000003', 'procedure', 'Stress Test', 'Exercise cardiac evaluation', 'routine', 'scheduled', 380),
  ('41000000-0000-0000-0000-000000000127', '30000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000003', 'follow-up', 'Heart Failure Follow-Up', 'Medication adjustment', 'routine', 'scheduled', 200)
ON CONFLICT (id) DO NOTHING;

-- Dr. Rodriguez - Psychiatry scheduled orders (6)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, priority, status, estimated_revenue) VALUES
  ('41000000-0000-0000-0000-000000000130', '30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000004', 'therapy', 'Depression Counseling', 'Therapeutic session', 'routine', 'scheduled', 180),
  ('41000000-0000-0000-0000-000000000131', '30000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000004', 'follow-up', 'Medication Review', 'Psychiatric medication check', 'routine', 'scheduled', 150),
  ('41000000-0000-0000-0000-000000000132', '30000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000004', 'therapy', 'Anxiety Therapy', 'CBT session', 'routine', 'scheduled', 180),
  ('41000000-0000-0000-0000-000000000133', '30000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000004', 'follow-up', 'ADHD Management', 'Medication titration', 'routine', 'scheduled', 160),
  ('41000000-0000-0000-0000-000000000134', '30000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000004', 'therapy', 'Behavioral Therapy', 'Coping strategies', 'routine', 'scheduled', 180),
  ('41000000-0000-0000-0000-000000000135', '30000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000004', 'follow-up', 'Mood Disorder Check', 'Bipolar monitoring', 'routine', 'scheduled', 170)
ON CONFLICT (id) DO NOTHING;

-- Dr. Thompson - Orthopedics scheduled orders (4)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, priority, status, estimated_revenue) VALUES
  ('41000000-0000-0000-0000-000000000140', '30000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000005', 'imaging', 'Knee X-Ray', 'Joint imaging', 'routine', 'scheduled', 180),
  ('41000000-0000-0000-0000-000000000141', '30000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000005', 'follow-up', 'Sports Injury Follow-Up', 'Recovery assessment', 'routine', 'scheduled', 160),
  ('41000000-0000-0000-0000-000000000142', '30000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000005', 'procedure', 'Cortisone Injection', 'Joint pain relief', 'routine', 'scheduled', 250),
  ('41000000-0000-0000-0000-000000000143', '30000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000005', 'follow-up', 'Physical Therapy Eval', 'Rehabilitation plan', 'routine', 'scheduled', 140)
ON CONFLICT (id) DO NOTHING;

-- Other doctors scheduled orders (4)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, description, priority, status, estimated_revenue) VALUES
  ('41000000-0000-0000-0000-000000000150', '30000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000006', 'procedure', 'Skin Tag Removal', 'Minor procedure', 'routine', 'scheduled', 150),
  ('41000000-0000-0000-0000-000000000151', '30000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000007', 'screening', 'Pap Smear', 'Cervical cancer screening', 'routine', 'scheduled', 140),
  ('41000000-0000-0000-0000-000000000152', '30000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000008', 'imaging', 'Brain MRI', 'Neurological imaging', 'routine', 'scheduled', 680),
  ('41000000-0000-0000-0000-000000000153', '30000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000009', 'screening', 'Eye Exam', 'Vision screening', 'routine', 'scheduled', 120)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PART 4: SCHEDULED APPOINTMENTS (40 appointments)
-- =====================================================
-- Now create appointments linked to the scheduled orders above

-- ============ DR. PATEL - PEDIATRICS (10 appointments) ============

-- Week 1 - Monday 9:30 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000100',
   '41000000-0000-0000-0000-000000000100',
   '30000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   (DATE_TRUNC('week', NOW()) + INTERVAL '1 day' + INTERVAL '9 hours 30 minutes')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '1 day' + INTERVAL '10 hours')::TIMESTAMPTZ,
   'Primary Care Medical Group',
   ARRAY['Nurse Amy', 'MA Carlos'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Week 1 - Monday 2:00 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000101',
   '41000000-0000-0000-0000-000000000101',
   '30000000-0000-0000-0000-000000000007',
   '10000000-0000-0000-0000-000000000001',
   (DATE_TRUNC('week', NOW()) + INTERVAL '1 day' + INTERVAL '14 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '1 day' + INTERVAL '14 hours 30 minutes')::TIMESTAMPTZ,
   'Primary Care Medical Group',
   ARRAY['Nurse Amy'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Week 1 - Tuesday 10:00 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000102',
   '41000000-0000-0000-0000-000000000102',
   '30000000-0000-0000-0000-000000000009',
   '10000000-0000-0000-0000-000000000001',
   (DATE_TRUNC('week', NOW()) + INTERVAL '2 days' + INTERVAL '10 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '2 days' + INTERVAL '10 hours 30 minutes')::TIMESTAMPTZ,
   'Primary Care Medical Group',
   ARRAY['Nurse Amy', 'MA Carlos'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Week 1 - Wednesday 3:00 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000103',
   '41000000-0000-0000-0000-000000000103',
   '30000000-0000-0000-0000-000000000015',
   '10000000-0000-0000-0000-000000000001',
   (DATE_TRUNC('week', NOW()) + INTERVAL '3 days' + INTERVAL '15 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '3 days' + INTERVAL '15 hours 30 minutes')::TIMESTAMPTZ,
   'Primary Care Medical Group',
   ARRAY['MA Carlos'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Week 1 - Thursday 11:00 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000104',
   '41000000-0000-0000-0000-000000000104',
   '30000000-0000-0000-0000-000000000016',
   '10000000-0000-0000-0000-000000000001',
   (DATE_TRUNC('week', NOW()) + INTERVAL '4 days' + INTERVAL '11 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '4 days' + INTERVAL '11 hours 30 minutes')::TIMESTAMPTZ,
   'Primary Care Medical Group',
   ARRAY['Nurse Amy'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Week 1 - Friday 1:30 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000105',
   '41000000-0000-0000-0000-000000000105',
   '30000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   (DATE_TRUNC('week', NOW()) + INTERVAL '5 days' + INTERVAL '13 hours 30 minutes')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '5 days' + INTERVAL '14 hours')::TIMESTAMPTZ,
   'Primary Care Medical Group',
   ARRAY['Nurse Amy', 'MA Carlos'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Week 2 - Monday 10:30 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000106',
   '41000000-0000-0000-0000-000000000106',
   '30000000-0000-0000-0000-000000000021',
   '10000000-0000-0000-0000-000000000001',
   (DATE_TRUNC('week', NOW()) + INTERVAL '8 days' + INTERVAL '10 hours 30 minutes')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '8 days' + INTERVAL '11 hours')::TIMESTAMPTZ,
   'Primary Care Medical Group',
   ARRAY['Nurse Amy'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Week 2 - Tuesday 2:30 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000107',
   '41000000-0000-0000-0000-000000000107',
   '30000000-0000-0000-0000-000000000022',
   '10000000-0000-0000-0000-000000000001',
   (DATE_TRUNC('week', NOW()) + INTERVAL '9 days' + INTERVAL '14 hours 30 minutes')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '9 days' + INTERVAL '15 hours')::TIMESTAMPTZ,
   'Primary Care Medical Group',
   ARRAY['MA Carlos'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Week 2 - Thursday 9:00 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000108',
   '41000000-0000-0000-0000-000000000108',
   '30000000-0000-0000-0000-000000000023',
   '10000000-0000-0000-0000-000000000001',
   (DATE_TRUNC('week', NOW()) + INTERVAL '11 days' + INTERVAL '9 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '11 days' + INTERVAL '9 hours 30 minutes')::TIMESTAMPTZ,
   'Primary Care Medical Group',
   ARRAY['Nurse Amy', 'MA Carlos'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Week 3 - Wednesday 11:30 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000109',
   '41000000-0000-0000-0000-000000000109',
   '30000000-0000-0000-0000-000000000024',
   '10000000-0000-0000-0000-000000000001',
   (DATE_TRUNC('week', NOW()) + INTERVAL '17 days' + INTERVAL '11 hours 30 minutes')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '17 days' + INTERVAL '12 hours')::TIMESTAMPTZ,
   'Primary Care Medical Group',
   ARRAY['Nurse Amy'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- ============ DR. KIM - ENDOCRINOLOGY (8 appointments) ============

-- Week 1 - Monday 10:00 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000110',
   '41000000-0000-0000-0000-000000000110',
   '30000000-0000-0000-0000-000000000003',
   '10000000-0000-0000-0000-000000000002',
   (DATE_TRUNC('week', NOW()) + INTERVAL '1 day' + INTERVAL '10 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '1 day' + INTERVAL '10 hours 30 minutes')::TIMESTAMPTZ,
   'Endocrinology & Diabetes Center',
   ARRAY['Lab Tech Maria', 'Diabetes Educator Tom'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Week 1 - Tuesday 1:00 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000111',
   '41000000-0000-0000-0000-000000000111',
   '30000000-0000-0000-0000-000000000004',
   '10000000-0000-0000-0000-000000000002',
   (DATE_TRUNC('week', NOW()) + INTERVAL '2 days' + INTERVAL '13 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '2 days' + INTERVAL '13 hours 30 minutes')::TIMESTAMPTZ,
   'Endocrinology & Diabetes Center',
   ARRAY['Lab Tech Maria'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Week 1 - Thursday 9:30 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000112',
   '41000000-0000-0000-0000-000000000112',
   '30000000-0000-0000-0000-000000000005',
   '10000000-0000-0000-0000-000000000002',
   (DATE_TRUNC('week', NOW()) + INTERVAL '4 days' + INTERVAL '9 hours 30 minutes')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '4 days' + INTERVAL '10 hours')::TIMESTAMPTZ,
   'Endocrinology & Diabetes Center',
   ARRAY['Diabetes Educator Tom'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Week 1 - Friday 11:00 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000113',
   '41000000-0000-0000-0000-000000000113',
   '30000000-0000-0000-0000-000000000006',
   '10000000-0000-0000-0000-000000000002',
   (DATE_TRUNC('week', NOW()) + INTERVAL '5 days' + INTERVAL '11 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '5 days' + INTERVAL '11 hours 30 minutes')::TIMESTAMPTZ,
   'Endocrinology & Diabetes Center',
   ARRAY['Lab Tech Maria', 'Diabetes Educator Tom'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Week 2 - Monday 2:00 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000114',
   '41000000-0000-0000-0000-000000000114',
   '30000000-0000-0000-0000-000000000011',
   '10000000-0000-0000-0000-000000000002',
   (DATE_TRUNC('week', NOW()) + INTERVAL '8 days' + INTERVAL '14 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '8 days' + INTERVAL '14 hours 30 minutes')::TIMESTAMPTZ,
   'Endocrinology & Diabetes Center',
   ARRAY['Lab Tech Maria'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Week 2 - Wednesday 10:30 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000115',
   '41000000-0000-0000-0000-000000000115',
   '30000000-0000-0000-0000-000000000012',
   '10000000-0000-0000-0000-000000000002',
   (DATE_TRUNC('week', NOW()) + INTERVAL '10 days' + INTERVAL '10 hours 30 minutes')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '10 days' + INTERVAL '11 hours')::TIMESTAMPTZ,
   'Endocrinology & Diabetes Center',
   ARRAY['Diabetes Educator Tom'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Week 2 - Friday 3:00 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000116',
   '41000000-0000-0000-0000-000000000116',
   '30000000-0000-0000-0000-000000000013',
   '10000000-0000-0000-0000-000000000002',
   (DATE_TRUNC('week', NOW()) + INTERVAL '12 days' + INTERVAL '15 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '12 days' + INTERVAL '15 hours 30 minutes')::TIMESTAMPTZ,
   'Endocrinology & Diabetes Center',
   ARRAY['Lab Tech Maria'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Week 3 - Tuesday 1:30 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000117',
   '41000000-0000-0000-0000-000000000117',
   '30000000-0000-0000-0000-000000000014',
   '10000000-0000-0000-0000-000000000002',
   (DATE_TRUNC('week', NOW()) + INTERVAL '16 days' + INTERVAL '13 hours 30 minutes')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '16 days' + INTERVAL '14 hours')::TIMESTAMPTZ,
   'Endocrinology & Diabetes Center',
   ARRAY['Diabetes Educator Tom'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- ============ DR. WASHINGTON - CARDIOLOGY (8 appointments) ============

-- Week 1 - Monday 11:30 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000120',
   '41000000-0000-0000-0000-000000000120',
   '30000000-0000-0000-0000-000000000025',
   '10000000-0000-0000-0000-000000000003',
   (DATE_TRUNC('week', NOW()) + INTERVAL '1 day' + INTERVAL '11 hours 30 minutes')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '1 day' + INTERVAL '12 hours')::TIMESTAMPTZ,
   'Heart & Vascular Institute',
   ARRAY['Cardiac Tech Lisa', 'RN Michael'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Week 1 - Tuesday 9:00 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000121',
   '41000000-0000-0000-0000-000000000121',
   '30000000-0000-0000-0000-000000000026',
   '10000000-0000-0000-0000-000000000003',
   (DATE_TRUNC('week', NOW()) + INTERVAL '2 days' + INTERVAL '9 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '2 days' + INTERVAL '9 hours 45 minutes')::TIMESTAMPTZ,
   'Heart & Vascular Institute',
   ARRAY['Cardiac Tech Lisa'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Week 1 - Wednesday 2:00 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000122',
   '41000000-0000-0000-0000-000000000122',
   '30000000-0000-0000-0000-000000000008',
   '10000000-0000-0000-0000-000000000003',
   (DATE_TRUNC('week', NOW()) + INTERVAL '3 days' + INTERVAL '14 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '3 days' + INTERVAL '14 hours 45 minutes')::TIMESTAMPTZ,
   'Heart & Vascular Institute',
   ARRAY['RN Michael'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Week 1 - Thursday 3:30 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000123',
   '41000000-0000-0000-0000-000000000123',
   '30000000-0000-0000-0000-000000000010',
   '10000000-0000-0000-0000-000000000003',
   (DATE_TRUNC('week', NOW()) + INTERVAL '4 days' + INTERVAL '15 hours 30 minutes')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '4 days' + INTERVAL '16 hours 15 minutes')::TIMESTAMPTZ,
   'Heart & Vascular Institute',
   ARRAY['Cardiac Tech Lisa', 'RN Michael'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Week 2 - Monday 9:30 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000124',
   '41000000-0000-0000-0000-000000000124',
   '30000000-0000-0000-0000-000000000017',
   '10000000-0000-0000-0000-000000000003',
   (DATE_TRUNC('week', NOW()) + INTERVAL '8 days' + INTERVAL '9 hours 30 minutes')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '8 days' + INTERVAL '10 hours 15 minutes')::TIMESTAMPTZ,
   'Heart & Vascular Institute',
   ARRAY['Cardiac Tech Lisa'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Week 2 - Wednesday 1:00 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000125',
   '41000000-0000-0000-0000-000000000125',
   '30000000-0000-0000-0000-000000000018',
   '10000000-0000-0000-0000-000000000003',
   (DATE_TRUNC('week', NOW()) + INTERVAL '10 days' + INTERVAL '13 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '10 days' + INTERVAL '13 hours 45 minutes')::TIMESTAMPTZ,
   'Heart & Vascular Institute',
   ARRAY['RN Michael'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Week 2 - Thursday 10:00 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000126',
   '41000000-0000-0000-0000-000000000126',
   '30000000-0000-0000-0000-000000000019',
   '10000000-0000-0000-0000-000000000003',
   (DATE_TRUNC('week', NOW()) + INTERVAL '11 days' + INTERVAL '10 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '11 days' + INTERVAL '10 hours 45 minutes')::TIMESTAMPTZ,
   'Heart & Vascular Institute',
   ARRAY['Cardiac Tech Lisa', 'RN Michael'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Week 3 - Monday 11:00 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000127',
   '41000000-0000-0000-0000-000000000127',
   '30000000-0000-0000-0000-000000000020',
   '10000000-0000-0000-0000-000000000003',
   (DATE_TRUNC('week', NOW()) + INTERVAL '15 days' + INTERVAL '11 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '15 days' + INTERVAL '11 hours 45 minutes')::TIMESTAMPTZ,
   'Heart & Vascular Institute',
   ARRAY['Cardiac Tech Lisa'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- ============ DR. RODRIGUEZ - PSYCHIATRY (6 appointments) ============

-- Week 1 - Monday 1:00 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000130',
   '41000000-0000-0000-0000-000000000130',
   '30000000-0000-0000-0000-000000000007',
   '10000000-0000-0000-0000-000000000004',
   (DATE_TRUNC('week', NOW()) + INTERVAL '1 day' + INTERVAL '13 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '1 day' + INTERVAL '14 hours')::TIMESTAMPTZ,
   'Behavioral Health Center',
   ARRAY['Therapist Sarah', 'Medical Assistant Jake'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Week 1 - Wednesday 10:00 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000131',
   '41000000-0000-0000-0000-000000000131',
   '30000000-0000-0000-0000-000000000021',
   '10000000-0000-0000-0000-000000000004',
   (DATE_TRUNC('week', NOW()) + INTERVAL '3 days' + INTERVAL '10 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '3 days' + INTERVAL '11 hours')::TIMESTAMPTZ,
   'Behavioral Health Center',
   ARRAY['Therapist Sarah'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Week 1 - Friday 2:00 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000132',
   '41000000-0000-0000-0000-000000000132',
   '30000000-0000-0000-0000-000000000022',
   '10000000-0000-0000-0000-000000000004',
   (DATE_TRUNC('week', NOW()) + INTERVAL '5 days' + INTERVAL '14 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '5 days' + INTERVAL '15 hours')::TIMESTAMPTZ,
   'Behavioral Health Center',
   ARRAY['Medical Assistant Jake'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Week 2 - Tuesday 11:00 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000133',
   '41000000-0000-0000-0000-000000000133',
   '30000000-0000-0000-0000-000000000023',
   '10000000-0000-0000-0000-000000000004',
   (DATE_TRUNC('week', NOW()) + INTERVAL '9 days' + INTERVAL '11 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '9 days' + INTERVAL '12 hours')::TIMESTAMPTZ,
   'Behavioral Health Center',
   ARRAY['Therapist Sarah', 'Medical Assistant Jake'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Week 2 - Thursday 3:00 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000134',
   '41000000-0000-0000-0000-000000000134',
   '30000000-0000-0000-0000-000000000024',
   '10000000-0000-0000-0000-000000000004',
   (DATE_TRUNC('week', NOW()) + INTERVAL '11 days' + INTERVAL '15 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '11 days' + INTERVAL '16 hours')::TIMESTAMPTZ,
   'Behavioral Health Center',
   ARRAY['Therapist Sarah'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Week 3 - Monday 9:00 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000135',
   '41000000-0000-0000-0000-000000000135',
   '30000000-0000-0000-0000-000000000025',
   '10000000-0000-0000-0000-000000000004',
   (DATE_TRUNC('week', NOW()) + INTERVAL '15 days' + INTERVAL '9 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '15 days' + INTERVAL '10 hours')::TIMESTAMPTZ,
   'Behavioral Health Center',
   ARRAY['Medical Assistant Jake'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- ============ DR. THOMPSON - ORTHOPEDICS (4 appointments) ============

-- Week 1 - Tuesday 3:00 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000140',
   '41000000-0000-0000-0000-000000000140',
   '30000000-0000-0000-0000-000000000026',
   '10000000-0000-0000-0000-000000000005',
   (DATE_TRUNC('week', NOW()) + INTERVAL '2 days' + INTERVAL '15 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '2 days' + INTERVAL '15 hours 45 minutes')::TIMESTAMPTZ,
   'Orthopedic & Sports Medicine',
   ARRAY['PT Rachel', 'MA David'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Week 1 - Thursday 1:30 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000141',
   '41000000-0000-0000-0000-000000000141',
   '30000000-0000-0000-0000-000000000009',
   '10000000-0000-0000-0000-000000000005',
   (DATE_TRUNC('week', NOW()) + INTERVAL '4 days' + INTERVAL '13 hours 30 minutes')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '4 days' + INTERVAL '14 hours 15 minutes')::TIMESTAMPTZ,
   'Orthopedic & Sports Medicine',
   ARRAY['PT Rachel'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Week 2 - Tuesday 10:00 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000142',
   '41000000-0000-0000-0000-000000000142',
   '30000000-0000-0000-0000-000000000011',
   '10000000-0000-0000-0000-000000000005',
   (DATE_TRUNC('week', NOW()) + INTERVAL '9 days' + INTERVAL '10 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '9 days' + INTERVAL '10 hours 45 minutes')::TIMESTAMPTZ,
   'Orthopedic & Sports Medicine',
   ARRAY['MA David'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Week 2 - Friday 11:30 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000143',
   '41000000-0000-0000-0000-000000000143',
   '30000000-0000-0000-0000-000000000012',
   '10000000-0000-0000-0000-000000000005',
   (DATE_TRUNC('week', NOW()) + INTERVAL '12 days' + INTERVAL '11 hours 30 minutes')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '12 days' + INTERVAL '12 hours 15 minutes')::TIMESTAMPTZ,
   'Orthopedic & Sports Medicine',
   ARRAY['PT Rachel', 'MA David'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- ============ REMAINING DOCTORS (4 appointments total) ============

-- Dr. Chen (Dermatology) - Week 1 Wednesday 11:00 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000150',
   '41000000-0000-0000-0000-000000000150',
   '30000000-0000-0000-0000-000000000013',
   '10000000-0000-0000-0000-000000000006',
   (DATE_TRUNC('week', NOW()) + INTERVAL '3 days' + INTERVAL '11 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '3 days' + INTERVAL '11 hours 30 minutes')::TIMESTAMPTZ,
   'Skin & Laser Dermatology',
   ARRAY['RN Sophie'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Dr. Evans (OB/GYN) - Week 1 Friday 10:00 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000151',
   '41000000-0000-0000-0000-000000000151',
   '30000000-0000-0000-0000-000000000014',
   '10000000-0000-0000-0000-000000000007',
   (DATE_TRUNC('week', NOW()) + INTERVAL '5 days' + INTERVAL '10 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '5 days' + INTERVAL '10 hours 45 minutes')::TIMESTAMPTZ,
   'Women''s Health Specialists',
   ARRAY['RN Patricia', 'MA Kelly'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- Dr. Anderson (Neurology) - Week 2 Monday 11:00 AM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000152',
   '41000000-0000-0000-0000-000000000152',
   '30000000-0000-0000-0000-000000000015',
   '10000000-0000-0000-0000-000000000008',
   (DATE_TRUNC('week', NOW()) + INTERVAL '8 days' + INTERVAL '11 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '8 days' + INTERVAL '12 hours')::TIMESTAMPTZ,
   'Neurology Associates',
   ARRAY['Neuro Tech James'],
   'confirmed',
   false)
ON CONFLICT (id) DO NOTHING;

-- Dr. Foster (Ophthalmology) - Week 2 Wednesday 2:00 PM
INSERT INTO appointments (id, order_id, patient_id, provider_id, scheduled_start, scheduled_end, location, staff_assigned, status, confirmation_required) VALUES
  ('50000000-0000-0000-0000-000000000153',
   '41000000-0000-0000-0000-000000000153',
   '30000000-0000-0000-0000-000000000016',
   '10000000-0000-0000-0000-000000000009',
   (DATE_TRUNC('week', NOW()) + INTERVAL '10 days' + INTERVAL '14 hours')::TIMESTAMPTZ,
   (DATE_TRUNC('week', NOW()) + INTERVAL '10 days' + INTERVAL '14 hours 45 minutes')::TIMESTAMPTZ,
   'Eye Care Center',
   ARRAY['Optometric Tech Nina'],
   'scheduled',
   true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES (commented out, run manually)
-- =====================================================

-- Check patient count (should be 27 total: 7 original + 20 new)
-- SELECT COUNT(*) FROM patient_profiles;

-- Check karma distribution
-- SELECT
--   CASE
--     WHEN karma_score >= 80 THEN 'High (80-100)'
--     WHEN karma_score >= 60 THEN 'Medium (60-79)'
--     ELSE 'Lower (40-59)'
--   END as tier,
--   COUNT(*) as count
-- FROM patient_profiles
-- GROUP BY tier
-- ORDER BY tier DESC;

-- Check appointments per doctor
-- SELECT
--   u.full_name,
--   COUNT(a.id) as appointment_count
-- FROM users u
-- LEFT JOIN appointments a ON a.provider_id = u.id
-- WHERE u.role = 'provider'
-- GROUP BY u.full_name
-- ORDER BY appointment_count DESC;

-- Check unscheduled orders (should be around 30)
-- SELECT COUNT(*) FROM orders WHERE status = 'unscheduled';

-- Check scheduled appointments (should be 40)
-- SELECT COUNT(*) FROM appointments WHERE status IN ('scheduled', 'confirmed');
