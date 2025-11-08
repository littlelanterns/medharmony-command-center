# MedHarmony Command Center

**Tagline:** Harmonized Care, Simplified Scheduling

![MedHarmony](https://img.shields.io/badge/Status-MVP-green) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

## Overview

MedHarmony Command Center is a revolutionary AI-driven healthcare scheduling platform that eliminates revenue leakage, reduces no-shows, and creates delightful experiences for both providers and patients.

### The Problem

- **Revenue Leakage:** Healthcare providers lose thousands when ordered procedures never get scheduled
- **Patient Friction:** Complex scheduling processes lead to abandoned care plans
- **No-Show Epidemic:** Missed appointments cost the healthcare system $150B annually
- **Administrative Burden:** Staff spend hours on phone tag and manual scheduling

### Our Solution

MedHarmony uses AI to:
- **Auto-schedule appointments** in seconds based on patient preferences and prerequisites
- **Fill cancelled slots** instantly through an intelligent cancellation marketplace
- **Reward reliability** with a karma system that incentivizes good patient behavior
- **Eliminate phone tag** with fully automated, intelligent scheduling

## Key Features

### 🏥 For Healthcare Providers
- **Revenue Protection Meter** - Real-time tracking of scheduled vs at-risk revenue
- **One-Click Order Creation** - Send orders with prerequisites in under 60 seconds
- **Real-Time Updates** - Instant notifications when patients schedule
- **Zero Administrative Burden** - No phone calls, no back-and-forth

### 👤 For Patients
- **AI Scheduling** - Get 3 ranked appointment options in 3 seconds
- **Smart Prerequisites** - Automatic reminders for fasting, medications, documents
- **Karma System** - Earn points and unlock benefits for reliable behavior
- **Cancellation Marketplace** - Get earlier appointments when slots open up

### 🤖 AI-Powered Intelligence
- **GPT-4 Scheduling Optimization** - Considers patient preferences, provider schedules, and prerequisites
- **Predictive Matching** - Instantly matches cancelled slots with ideal patients
- **Smart Reminders** - Automated prerequisite notifications at optimal times

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes (serverless)
- **Database:** Supabase (PostgreSQL + Realtime)
- **AI:** OpenRouter API (GPT-4)
- **Hosting:** Vercel
- **Authentication:** Demo quick-login (production-ready auth via Supabase)

## Quick Start

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- An OpenRouter API key (optional - app works with mock data)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd medharmony-command-center
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**

   a. Create a new project at [supabase.com](https://supabase.com)

   b. Go to SQL Editor and run the schema migration (found in `supabase/migrations/`)

   c. Run the seed data script to create demo users and orders

   d. Get your API keys from Settings → API

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your actual values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENROUTER_API_KEY=your_openrouter_key  # Optional
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Setup

### Schema Migration

In your Supabase SQL Editor, run this complete schema:

```sql
-- See supabase/migrations/001_initial_schema.sql for the full schema
```

The schema includes:
- `users` - All system users (providers, patients, admins)
- `orders` - Medical orders from providers
- `prerequisites` - Required preparations for orders
- `appointments` - Scheduled appointments
- `availability_preferences` - Patient scheduling preferences
- `karma_history` - Patient accountability tracking
- `notifications` - System notifications
- `cancellation_alerts` - Marketplace alerts

### Seed Data

Run the seed script to create demo users:

```sql
-- Demo Users
INSERT INTO users (id, email, full_name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'dr.jones@medharmony.demo', 'Dr. Sarah Jones', 'provider'),
  ('22222222-2222-2222-2222-222222222222', 'sarah.martinez@example.com', 'Sarah Martinez', 'patient'),
  ('33333333-3333-3333-3333-333333333333', 'john.davis@example.com', 'John Davis', 'patient');

-- Patient Profiles with Karma Scores
INSERT INTO patient_profiles (id, date_of_birth, karma_score, reliability_percentage) VALUES
  ('22222222-2222-2222-2222-222222222222', '1982-01-15', 95, 95.0),
  ('33333333-3333-3333-3333-333333333333', '1966-03-22', 78, 85.0);

-- Provider Profile
INSERT INTO provider_profiles (id, specialty, organization) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Primary Care', 'MedHarmony Clinic');

-- Demo Order
INSERT INTO orders (id, patient_id, provider_id, order_type, title, priority, status, estimated_revenue) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'lab', 'Fasting Bloodwork + Lipid Panel', 'routine', 'unscheduled', 200);
```

## Demo Flow

### Login as Different Users

1. **Dr. Sarah Jones (Provider)**
   - View revenue at risk from unscheduled orders
   - Create new orders with prerequisites
   - See real-time updates when patients schedule

2. **Sarah Martinez (Patient)**
   - View unscheduled order
   - Use AI to get 3 appointment options
   - Book appointment with one click
   - Check karma score (95/100 - Exemplary)

3. **John Davis (Patient)**
   - Lower karma score (78/100)
   - Can still schedule normally

### Complete User Journey

1. **Provider creates order** → Patient receives notification
2. **Patient sets availability** → System learns preferences
3. **AI generates options** → 3 ranked appointments in seconds
4. **Patient books appointment** → Provider dashboard updates in real-time
5. **Patient earns karma** → Unlocks priority benefits

## Project Structure

```
medharmony-command-center/
├── app/
│   ├── page.tsx                 # Landing page with quick login
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # MedHarmony branding styles
│   ├── provider/
│   │   ├── page.tsx             # Provider dashboard
│   │   └── orders/new/page.tsx  # Create order form
│   ├── patient/
│   │   ├── page.tsx             # Patient dashboard
│   │   ├── orders/[id]/page.tsx # Order detail + AI scheduling
│   │   └── karma/page.tsx       # Karma dashboard
│   └── api/
│       ├── orders/route.ts      # Orders CRUD
│       ├── appointments/route.ts # Appointments CRUD
│       └── ai/schedule/route.ts # AI scheduling engine
├── components/
│   ├── provider/                # Provider components
│   ├── patient/                 # Patient components
│   └── shared/                  # Shared components
├── lib/
│   ├── supabase/client.ts       # Supabase client
│   └── types/index.ts           # TypeScript types
└── supabase/
    └── migrations/              # Database schema
```

## API Routes

### POST /api/orders
Create a new medical order with prerequisites

### GET /api/orders?patientId=xxx
Get orders for a patient

### POST /api/appointments
Book an appointment

### POST /api/ai/schedule
Generate AI-optimized appointment options

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI | No* |
| `NEXT_PUBLIC_APP_URL` | App URL | No |

*The app will use mock AI responses if OpenRouter is not configured

## Features Roadmap

### ✅ MVP (Current)
- Provider order creation
- Patient dashboard
- AI scheduling with 3 ranked options
- Appointment booking
- Karma tracking
- Real-time updates
- Revenue protection meter

### 🚧 Phase 2
- Voice interface for elderly patients (Google Gemini)
- Unified health records (FHIR integration)
- Family/caregiver portal
- Predictive no-show prevention (ML model)
- Multi-appointment orchestration
- Provider-to-provider referrals
- Mobile app (React Native)
- Insurance verification

## Contributing

This is a competition demo project. Contributions welcome after the competition!

## License

MIT License

## Contact

Built for Vibeathon 2024

---

**MedHarmony Command Center** - Revolutionizing healthcare scheduling through AI 🚀
