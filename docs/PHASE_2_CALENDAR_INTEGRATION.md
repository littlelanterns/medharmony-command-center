# Phase 2: Google Calendar Integration

**Status:** 📋 Planned for Phase 2
**Estimated Time:** 4-5 hours
**Priority:** High - Major UX improvement
**Dependencies:** Phase 1 must be complete and stable

---

## 🎯 The Vision

### Current (Manual) Flow:
- Patient opens availability preferences
- Manually blocks: "Not available Tues/Thurs 9-11am (kids' classes)"
- Manually blocks: "Not available Dec 15-20 (vacation)"
- Tedious, error-prone, easy to forget

### With Calendar Integration:
- Patient clicks "Connect Google Calendar"
- OAuth flow → Grant access
- MedHarmony reads calendar
- Auto-detects conflicts: "Soccer practice Tues 9am", "Vacation Dec 15-20"
- Patient confirms: "Yes, block these times"
- AI scheduling automatically avoids these conflicts
- **Updates in real-time** - add vacation to Google Calendar, MedHarmony knows instantly

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│           PATIENT AVAILABILITY PREFERENCES                   │
└────────┬──────────────────────────────────┬─────────────────┘
         │                                  │
         ▼                                  ▼
┌─────────────────┐              ┌─────────────────────┐
│ MANUAL ENTRY    │              │ CALENDAR IMPORT     │
│ - Recurring     │              │ - Google Calendar   │
│ - One-time      │              │ - Outlook (Phase 3) │
│ - Preferred     │              │ - Apple (Phase 3)   │
│ - Notice req    │              │ - iCal (Phase 3)    │
└─────────────────┘              └──────────┬──────────┘
                                            │
                                            ▼
                                 ┌───────────────────────┐
                                 │  OAUTH FLOW           │
                                 │  1. Request access    │
                                 │  2. User grants       │
                                 │  3. Store tokens      │
                                 │  4. Read events       │
                                 └──────────┬────────────┘
                                            │
                                            ▼
                                 ┌───────────────────────┐
                                 │ SYNC ENGINE           │
                                 │ - Initial sync        │
                                 │ - Periodic refresh    │
                                 │ - Webhook updates     │
                                 │ - Conflict detection  │
                                 └──────────┬────────────┘
                                            │
                                            ▼
                                 ┌───────────────────────┐
                                 │ AI SCHEDULING         │
                                 │ Avoids ALL conflicts  │
                                 │ from both sources     │
                                 └───────────────────────┘
```

---

## 🗄️ Database Schema

### Migration 012: Calendar Integration Tables

```sql
-- Calendar connections
CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'outlook', 'apple', 'ical'
  provider_account_id TEXT, -- User's email or account ID
  access_token TEXT NOT NULL, -- Encrypted OAuth token
  refresh_token TEXT, -- For token renewal
  token_expires_at TIMESTAMPTZ,
  scope TEXT, -- Permissions granted
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'synced', 'error'
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Imported calendar events (cached)
CREATE TABLE imported_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES calendar_connections(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES users(id),
  external_event_id TEXT NOT NULL, -- Event ID from provider
  title TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT false,
  location TEXT,
  description TEXT,
  status TEXT, -- 'confirmed', 'tentative', 'cancelled'
  should_block BOOLEAN DEFAULT true, -- Patient can toggle this
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, external_event_id)
);

-- Indexes
CREATE INDEX idx_calendar_connections_patient ON calendar_connections(patient_id);
CREATE INDEX idx_imported_events_patient ON imported_calendar_events(patient_id);
CREATE INDEX idx_imported_events_time ON imported_calendar_events(start_time, end_time);
CREATE INDEX idx_imported_events_should_block ON imported_calendar_events(should_block);
```

---

## 🔐 Google Calendar Setup

### Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "MedHarmony Calendar Integration"
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials (Web application)
5. Configure OAuth consent screen
6. Add authorized redirect URI: `https://your-domain.com/api/auth/google/callback`

**Required Scopes:**
```
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/calendar.events.readonly
```

### Step 2: Environment Variables

Add to `.env.local`:
```bash
# Google Calendar Integration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
```

### Step 3: Install Dependencies

```bash
npm install googleapis
```

---

## 📁 Files to Create

### 1. UI Components

**Create:** `components/patient/CalendarConnectionWidget.tsx`
- Display available calendar providers (Google, Outlook, Apple, iCal)
- "Connect" button for Google (active)
- "Coming Soon" badges for others
- Privacy notice about read-only access

**Create:** `components/patient/ConnectedCalendars.tsx`
- Show list of connected calendars
- Display sync status and last sync time
- "Sync Now" and "Disconnect" buttons
- Show number of events imported

**Create:** `components/patient/ImportedEventsReview.tsx`
- Display imported calendar events
- Filter: All / Blocking / Ignored
- Toggle individual events between blocking and allowing
- Show event details (title, date, time, location)

### 2. API Routes

**Create:** `app/api/auth/google/connect/route.ts`
- Build Google OAuth authorization URL
- Include patient ID in state parameter
- Redirect user to Google consent screen

**Create:** `app/api/auth/google/callback/route.ts`
- Handle OAuth callback
- Exchange authorization code for tokens
- Store tokens in database (encrypted)
- Trigger initial calendar sync
- Redirect back to preferences page

**Create:** `app/api/calendar/sync/[connectionId]/route.ts`
- Fetch events from Google Calendar API
- Filter: next 6 months, max 500 events
- Clear old events and insert new ones
- Update sync status and timestamp

**Create:** `app/api/calendar/connections/route.ts`
- GET: List all calendar connections for patient
- DELETE: Disconnect a calendar (soft delete)

**Create:** `app/api/calendar/events/route.ts`
- GET: Fetch imported events with filters
- PATCH: Toggle event blocking status

### 3. Updates to Existing Files

**Update:** `app/patient/preferences/page.tsx`
- Add CalendarConnectionWidget at top
- Add ConnectedCalendars section
- Add ImportedEventsReview section
- Keep existing manual entry below

**Update:** `app/api/ai/schedule/route.ts`
- Fetch imported calendar events that should block
- Include them in AI prompt as conflicts to avoid
- Format: "CALENDAR CONFLICTS: [event list]"

---

## 🎯 Implementation Checklist

### Phase 1: Database & Google Cloud Setup (30 min)
- [ ] Create migration 012 with calendar tables
- [ ] Run migration in Supabase
- [ ] Set up Google Cloud project
- [ ] Create OAuth credentials
- [ ] Add environment variables

### Phase 2: OAuth Flow (1 hour)
- [ ] Create `/api/auth/google/connect` endpoint
- [ ] Create `/api/auth/google/callback` endpoint
- [ ] Test OAuth flow end-to-end
- [ ] Verify tokens stored correctly

### Phase 3: Calendar Sync (1.5 hours)
- [ ] Create sync API endpoint
- [ ] Integrate Google Calendar API
- [ ] Fetch and store events
- [ ] Handle token refresh
- [ ] Error handling and logging

### Phase 4: UI Components (1.5 hours)
- [ ] Build CalendarConnectionWidget
- [ ] Build ConnectedCalendars
- [ ] Build ImportedEventsReview
- [ ] Add to preferences page
- [ ] Test user flows

### Phase 5: AI Integration (30 min)
- [ ] Update AI scheduler to fetch calendar events
- [ ] Add calendar conflicts to AI prompt
- [ ] Test scheduling avoids calendar conflicts
- [ ] Verify multi-patient scheduling works

### Phase 6: Testing & Polish (30 min)
- [ ] Test full flow: connect → sync → review → schedule
- [ ] Test edge cases (no events, sync errors, token expiry)
- [ ] Add loading states and error messages
- [ ] Document user-facing features

**Total Estimated Time:** 4-5 hours

---

## 🚀 Demo Script

**For Judges/Demo:**

1. **Show the problem:**
   - "Currently, patients manually enter blocked times - tedious and error-prone"

2. **Connect calendar:**
   - Click "Connect Google Calendar"
   - Grant access (OAuth flow)
   - "Syncing calendar..." → "25 events imported"

3. **Review events:**
   - Show imported events: "Soccer practice", "Dentist", "Vacation"
   - "You can choose which events should block appointments"
   - Toggle one event from "Blocking" to "Allow"

4. **Schedule with AI:**
   - Try to schedule an appointment
   - AI suggests times that avoid ALL calendar conflicts
   - "Notice it avoided your soccer practice automatically!"

5. **Real-time sync:**
   - "If you add a vacation to Google Calendar, we'll sync and block those dates too"

**Judge Reaction:** "This is SO smart! Why doesn't my doctor's office have this?"

---

## 🎁 Bonus Features (Phase 3)

### Auto-Export Appointments to Calendar
When patient books appointment → Add to their Google Calendar automatically

```typescript
// In appointment booking API
if (appointmentCreated) {
  await exportToGoogleCalendar(appointmentId, patientId);
}
```

### Webhook Notifications
Instead of periodic sync, use Google Calendar webhooks for instant updates when events change.

### Multiple Calendar Support
Allow patients to connect multiple Google calendars (personal + work).

---

## 🔒 Security Considerations

1. **Token Encryption:** Store access tokens encrypted in database
2. **Token Refresh:** Implement automatic token refresh before expiry
3. **Read-Only Access:** Only request calendar.readonly scopes
4. **User Control:** Allow patients to disconnect anytime
5. **Data Privacy:** Never share calendar data with providers or third parties
6. **Audit Logging:** Log all sync operations for debugging

---

## 📊 Success Metrics

Track these after implementation:

- % of patients who connect calendars
- Average number of events imported per patient
- Reduction in scheduling conflicts
- User satisfaction scores
- Time saved on manual entry

---

## ✅ Definition of Done

- [ ] Patient can connect Google Calendar
- [ ] Events sync automatically
- [ ] Patient can review and toggle event blocking
- [ ] AI scheduling avoids all calendar conflicts
- [ ] Error states handled gracefully
- [ ] Documentation complete
- [ ] Code reviewed and tested
- [ ] Demo script prepared

---

## 🔗 References

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Web Apps](https://developers.google.com/identity/protocols/oauth2/web-server)
- [googleapis npm package](https://www.npmjs.com/package/googleapis)

---

**Ready to implement in Phase 2!** 🚀

This feature will be a **massive competitive advantage** and **huge UX win** for patients.
