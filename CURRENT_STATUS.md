# MedHarmony Command Center - Current Status

**Last Updated:** January 2025
**Status:** Demo-Ready for Presentation
**Version:** 1.0 (Proof of Concept)

---

## 🎯 Project Overview

MedHarmony is an AI-powered healthcare scheduling and coordination platform that optimizes appointment scheduling across providers, patients, and family caregivers. The system uses real hospital pricing data, karma-based patient prioritization, and intelligent AI scheduling to improve healthcare access and provider revenue.

---

## ✅ Completed Features

### 🤖 AI Scheduling System
- **Real Hospital Pricing Integration**: Uses Freeman Health System (Joplin, MO) standard charges (8,585 procedures)
- **Smart Duration & Cost Estimation**: AI estimates procedure duration and costs based on real data
- **Provider Schedule Awareness**: AI scheduler respects provider business hours (Mon-Fri 8AM-5PM)
- **Conflict Detection**: Prevents double-booking by checking patient and provider existing appointments
- **Multi-Location Support**: Handles provider schedules across multiple clinic locations
- **Prerequisite Timeline Generation**: Creates step-by-step preparation timelines for complex procedures

### ⭐ Karma System
- **Patient Reliability Scoring**: Tracks patient reliability (0-100 score)
- **Cancellation Alert Priority**: High-karma patients get first access to cancelled appointment slots
- **Provider-Awarded Karma Points**: Providers can reward helpful patients with karma bonuses
- **Spendable Karma Points**: Separate from karma score, providers can award points as incentives

### 👨‍👩‍👧‍👦 Family Caregiver Features
- **Multi-Patient Management**: Jennifer Martinez manages 6 family members
- **Parental Confirmation Workflow**: Major procedures (like Ruthie's $50K heart surgery) require caregiver approval
- **Family Dashboard**: View all family members' appointments and care plans in one place
- **Individual Patient Modals**: Click any family member to see their detailed health info
  - Stats cards: Karma Score, Needs Scheduling, Upcoming Appointments
  - All orders requiring confirmation highlighted
  - Unscheduled care plans with "Schedule with AI" buttons
  - Upcoming appointments with reschedule/cancel options
- **Request Call Feature**: Caregivers can request provider office to call them for complex procedures

### 🏥 Provider Features
- **Revenue Dashboard**: Real-time tracking of scheduled vs. potential revenue
  - At-risk revenue (unscheduled high-value procedures)
  - Protected revenue (scheduled appointments)
- **Patient Nudge System**: Send reminders to patients about unscheduled care
  - Award karma points as incentives
  - Notifications appear in patient bell with action URLs
- **Multi-Location Scheduling**: Manage appointments across multiple clinic locations
- **Provider Calendar View**: Visual calendar showing all appointments
- **Block Time Management**: Mark vacation days, sick days, conferences as unavailable
- **Order Creation**: Create new care orders for patients with AI-estimated pricing

### 🧑‍⚕️ Patient Features
- **Personal Dashboard**: View karma score, unscheduled orders, upcoming appointments
- **Clickable "Needs Scheduling" Alert**: Red alert box opens modal showing all unscheduled orders
- **AI Scheduling**: One-click "Schedule with AI" for any unscheduled order
- **Availability Preferences**: Set preferred days/times for appointments
- **Appointment Management**: Reschedule or cancel appointments
- **Cancellation Alerts**: High-karma patients receive priority notifications for cancelled slots
- **Book New Appointments**: Select provider and create consultation orders

### 🔔 Notification System
- **Real-Time Notifications**: Supabase real-time subscriptions for instant updates
- **Text-to-Speech (TTS)**: Listen to notifications with natural voice synthesis
  - Server-side TTS (primary)
  - Browser fallback TTS (if server unavailable)
- **Priority Levels**: Urgent, high, medium, low priority color-coding
- **Action URLs**: Notifications link directly to relevant pages
- **Mark as Read/Unread**: Track which notifications have been reviewed
- **Tier Info Display**: Shows cancellation alert tier priority and expiration time

---

## 📊 Demo Data

### Users & Roles

**Caregivers:**
- Jennifer Martinez - Managing 6 family members including Ruthie (Down syndrome, needs $50K heart surgery)

**Providers:**
- Dr. Michael Chen (Cardiologist) - Ruthie's heart surgeon, has provider schedules Mon-Fri 8AM-5PM
- Dr. Sarah Jones (Pediatrician) - AI-managed schedule across 3 locations
- Dr. Patel (Pediatrics) - 10 appointments
- Dr. Kim (Endocrinology) - 8 appointments
- Dr. Amanda Rodriguez (Psychiatry) - Child psychiatry
- Dr. Maria Santos (Family Medicine) - Primary care

**Patients:**
- Robert Chen - High karma: 95/100
- Maria Gonzalez - High karma: 92/100
- Sarah Martinez - Standard patient
- John Davis - Standard patient
- Ruthie Martinez - Jennifer's daughter, Down syndrome, needs heart surgery ($50K VSD repair)
- Emma, Lucas, Sofia, Michael, Olivia - Other family members managed by Jennifer

### Key Demo Scenarios

1. **Ruthie's Heart Surgery ($50,000)**
   - Requires parental confirmation before scheduling
   - 5-hour procedure (300 minutes)
   - Multiple prerequisites (pre-op tests, anesthesia consult)
   - Shows real hospital pricing

2. **High-Karma Cancellation Alerts**
   - Robert Chen and Maria Gonzalez receive priority access to cancelled slots
   - Tiered notification system with expiration timers

3. **Multi-Location Provider Scheduling**
   - Dr. Sarah Jones works at 3 different clinics
   - AI schedules across locations efficiently

---

## 🗄️ Database Schema

### Key Tables
- `users` - All users (patients, providers, caregivers)
- `patient_profiles` - Patient-specific data (karma score, DOB, conditions)
- `provider_profiles` - Provider-specific data (specialty, license)
- `caregiver_relationships` - Links caregivers to patients they manage
- `orders` - Medical care orders (procedures, tests, consultations)
- `appointments` - Scheduled appointments
- `provider_schedules` - Provider business hours by location and day
- `notifications` - System notifications with TTS support
- `availability_preferences` - Patient preferred appointment times
- `time_blocks` - Provider unavailable periods (vacation, sick days)

### Recent Migrations
- **025**: Create Dr. Chen's provider schedules (fixes 1:15 AM bug)
- **024**: Check Dr. Chen schedules
- **023**: Check Dr. Chen provider profile
- **022**: Check and fix Ruthie's surgery order
- **020**: Add karma points system
- **019**: Add action_url to notifications
- **018**: Add duration to orders
- **017**: Add Ruthie's heart surgery order ($50K)
- **016b**: Add requires_confirmation to orders

---

## 🎨 UI/UX Features

### Design System
- **Color Scheme**:
  - Primary: Teal (#008080)
  - Secondary: Navy (#002C5F)
  - Accent: Green (#50C878)
- **Patient Color Coding**: Each family member gets unique color in caregiver dashboard
- **Responsive Design**: Mobile-friendly layouts
- **DEMO MODE Badge**: All dashboards show "DEMO MODE" badge for clarity
- **Real Data Indicators**: "Real hospital pricing data" subtitles

### Interactive Elements
- **Clickable Alert Boxes**: "Needs scheduling" alerts open modals with details
- **Modal Windows**: Family member details, unscheduled orders, time blocking
- **Hover States**: Visual feedback on interactive elements
- **Loading States**: Spinners and "Processing..." indicators
- **Confirmation Dialogs**: Prevent accidental cancellations/deletions

---

## 🔧 Technical Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Supabase Client**: Real-time subscriptions and database queries

### Backend
- **Supabase**: PostgreSQL database with real-time capabilities
- **Next.js API Routes**: Server-side logic
- **OpenRouter API**: AI scheduling intelligence (GPT-4 Turbo)
- **Text-to-Speech**: Server-side TTS with browser fallback

### Data Sources
- **Freeman Health System**: Real hospital pricing data (8,585 procedures)
- **Medical Pricing Database**: 40+ procedure categories with cost ranges

---

## 📁 Key Files

### Core Application
- `app/page.tsx` - Demo login page with user selection
- `app/caregiver/page.tsx` - Family health manager dashboard
- `app/provider/page.tsx` - Provider dashboard with revenue tracking
- `app/patient/page.tsx` - Patient dashboard with karma score

### Components
- `components/caregiver/FamilyMemberModal.tsx` - Detailed family member view
- `components/patient/AIScheduler.tsx` - AI scheduling interface
- `components/shared/NotificationBell.tsx` - Notification dropdown with TTS
- `components/provider/RevenueMeter.tsx` - Revenue visualization

### API Routes
- `app/api/ai/schedule/route.ts` - AI appointment scheduling
- `app/api/ai/estimate-duration/route.ts` - AI cost/duration estimates
- `app/api/provider/send-nudge/route.ts` - Provider nudge system
- `app/api/patient/request-call/route.ts` - Call request system
- `app/api/tts/speak/route.ts` - Text-to-speech synthesis

### Data & Utilities
- `lib/medical-pricing-data.ts` - Real hospital pricing database
- `lib/date-utils.ts` - Date formatting utilities
- `lib/slot-generator.ts` - Appointment slot generation
- `lib/cancellation-matcher.ts` - Karma-based cancellation matching

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **Demo Data Only**: Not connected to real EHR systems
2. **No Real Authentication**: Uses localStorage for demo login
3. **Limited Provider Schedules**: Only Dr. Chen has full schedules configured
4. **Mock AI Mode**: Falls back to mock data when OpenRouter API key not configured
5. **Single Timezone**: All times assume Central Time (US)

### Known Bugs
- None currently blocking demo functionality

---

## 🚀 Demo Presentation Flow

### Recommended 7-Minute Demo

**1. Login Page (30 seconds)**
- Show "DEMO MODE" and "Real Hospital Pricing Data" badges
- Highlight Jennifer Martinez: "Managing 6 family members + $50K heart surgery"

**2. Jennifer's Caregiver Dashboard (3 minutes)**
- Show 6 family members with color-coded cards
- Click Ruthie's card → Modal with stats (Karma, Needs Scheduling, Appointments)
- Show $50K heart surgery requiring confirmation
- Click "Confirm & Schedule" → AI scheduler
- Demonstrate AI offering realistic times (9:00 AM, 2:00 PM) based on Dr. Chen's schedule

**3. Dr. Chen's Provider Dashboard (2 minutes)**
- Show revenue meter: At-risk vs. Protected revenue
- Find Ruthie's heart surgery in unscheduled orders
- Show real pricing: $50,000, 300 minutes (5 hours)
- Demonstrate "Send Nudge" to Jennifer

**4. Patient Dashboard (1.5 minutes)**
- Login as Robert Chen (high karma: 95/100)
- Show clickable "Needs scheduling" alert box
- Demonstrate AI scheduling with availability preferences

**Key Talking Points:**
- ✅ Real hospital pricing (Freeman Health System)
- ✅ AI respects provider business hours
- ✅ Karma system rewards reliability
- ✅ Family caregiver workflow (unique feature!)
- ✅ Parental confirmation for major procedures
- ✅ Revenue optimization for providers

---

## 📈 Next Steps (Post-Demo)

### Phase 2: Calendar Integration
- Google Calendar OAuth integration
- Two-way sync with provider calendars
- iCal export for patients
- Estimated: 4-5 hours implementation

### Phase 3: Enhanced AI
- GPT-4 Turbo integration for all scheduling (remove mock mode)
- Natural language appointment requests
- Predictive analytics for no-shows
- Multi-step procedure sequencing

### Phase 4: Real EHR Integration
- HL7 FHIR API integration
- Epic/Cerner connections
- Real patient data sync
- HIPAA compliance implementation

### Phase 5: Mobile App
- React Native mobile app
- Push notifications
- Mobile-optimized scheduling
- Biometric authentication

---

## 🔐 Environment Setup

### Required Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
OPENROUTER_API_KEY=your_openrouter_key (optional - falls back to mock)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Running the Project
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Database Setup
1. Create Supabase project
2. Run migrations in order (001-025)
3. Verify demo data loaded

---

## 📝 Documentation

- `APPOINTMENT_BOOKING_SPEC.md` - Future calendar integration specification
- `README.md` - Project overview and setup
- `CURRENT_STATUS.md` - This file

---

## 🎓 Learning Outcomes

This project demonstrates:
- **Real-world healthcare workflows** (not toy examples)
- **AI integration** with fallback strategies
- **Complex relational database design** (15+ tables)
- **Real-time subscriptions** (Supabase)
- **Multi-role user experience** (caregiver, provider, patient)
- **Revenue optimization** for healthcare providers
- **Accessibility features** (TTS, color-coding)
- **Professional UI/UX polish** for demos

---

**Ready for Demo! 🚀**

All features tested and working. Database fully seeded. UI polished with "DEMO MODE" badges and compelling descriptions. Real hospital pricing data integrated. AI scheduler respecting provider business hours.

Contact: [Your Contact Info]
Repository: https://github.com/littlelanterns/medharmony-command-center
