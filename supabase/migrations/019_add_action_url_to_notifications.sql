-- Migration 019: Add action_url to notifications
--
-- Adds action_url column to allow notifications to link to specific pages

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS action_url TEXT;

COMMENT ON COLUMN notifications.action_url IS 'Optional URL to navigate to when user clicks on the notification';

SELECT 'Added action_url column to notifications table' as message;
