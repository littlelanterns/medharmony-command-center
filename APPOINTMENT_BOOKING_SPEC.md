# Appointment Booking Enhancement - OpenTable-Style Scheduling

## Overview
Transform the appointment booking flow to be more like OpenTable - show actual available time slots that patients can claim, with AI suggestions as the entry point.

## Current State (What We Have)
- ✅ AI suggests 3 appointment options based on patient preferences
- ✅ Provider schedules define when they work (`provider_schedules`)
- ✅ Provider can block time (`provider_time_blocks`)
- ✅ System checks conflicts with existing appointments

## Target State (What We're Building)

### User Flow
```
1. Patient clicks "Schedule Appointment" on an order
2. AI shows 3 BEST suggested options (current behavior - keep this!)
3. Patient can either:
   a) Book one of the 3 AI suggestions (current flow)
   b) Click "See More Availability" → Opens full calendar view
4. Full calendar shows ALL available slots for that provider
5. Patient can filter by date range (Nov 15 - Nov 30)
6. Patient can filter by time preference (Morning/Afternoon/Evening)
7. Patient clicks a slot to book it
8. Slot becomes unavailable in real-time
```

## Implementation Plan

### Phase 1: Slot Generation Algorithm

#### File: `lib/slot-generator.ts`
**Purpose:** Calculate what time slots are actually available

**Function:** `generateAvailableSlots()`
**Inputs:**
- `providerId` - Which doctor
- `startDate` - Beginning of search range
- `endDate` - End of search range
- `appointmentDuration` - How long appointment is (default 30 min)
- `timePreference` - Optional: 'morning' | 'afternoon' | 'evening' | 'all'

**Logic:**
```typescript
For each day in date range:
  1. Check if provider works that day (provider_schedules)
     - Get day_of_week, start_time, end_time

  2. Generate 30-min slots for their working hours
     - 9:00 AM, 9:30 AM, 10:00 AM, etc.

  3. Filter out blocked time (provider_time_blocks)
     - Skip slots during vacation, sick days, etc.

  4. Filter out existing appointments
     - Skip slots that are already booked

  5. Apply time preference filter if specified
     - Morning: 7 AM - 12 PM
     - Afternoon: 12 PM - 5 PM
     - Evening: 5 PM - 8 PM

  6. Return list of available slots
```

**Output:**
```typescript
{
  date: "2025-11-18",
  slots: [
    { time: "09:00", available: true, location: "Heart Center" },
    { time: "09:30", available: true, location: "Heart Center" },
    { time: "10:00", available: false, reason: "Booked" },
    // ...
  ]
}[]
```

### Phase 2: API Endpoint

#### File: `app/api/appointments/available-slots/route.ts`

**GET `/api/appointments/available-slots`**

**Query Parameters:**
- `providerId` (required)
- `orderId` (required) - to get patient preferences
- `startDate` (optional) - defaults to tomorrow
- `endDate` (optional) - defaults to 30 days from now
- `timePreference` (optional) - 'morning' | 'afternoon' | 'evening'

**Response:**
```json
{
  "availableSlots": [
    {
      "date": "2025-11-18",
      "dayOfWeek": "Monday",
      "slots": [
        {
          "time": "09:00",
          "datetime": "2025-11-18T09:00:00-06:00",
          "available": true,
          "location": "Heart & Vascular Center",
          "staffAssigned": ["Cardiac Nurse Rachel"]
        }
      ]
    }
  ],
  "metadata": {
    "totalSlotsFound": 42,
    "dateRange": "2025-11-18 to 2025-11-30",
    "provider": "Dr. Michael Chen"
  }
}
```

### Phase 3: UI Components

#### Component: `components/patient/AvailabilityCalendar.tsx`

**Props:**
```typescript
interface AvailabilityCalendarProps {
  providerId: string;
  orderId: string;
  orderDetails: {
    title: string;
    type: string;
  };
  onSlotSelected: (slot: AvailableSlot) => void;
  onClose: () => void;
}
```

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Finding times for: Cardiology Follow-up         │
│ Provider: Dr. Michael Chen                       │
├─────────────────────────────────────────────────┤
│                                                  │
│ Date Range:  [Nov 15] to [Nov 30]  [Apply]     │
│ Time Pref:   ○ Morning  ○ Afternoon  ○ Evening  │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│ Monday, November 18                              │
│ ┌─────┬─────┬─────┬─────┐                      │
│ │9:00 │9:30 │10:00│10:30│  ...                 │
│ │ ✓   │ ✓   │ ✗   │ ✓   │                      │
│ └─────┴─────┴─────┴─────┘                      │
│                                                  │
│ Wednesday, November 20                           │
│ ┌─────┬─────┬─────┬─────┐                      │
│ │9:00 │9:30 │10:00│2:00 │  ...                 │
│ │ ✓   │ ✓   │ ✓   │ ✓   │                      │
│ └─────┴─────┴─────┴─────┘                      │
│                                                  │
└─────────────────────────────────────────────────┘

✓ = Available (clickable)
✗ = Booked (grayed out)
```

#### Update: `components/patient/AIScheduler.tsx`

Add after the 3 AI-suggested options:

```tsx
<div className="mt-6 text-center">
  <button
    onClick={() => setShowFullCalendar(true)}
    className="text-[#008080] font-semibold hover:underline"
  >
    See More Availability →
  </button>
</div>

{showFullCalendar && (
  <AvailabilityCalendar
    providerId={providerId}
    orderId={orderId}
    orderDetails={orderDetails}
    onSlotSelected={handleSlotSelected}
    onClose={() => setShowFullCalendar(false)}
  />
)}
```

### Phase 4: Real-Time Updates

**Use Supabase Realtime:**

```typescript
// Subscribe to appointment changes
const channel = supabase
  .channel('slot-availability')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'appointments',
    filter: `provider_id=eq.${providerId}`
  }, () => {
    // Reload available slots
    refreshSlots();
  })
  .subscribe();
```

### Phase 5: Booking Flow

**When patient clicks a slot:**

1. Confirm with modal:
   ```
   Book appointment for:
   Monday, November 18 at 9:30 AM
   Dr. Michael Chen - Heart Center

   [Cancel] [Confirm Booking]
   ```

2. Create appointment via existing API:
   ```
   POST /api/appointments
   {
     orderId,
     patientId,
     providerId,
     scheduledStart: "2025-11-18T09:30:00-06:00",
     scheduledEnd: "2025-11-18T10:00:00-06:00",
     location: "Heart Center"
   }
   ```

3. Navigate back to order page with success message

## File Structure

```
New Files:
- lib/slot-generator.ts                    (Slot calculation logic)
- app/api/appointments/available-slots/route.ts  (API endpoint)
- components/patient/AvailabilityCalendar.tsx    (Full calendar UI)

Modified Files:
- components/patient/AIScheduler.tsx       (Add "See More" button)
- app/patient/orders/[id]/page.tsx         (Handle booking from calendar)
```

## Database Schema (No Changes Needed!)

We already have everything we need:
- ✅ `provider_schedules` - When provider works
- ✅ `provider_time_blocks` - When provider is unavailable
- ✅ `appointments` - What slots are booked
- ✅ `orders` - What needs to be scheduled

## Testing Checklist

- [ ] Slot generator correctly identifies available times
- [ ] Blocked time (vacation) removes slots
- [ ] Existing appointments remove slots
- [ ] Date range filter works
- [ ] Time preference filter works (morning/afternoon/evening)
- [ ] Clicking slot opens confirmation
- [ ] Booking slot creates appointment
- [ ] Slot disappears after booking (real-time)
- [ ] AI suggestions still work (Phase 1 untouched)
- [ ] Can switch between AI suggestions and full calendar

## Migration Cleanup (Optional)

After this is working, we can:
- Remove `NOW() + 5 days` from seed data
- Create more realistic seed appointments at specific times
- Add appointments for all providers so calendars aren't empty

## Success Criteria

✅ Patient sees AI's 3 best suggestions first
✅ Patient can click "See More" to view full availability
✅ Patient can filter by date range
✅ Patient can filter by time of day
✅ Patient can book any available slot
✅ Booked slots disappear in real-time
✅ Works like OpenTable - claim available slots
