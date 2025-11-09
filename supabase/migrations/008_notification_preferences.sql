-- Add notification preferences to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT false;

-- Create notification preferences table for granular control
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'cancellation_alert', 'appointment_confirmed', 'time_block_notification', etc.
  send_in_app BOOLEAN DEFAULT true,
  send_email BOOLEAN DEFAULT true,
  send_sms BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Create email/SMS log table for tracking and debugging
CREATE TABLE IF NOT EXISTS communication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'sms')),
  recipient TEXT NOT NULL, -- email address or phone number
  subject TEXT, -- for emails
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'mock')),
  provider TEXT, -- 'sendgrid', 'twilio', 'mock'
  provider_response TEXT, -- JSON response from provider
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_log_user_id ON communication_log(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_log_created_at ON communication_log(created_at DESC);

-- Insert default preferences for existing users
INSERT INTO notification_preferences (user_id, notification_type, send_in_app, send_email, send_sms)
SELECT u.id, nt.type, true, true, false
FROM users u
CROSS JOIN (
  VALUES
    ('cancellation_alert'),
    ('appointment_confirmed'),
    ('appointment_booked'),
    ('appointment_cancelled'),
    ('time_block_notification'),
    ('order_created'),
    ('reminder')
) AS nt(type)
ON CONFLICT (user_id, notification_type) DO NOTHING;

COMMENT ON TABLE notification_preferences IS 'Granular notification preferences per user and notification type';
COMMENT ON TABLE communication_log IS 'Log of all emails and SMS sent (both real and mock)';
COMMENT ON COLUMN users.phone_number IS 'Phone number for SMS notifications (E.164 format recommended)';
COMMENT ON COLUMN users.email_notifications_enabled IS 'Master toggle for email notifications';
COMMENT ON COLUMN users.sms_notifications_enabled IS 'Master toggle for SMS notifications';
