-- Provider Schedules Table
-- Allows providers to define when they're available at different locations

CREATE TABLE provider_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  staff_available TEXT[], -- Array of staff names available at this time
  appointment_duration_minutes INTEGER DEFAULT 30,
  max_appointments_per_slot INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure no overlapping times for same provider/location/day
  CONSTRAINT no_overlap EXCLUDE USING gist (
    provider_id WITH =,
    location WITH =,
    day_of_week WITH =,
    tstzrange(
      (CURRENT_DATE + start_time)::timestamptz,
      (CURRENT_DATE + end_time)::timestamptz
    ) WITH &&
  ) WHERE (is_active = true)
);

-- Indexes for performance
CREATE INDEX idx_provider_schedules_provider_id ON provider_schedules(provider_id);
CREATE INDEX idx_provider_schedules_location ON provider_schedules(location);
CREATE INDEX idx_provider_schedules_day_of_week ON provider_schedules(day_of_week);
CREATE INDEX idx_provider_schedules_active ON provider_schedules(is_active);

-- Seed default schedules for Dr. Sarah Jones
-- This gives her availability at 3 lab locations, Monday-Friday

INSERT INTO provider_schedules (provider_id, location, day_of_week, start_time, end_time, staff_available, notes) VALUES
-- MedHarmony Labs - Main St (Monday-Friday, 7:00am - 4:00pm)
('11111111-1111-1111-1111-111111111111', 'MedHarmony Labs - Main St', 1, '07:00', '16:00', ARRAY['Lisa Chen', 'Mark Johnson'], 'Primary location with experienced phlebotomists'),
('11111111-1111-1111-1111-111111111111', 'MedHarmony Labs - Main St', 2, '07:00', '16:00', ARRAY['Lisa Chen', 'Mark Johnson'], 'Primary location with experienced phlebotomists'),
('11111111-1111-1111-1111-111111111111', 'MedHarmony Labs - Main St', 3, '07:00', '16:00', ARRAY['Lisa Chen', 'Mark Johnson'], 'Primary location with experienced phlebotomists'),
('11111111-1111-1111-1111-111111111111', 'MedHarmony Labs - Main St', 4, '07:00', '16:00', ARRAY['Lisa Chen', 'Mark Johnson'], 'Primary location with experienced phlebotomists'),
('11111111-1111-1111-1111-111111111111', 'MedHarmony Labs - Main St', 5, '07:00', '16:00', ARRAY['Lisa Chen', 'Mark Johnson'], 'Primary location with experienced phlebotomists'),

-- MedHarmony Labs - Oak Ave (Monday, Wednesday, Friday, 8:00am - 3:00pm)
('11111111-1111-1111-1111-111111111111', 'MedHarmony Labs - Oak Ave', 1, '08:00', '15:00', ARRAY['Amy Wu'], 'Satellite location, closer to residential area'),
('11111111-1111-1111-1111-111111111111', 'MedHarmony Labs - Oak Ave', 3, '08:00', '15:00', ARRAY['Amy Wu'], 'Satellite location, closer to residential area'),
('11111111-1111-1111-1111-111111111111', 'MedHarmony Labs - Oak Ave', 5, '08:00', '15:00', ARRAY['Amy Wu'], 'Satellite location, closer to residential area'),

-- MedHarmony Labs - Riverside (Tuesday, Thursday, 7:30am - 2:30pm)
('11111111-1111-1111-1111-111111111111', 'MedHarmony Labs - Riverside', 2, '07:30', '14:30', ARRAY['Lisa Chen', 'Amy Wu'], 'Near hospital, convenient for urgent cases'),
('11111111-1111-1111-1111-111111111111', 'MedHarmony Labs - Riverside', 4, '07:30', '14:30', ARRAY['Lisa Chen', 'Amy Wu'], 'Near hospital, convenient for urgent cases');

COMMENT ON TABLE provider_schedules IS 'Defines when and where providers are available for appointments';
COMMENT ON COLUMN provider_schedules.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
COMMENT ON COLUMN provider_schedules.staff_available IS 'Array of staff members (nurses, phlebotomists, etc.) available during this time slot';
COMMENT ON COLUMN provider_schedules.appointment_duration_minutes IS 'Default duration for appointments in this slot';
COMMENT ON COLUMN provider_schedules.max_appointments_per_slot IS 'Maximum concurrent appointments that can be scheduled';
