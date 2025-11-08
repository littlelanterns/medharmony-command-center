# MedHarmony Provider Schedule Integration Architecture

## Overview
MedHarmony needs to integrate with providers' existing scheduling systems to get real-time availability. Here's how it works in production.

---

## Integration Methods (By Provider System)

### 1. Epic EHR Integration (Most Common - 40% market share)

**Connection Type:** FHIR API (HL7 Fast Healthcare Interoperability Resources)

**Implementation:**
```typescript
// app/api/integrations/epic/sync-schedule/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { providerId, epicTenantId } = await request.json();

  // OAuth2 authentication with Epic
  const epicToken = await getEpicOAuthToken(epicTenantId);

  // Fetch provider schedule using FHIR Slot resource
  const response = await fetch(
    `https://${epicTenantId}.epic.com/fhir/Slot?schedule=${providerId}&status=free`,
    {
      headers: {
        'Authorization': `Bearer ${epicToken}`,
        'Accept': 'application/fhir+json'
      }
    }
  );

  const fhirSlots = await response.json();

  // Convert FHIR format to MedHarmony format
  const availableSlots = fhirSlots.entry.map(entry => ({
    location: entry.resource.serviceType[0].text,
    datetime: entry.resource.start,
    duration: entry.resource.minutesDuration,
    status: entry.resource.status // free, busy, busy-unavailable
  }));

  // Store in our database
  await syncSlotsToDatabase(providerId, availableSlots);

  return Response.json({ synced: availableSlots.length });
}
```

**Real-time Updates:**
- Epic fires webhooks when appointments booked/cancelled
- Subscribe to `Appointment.create`, `Appointment.update` events
- Webhook updates our `provider_schedules` table instantly

---

### 2. Athenahealth Integration

**Connection Type:** REST API

**Implementation:**
```typescript
// app/api/integrations/athena/sync-schedule/route.ts
export async function POST(request: NextRequest) {
  const { providerId, athenaId } = await request.json();

  const athenaToken = await getAthenaToken();

  // Athena's appointments API
  const response = await fetch(
    `https://api.athenahealth.com/v1/${athenaId}/appointments/open`,
    {
      headers: {
        'Authorization': `Bearer ${athenaToken}`
      },
      params: {
        departmentid: providerId,
        startdate: new Date().toISOString(),
        enddate: addDays(new Date(), 30).toISOString(),
        appointmenttypeid: 'LAB' // Lab work slots
      }
    }
  );

  const openSlots = await response.json();

  return Response.json({ synced: openSlots.appointments.length });
}
```

**Real-time Updates:**
- Athena supports webhook subscriptions
- Register for `APPOINTMENT.BOOKED`, `APPOINTMENT.CANCELLED` events

---

### 3. Google Calendar Integration (Smaller Practices)

**Connection Type:** Google Calendar API

**Implementation:**
```typescript
// app/api/integrations/google/sync-schedule/route.ts
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  const { providerId, calendarId } = await request.json();

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: await getProviderRefreshToken(providerId)
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Get free/busy information
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: new Date().toISOString(),
      timeMax: addDays(new Date(), 30).toISOString(),
      items: [{ id: calendarId }]
    }
  });

  const busySlots = response.data.calendars[calendarId].busy;

  // Calculate free slots (inverse of busy)
  const freeSlots = calculateFreeSlots(busySlots, {
    startTime: '07:00',
    endTime: '17:00',
    slotDuration: 30 // 30-minute appointments
  });

  return Response.json({ synced: freeSlots.length });
}
```

**Real-time Updates:**
- Google Calendar push notifications via webhook
- Subscribe to calendar changes
- Receive notifications when events added/modified

---

## Unified Integration Layer

### Database Schema for Multi-Source Integration

```sql
-- Store provider integration settings
CREATE TABLE provider_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES users(id),
  integration_type TEXT NOT NULL, -- 'epic', 'athena', 'google', 'cerner'
  credentials JSONB NOT NULL, -- encrypted OAuth tokens, API keys
  last_sync_at TIMESTAMPTZ,
  sync_frequency_minutes INTEGER DEFAULT 15,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store synced availability from all sources
CREATE TABLE synced_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES users(id),
  source_system TEXT NOT NULL, -- 'epic', 'athena', etc.
  external_slot_id TEXT, -- ID in source system
  location TEXT NOT NULL,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'available', -- available, booked, tentative
  staff_available TEXT[],
  sync_source TEXT NOT NULL,
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(source_system, external_slot_id)
);

CREATE INDEX idx_synced_availability_datetime ON synced_availability(start_datetime, end_datetime);
CREATE INDEX idx_synced_availability_provider ON synced_availability(provider_id);
```

### Webhook Handler for Real-Time Updates

```typescript
// app/api/webhooks/provider-schedule/route.ts
import { NextRequest } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('X-Webhook-Signature');
  const body = await request.text();

  // Verify webhook signature (security)
  const isValid = verifyWebhookSignature(body, signature);
  if (!isValid) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  // Handle different event types
  switch (event.type) {
    case 'APPOINTMENT.BOOKED':
      await handleAppointmentBooked(event.data);
      break;

    case 'APPOINTMENT.CANCELLED':
      await handleAppointmentCancelled(event.data);

      // AI Cancellation Matching!
      await findPatientsForCancelledSlot(event.data.slotId);
      break;

    case 'SCHEDULE.UPDATED':
      await resyncProviderSchedule(event.data.providerId);
      break;
  }

  return Response.json({ received: true });
}

async function handleAppointmentBooked(data: any) {
  // Mark slot as booked in our database
  await supabase
    .from('synced_availability')
    .update({ status: 'booked' })
    .eq('external_slot_id', data.slotId);
}

async function handleAppointmentCancelled(data: any) {
  // Mark slot as available again
  await supabase
    .from('synced_availability')
    .update({ status: 'available' })
    .eq('external_slot_id', data.slotId);
}
```

---

## Background Sync Process

### Scheduled Sync (Every 15 minutes)

```typescript
// app/api/cron/sync-provider-schedules/route.ts
export async function GET(request: NextRequest) {
  // Verify cron secret (security)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all active integrations
  const { data: integrations } = await supabase
    .from('provider_integrations')
    .select('*')
    .eq('is_active', true)
    .lte('last_sync_at', new Date(Date.now() - 15 * 60 * 1000)); // 15 min ago

  const syncResults = [];

  for (const integration of integrations) {
    try {
      // Call appropriate integration based on type
      const result = await syncProviderSchedule(integration);

      syncResults.push({
        providerId: integration.provider_id,
        type: integration.integration_type,
        synced: result.count,
        success: true
      });

      // Update last sync time
      await supabase
        .from('provider_integrations')
        .update({ last_sync_at: new Date() })
        .eq('id', integration.id);

    } catch (error) {
      syncResults.push({
        providerId: integration.provider_id,
        error: error.message,
        success: false
      });
    }
  }

  return Response.json({ results: syncResults });
}
```

**Set up in Vercel:**
```bash
# vercel.json
{
  "crons": [{
    "path": "/api/cron/sync-provider-schedules",
    "schedule": "*/15 * * * *" // Every 15 minutes
  }]
}
```

---

## AI Scheduling with Real-Time Data

### Updated AI Scheduling Endpoint

```typescript
// app/api/ai/schedule/route.ts
export async function POST(request: NextRequest) {
  const { orderId, patientId } = await request.json();

  // 1. Get patient preferences
  const patientPrefs = await getPatientPreferences(patientId);

  // 2. Get REAL provider availability from integrations
  const { data: availableSlots } = await supabase
    .from('synced_availability')
    .select('*')
    .eq('status', 'available')
    .gte('start_datetime', new Date().toISOString())
    .lte('start_datetime', addDays(new Date(), 30).toISOString())
    .order('start_datetime');

  // 3. Filter by patient preferences
  const filteredSlots = availableSlots.filter(slot => {
    const slotDate = new Date(slot.start_datetime);

    // Check patient's blocked days
    if (isPatientUnavailable(slotDate, patientPrefs)) return false;

    // Check preferred times
    if (!matchesPreferredTime(slotDate, patientPrefs)) return false;

    // Check notice requirement
    const hoursUntilSlot = (slotDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilSlot < patientPrefs.noticeHours) return false;

    return true;
  });

  // 4. Pass REAL slots to AI for ranking
  const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-4-turbo',
      messages: [{
        role: 'user',
        content: `You are a scheduling assistant. Here are ${filteredSlots.length} available appointment slots:

${JSON.stringify(filteredSlots.slice(0, 10), null, 2)}

Patient preferences: ${JSON.stringify(patientPrefs)}

Rank the top 3 slots and explain why each is a good choice. Return JSON with: options[{rank, slotId, datetime, location, reasoning, karmaBonus}]`
      }]
    })
  });

  const aiResult = await aiResponse.json();
  return Response.json(JSON.parse(aiResult.choices[0].message.content));
}
```

---

## Provider Onboarding Flow

### Setup Wizard for Providers

```typescript
// app/provider/integrations/page.tsx
export default function IntegrationSetupPage() {
  return (
    <div>
      <h1>Connect Your Scheduling System</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Epic */}
        <Card>
          <h3>Epic EHR</h3>
          <p>Most comprehensive integration</p>
          <Button onClick={() => startEpicOAuth()}>
            Connect Epic
          </Button>
        </Card>

        {/* Athenahealth */}
        <Card>
          <h3>Athenahealth</h3>
          <p>Full API integration</p>
          <Button onClick={() => startAthenaOAuth()}>
            Connect Athena
          </Button>
        </Card>

        {/* Google Calendar */}
        <Card>
          <h3>Google Calendar</h3>
          <p>Simple calendar sync</p>
          <Button onClick={() => startGoogleOAuth()}>
            Connect Google
          </Button>
        </Card>
      </div>

      <div className="mt-8">
        <h2>Or Upload Schedule Manually</h2>
        <FileUpload
          accept=".ics,.csv"
          onUpload={handleManualUpload}
        />
      </div>
    </div>
  );
}
```

---

## Summary: Production Architecture

### Data Flow
```
Provider's EHR (Epic/Athena/etc.)
    ↓
    | OAuth2 Authentication
    | REST API / FHIR API
    ↓
MedHarmony Integration Layer
    ↓
    | Transform to standard format
    | Store in synced_availability table
    ↓
AI Scheduling Engine
    ↓
    | Match patient preferences
    | Rank best options
    ↓
Patient sees 3 personalized options
    ↓
Patient books → Webhook back to EHR
```

### Real-Time Updates
1. Provider's system fires webhook when slot changes
2. MedHarmony receives webhook, updates database
3. Supabase real-time notifies connected clients
4. Patient dashboard updates instantly

### Fallback Strategy
- Primary: Real-time webhooks (instant)
- Secondary: Scheduled sync every 15 minutes
- Tertiary: Manual refresh button for providers
- Quaternary: Manual schedule upload (.ics file)

---

## For Your MVP Demo

Since you don't have real EHR integrations yet, your current approach is perfect:
- ✅ Mock provider schedules in database
- ✅ Seed realistic availability
- ✅ AI reads from `provider_schedules` table

**For the pitch**, you can say:
> "In production, MedHarmony integrates with Epic, Athenahealth, and other major EHRs via their FHIR and REST APIs. The AI reads real-time availability from these systems. For this demo, we're using a realistic mock schedule that simulates that integration."

Then show this document to demonstrate you've thought through the production architecture!
