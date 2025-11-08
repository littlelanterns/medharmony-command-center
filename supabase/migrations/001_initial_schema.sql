-- MedHarmony Command Center - Initial Database Schema
-- Run this in your Supabase SQL Editor

-- Users table (handles all user types)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('provider', 'patient', 'caregiver', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider profiles
CREATE TABLE provider_profiles (
  id UUID PRIMARY KEY REFERENCES users(id),
  specialty TEXT,
  license_number TEXT,
  organization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient profiles
CREATE TABLE patient_profiles (
  id UUID PRIMARY KEY REFERENCES users(id),
  date_of_birth DATE,
  phone TEXT,
  address TEXT,
  insurance_info JSONB,
  karma_score INTEGER DEFAULT 50,
  reliability_percentage DECIMAL DEFAULT 100.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID NOT NULL REFERENCES users(id),
  order_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('routine', 'urgent', 'stat')),
  due_within_days INTEGER,
  status TEXT DEFAULT 'unscheduled' CHECK (status IN ('unscheduled', 'scheduled', 'completed', 'cancelled')),
  estimated_revenue DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prerequisites
CREATE TABLE prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES users(id),
  prerequisite_type TEXT NOT NULL,
  description TEXT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  patient_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID REFERENCES users(id),
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  staff_assigned TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show')),
  confirmation_required BOOLEAN DEFAULT true,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability preferences
CREATE TABLE availability_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id),
  preference_type TEXT NOT NULL CHECK (preference_type IN ('recurring_block', 'one_time_block', 'preferred_time', 'notice_requirement')),
  day_of_week INTEGER,
  start_time TIME,
  end_time TIME,
  block_start TIMESTAMPTZ,
  block_end TIMESTAMPTZ,
  preference_data JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_order_id UUID REFERENCES orders(id),
  related_appointment_id UUID REFERENCES appointments(id),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled reminders
CREATE TABLE scheduled_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES users(id),
  prerequisite_id UUID REFERENCES prerequisites(id),
  reminder_type TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  message TEXT NOT NULL,
  channels JSONB DEFAULT '["email", "sms"]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cancellation alerts
CREATE TABLE cancellation_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cancelled_appointment_id UUID NOT NULL REFERENCES appointments(id),
  original_patient_id UUID NOT NULL REFERENCES users(id),
  notified_patient_id UUID NOT NULL REFERENCES users(id),
  alert_sent_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired', 'ignored'))
);

-- Karma history
CREATE TABLE karma_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id),
  action_type TEXT NOT NULL,
  points_change INTEGER NOT NULL,
  related_appointment_id UUID REFERENCES appointments(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI activity log
CREATE TABLE ai_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  input_data JSONB,
  output_data JSONB,
  model_used TEXT,
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  locations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_patient_id ON orders(patient_id);
CREATE INDEX idx_orders_provider_id ON orders(provider_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_scheduled_start ON appointments(scheduled_start);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_karma_history_patient_id ON karma_history(patient_id);
CREATE INDEX idx_scheduled_reminders_scheduled_for ON scheduled_reminders(scheduled_for);
CREATE INDEX idx_scheduled_reminders_status ON scheduled_reminders(status);

-- Success message
SELECT 'MedHarmony schema created successfully! Now run 002_seed_data.sql' as message;
