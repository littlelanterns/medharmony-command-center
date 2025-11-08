-- Add fields to support external system integrations
-- This prepares the database for future FHIR, Calendar, and EHR integrations

-- First, make sure provider_schedules exists (should exist from migration 004)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_schedules') THEN
        RAISE EXCEPTION 'provider_schedules table does not exist. Please run migration 004 first.';
    END IF;
END $$;

-- Add integration support columns to provider_schedules
ALTER TABLE provider_schedules
  ADD COLUMN IF NOT EXISTS import_source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_system_id TEXT,
  ADD COLUMN IF NOT EXISTS external_system_name TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sync_frequency_hours INTEGER DEFAULT 6;

-- Add check constraint for import_source (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'provider_schedules_import_source_check'
    ) THEN
        ALTER TABLE provider_schedules
        ADD CONSTRAINT provider_schedules_import_source_check
        CHECK (import_source IN ('manual', 'fhir', 'google_calendar', 'microsoft_calendar', 'practice_management', 'csv_import', 'ical'));
    END IF;
END $$;

-- Create integration_credentials table for storing OAuth tokens (encrypted)
CREATE TABLE IF NOT EXISTS integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  system_name TEXT NOT NULL, -- e.g., "Epic Production", "Google Calendar"

  -- OAuth credentials (would be encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Integration-specific config
  config JSONB, -- Store API endpoints, client IDs, etc.

  -- Sync settings
  sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_hours INTEGER DEFAULT 6,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT, -- 'success', 'error', 'in_progress'
  last_sync_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Only one active integration per type per provider
  UNIQUE(provider_id, integration_type)
);

-- Add check constraint for integration_type
ALTER TABLE integration_credentials
ADD CONSTRAINT integration_credentials_integration_type_check
CHECK (integration_type IN ('fhir', 'google_calendar', 'microsoft_calendar', 'practice_management', 'ical'));

CREATE INDEX IF NOT EXISTS idx_integration_credentials_provider_id ON integration_credentials(provider_id);
CREATE INDEX IF NOT EXISTS idx_integration_credentials_type ON integration_credentials(integration_type);

-- Create sync_log table for audit trail
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_credential_id UUID REFERENCES integration_credentials(id) ON DELETE CASCADE,
  sync_started_at TIMESTAMPTZ DEFAULT NOW(),
  sync_completed_at TIMESTAMPTZ,
  status TEXT,
  records_synced INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add check constraint for sync status
ALTER TABLE sync_log
ADD CONSTRAINT sync_log_status_check
CHECK (status IN ('in_progress', 'success', 'partial_success', 'error'));

CREATE INDEX IF NOT EXISTS idx_sync_log_credential_id ON sync_log(integration_credential_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_started_at ON sync_log(sync_started_at);

-- Add comments for documentation
COMMENT ON COLUMN provider_schedules.import_source IS 'Where this schedule came from: manual entry or external system';
COMMENT ON COLUMN provider_schedules.external_system_id IS 'ID of this schedule in the external system (for sync tracking)';
COMMENT ON COLUMN provider_schedules.external_system_name IS 'Name of the external system (e.g., Epic Production, Google Calendar)';
COMMENT ON COLUMN provider_schedules.sync_enabled IS 'Whether this schedule should be synced from external system';

COMMENT ON TABLE integration_credentials IS 'Stores OAuth tokens and config for external system integrations';
COMMENT ON TABLE sync_log IS 'Audit trail of all sync operations with external systems';

SELECT 'Integration support added successfully!' as message;
