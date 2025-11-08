-- MedHarmony Command Center - Seed Data
-- Run this after 001_initial_schema.sql

-- Demo users
INSERT INTO users (id, email, full_name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'dr.jones@medharmony.demo', 'Dr. Sarah Jones', 'provider'),
  ('22222222-2222-2222-2222-222222222222', 'sarah.martinez@example.com', 'Sarah Martinez', 'patient'),
  ('33333333-3333-3333-3333-333333333333', 'john.davis@example.com', 'John Davis', 'patient');

-- Patient profiles with karma scores
INSERT INTO patient_profiles (id, date_of_birth, karma_score, reliability_percentage) VALUES
  ('22222222-2222-2222-2222-222222222222', '1982-01-15', 95, 95.0),
  ('33333333-3333-3333-3333-333333333333', '1966-03-22', 78, 85.0);

-- Provider profile
INSERT INTO provider_profiles (id, specialty, organization) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Primary Care', 'MedHarmony Clinic');

-- Demo order (unscheduled - for testing the full flow)
INSERT INTO orders (id, patient_id, provider_id, order_type, title, priority, status, estimated_revenue) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'lab', 'Fasting Bloodwork + Lipid Panel', 'routine', 'unscheduled', 200);

-- Prerequisites for the demo order
INSERT INTO prerequisites (order_id, provider_id, prerequisite_type, description) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'fasting', 'Fast for 8 hours before appointment'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'medication_stop', 'Stop blood thinner medication 24 hours before'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'bring_documents', 'Bring insurance card and ID'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'preparation', 'Morning appointment preferred (for fasting compliance)');

-- Sarah's availability preferences
INSERT INTO availability_preferences (patient_id, preference_type, day_of_week, start_time, end_time, preference_data) VALUES
  ('22222222-2222-2222-2222-222222222222', 'recurring_block', 2, '09:00:00', '11:00:00', '{"reason": "Kids music class"}'),
  ('22222222-2222-2222-2222-222222222222', 'recurring_block', 4, '09:00:00', '11:00:00', '{"reason": "Kids music class"}'),
  ('22222222-2222-2222-2222-222222222222', 'notice_requirement', NULL, NULL, NULL, '{"hours_needed": 2}');

-- Add some karma history for Sarah to show her excellent track record
INSERT INTO karma_history (patient_id, action_type, points_change, description) VALUES
  ('22222222-2222-2222-2222-222222222222', 'kept_appointment', 20, 'Kept cardiology appointment on time'),
  ('22222222-2222-2222-2222-222222222222', 'kept_appointment', 20, 'Kept physical exam appointment'),
  ('22222222-2222-2222-2222-222222222222', 'cancelled_with_3plus_days', 5, 'Rescheduled appointment with 1 week notice'),
  ('22222222-2222-2222-2222-222222222222', 'claimed_cancellation', 10, 'Helped fill cancelled slot');

-- Success message
SELECT 'Demo data seeded successfully! You can now login and test the application.' as message;
