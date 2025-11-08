-- Add fields to support external system integrations
-- This prepares the database for future FHIR, Calendar, and EHR integrations

ALTER TABLE provider_schedules
  ADD COLUMN import_source TEXT DEFAULT 'manual' CHECK (import_source IN ('manual', 'fhir', 'google_calendar', 'microsoft_calendar', 'practice_management', 'csv_import', 'ical')),
  ADD COLUMN external_system_id TEXT, -- ID from external system (e.g., Epic appointment ID)
  ADD COLUMN external_system_name TEXT, -- Name of external system (e.g., "Epic Production")
  ADD COLUMN last_synced_at TIMESTAMPTZ,
  ADD COLUMN sync_enabled BOOLEAN DEFAULT false,
  ADD COLUMN sync_frequency_hours INTEGER DEFAULT 6;

-- Create integration_credentials table for storing OAuth tokens (encrypted)
CREATE TABLE integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('fhir', 'google_calendar', 'microsoft_calendar', 'practice_management', 'ical')),
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

CREATE INDEX idx_integration_credentials_provider_id ON integration_credentials(provider_id);
CREATE INDEX idx_integration_credentials_type ON integration_credentials(integration_type);

-- Create sync_log table for audit trail
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_credential_id UUID NOT NULL REFERENCES integration_credentials(id) ON DELETE CASCADE,
  sync_started_at TIMESTAMPTZ DEFAULT NOW(),
  sync_completed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('in_progress', 'success', 'partial_success', 'error')),
  records_synced INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_log_credential_id ON sync_log(integration_credential_id);
CREATE INDEX idx_sync_log_started_at ON sync_log(sync_started_at);

-- Add comments for documentation
COMMENT ON COLUMN provider_schedules.import_source IS 'Where this schedule came from: manual entry or external system';
COMMENT ON COLUMN provider_schedules.external_system_id IS 'ID of this schedule in the external system (for sync tracking)';
COMMENT ON COLUMN provider_schedules.external_system_name IS 'Name of the external system (e.g., Epic Production, Google Calendar)';
COMMENT ON COLUMN provider_schedules.sync_enabled IS 'Whether this schedule should be synced from external system';

COMMENT ON TABLE integration_credentials IS 'Stores OAuth tokens and config for external system integrations';
COMMENT ON TABLE sync_log IS 'Audit trail of all sync operations with external systems';

-- Example: How a FHIR integration would work
COMMENT ON TABLE integration_credentials IS E'
Integration Examples:

FHIR (Epic/Cerner):
{
  "integration_type": "fhir",
  "system_name": "Epic Production",
  "config": {
    "fhir_base_url": "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4",
    "client_id": "your-client-id",
    "scopes": ["Schedule.read", "Slot.read", "Appointment.write"]
  }
}

Google Calendar:
{
  "integration_type": "google_calendar",
  "system_name": "Google Calendar",
  "config": {
    "calendar_id": "primary",
    "time_zone": "America/Chicago"
  }
}

Practice Management (Kareo):
{
  "integration_type": "practice_management",
  "system_name": "Kareo",
  "config": {
    "api_url": "https://api.kareo.com/v1",
    "customer_key": "your-key",
    "location_mappings": {
      "main-office": "MedHarmony Labs - Main St"
    }
  }
}
';
