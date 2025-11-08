-- Disable Row Level Security for demo/development
-- This allows the app to read/write data without authentication
-- WARNING: Only use this for demo purposes! Enable RLS for production!

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE prerequisites DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE availability_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE karma_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

SELECT 'Row Level Security disabled for all tables. App should now work!' as message;
