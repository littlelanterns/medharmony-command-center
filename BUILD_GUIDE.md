# MedHarmony Command Center - Complete Build Guide

**Quick Reference:** Follow this guide step-by-step to build the MVP in one day.

---

## Table of Contents
1. [Initial Setup](#initial-setup)
2. [Database Setup](#database-setup)
3. [Project Structure](#project-structure)
4. [Component Templates](#component-templates)
5. [API Route Templates](#api-route-templates)
6. [Environment Variables](#environment-variables)
7. [Running the App](#running-the-app)
8. [Phase 2 Roadmap](#phase-2-roadmap)

---

## Initial Setup

### Step 1: Create Project

Open terminal in your empty `medharmony-command-center` folder:

```bash
# Initialize Next.js 15 with TypeScript
npx create-next-app@latest . --typescript --tailwind --app --no-src --import-alias "@/*"

# Answer the prompts:
# ✓ Would you like to use TypeScript? Yes
# ✓ Would you like to use ESLint? Yes
# ✓ Would you like to use Tailwind CSS? Yes
# ✓ Would you like to use `src/` directory? No
# ✓ Would you like to use App Router? Yes
# ✓ Would you like to customize the default import alias? No
```

### Step 2: Install Dependencies

```bash
npm install @supabase/supabase-js
npm install date-fns
npm install zod
npm install axios
```

### Step 3: Create Folder Structure

```bash
# Create all necessary folders
mkdir -p app/provider app/patient app/admin app/api
mkdir -p components/provider components/patient components/shared components/ui
mkdir -p lib/supabase lib/ai lib/utils lib/types
mkdir -p supabase/migrations
```

---

## Database Setup

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Name it: `medharmony-command-center`
4. Set a database password (save it!)
5. Choose a region close to you
6. Wait for project to initialize (~2 minutes)

### Step 2: Get API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values (you'll need them for `.env.local`):
   - Project URL
   - `anon` public key
   - `service_role` secret key (click "Reveal" first)

### Step 3: Run Database Migration

In Supabase dashboard, go to **SQL Editor** → **New Query**, paste and run this:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('provider', 'patient', 'caregiver', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider profiles
CREATE TABLE provider_profiles (
  id UUID PRIMARY KEY REFERENCES users(id),
  specialty TEXT,
  license_number TEXT,
  organization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient profiles
CREATE TABLE patient_profiles (
  id UUID PRIMARY KEY REFERENCES users(id),
  date_of_birth DATE,
  phone TEXT,
  address TEXT,
  insurance_info JSONB,
  karma_score INTEGER DEFAULT 50,
  reliability_percentage DECIMAL DEFAULT 100.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID NOT NULL REFERENCES users(id),
  order_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('routine', 'urgent', 'stat')),
  due_within_days INTEGER,
  status TEXT DEFAULT 'unscheduled' CHECK (status IN ('unscheduled', 'scheduled', 'completed', 'cancelled')),
  estimated_revenue DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prerequisites
CREATE TABLE prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES users(id),
  prerequisite_type TEXT NOT NULL,
  description TEXT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  patient_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID REFERENCES users(id),
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  staff_assigned TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show')),
  confirmation_required BOOLEAN DEFAULT true,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability preferences
CREATE TABLE availability_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id),
  preference_type TEXT NOT NULL CHECK (preference_type IN ('recurring_block', 'one_time_block', 'preferred_time', 'notice_requirement')),
  day_of_week INTEGER,
  start_time TIME,
  end_time TIME,
  block_start TIMESTAMPTZ,
  block_end TIMESTAMPTZ,
  preference_data JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_order_id UUID REFERENCES orders(id),
  related_appointment_id UUID REFERENCES appointments(id),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled reminders
CREATE TABLE scheduled_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES users(id),
  prerequisite_id UUID REFERENCES prerequisites(id),
  reminder_type TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  message TEXT NOT NULL,
  channels JSONB DEFAULT '["email", "sms"]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cancellation alerts
CREATE TABLE cancellation_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cancelled_appointment_id UUID NOT NULL REFERENCES appointments(id),
  original_patient_id UUID NOT NULL REFERENCES users(id),
  notified_patient_id UUID NOT NULL REFERENCES users(id),
  alert_sent_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired', 'ignored'))
);

-- Karma history
CREATE TABLE karma_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id),
  action_type TEXT NOT NULL,
  points_change INTEGER NOT NULL,
  related_appointment_id UUID REFERENCES appointments(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI activity log
CREATE TABLE ai_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  input_data JSONB,
  output_data JSONB,
  model_used TEXT,
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  locations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_patient_id ON orders(patient_id);
CREATE INDEX idx_orders_provider_id ON orders(provider_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_scheduled_start ON appointments(scheduled_start);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_karma_history_patient_id ON karma_history(patient_id);
CREATE INDEX idx_scheduled_reminders_scheduled_for ON scheduled_reminders(scheduled_for);
CREATE INDEX idx_scheduled_reminders_status ON scheduled_reminders(status);
```

### Step 4: Seed Demo Data

Run this in SQL Editor:

```sql
-- Demo users
INSERT INTO users (id, email, full_name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'dr.jones@medharmony.demo', 'Dr. Sarah Jones', 'provider'),
  ('22222222-2222-2222-2222-222222222222', 'sarah.martinez@example.com', 'Sarah Martinez', 'patient'),
  ('33333333-3333-3333-3333-333333333333', 'john.davis@example.com', 'John Davis', 'patient');

-- Patient profiles
INSERT INTO patient_profiles (id, date_of_birth, karma_score, reliability_percentage) VALUES
  ('22222222-2222-2222-2222-222222222222', '1982-01-15', 95, 95.0),
  ('33333333-3333-3333-3333-333333333333', '1966-03-22', 78, 85.0);

-- Provider profile
INSERT INTO provider_profiles (id, specialty, organization) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Primary Care', 'MedHarmony Clinic');

-- Demo orders
INSERT INTO orders (id, patient_id, provider_id, order_type, title, priority, status, estimated_revenue) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'lab', 'Fasting Bloodwork + Lipid Panel', 'routine', 'unscheduled', 200);

-- Prerequisites for Sarah's order
INSERT INTO prerequisites (order_id, provider_id, prerequisite_type, description) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'fasting', 'Fast for 8 hours before appointment'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'medication_stop', 'Stop blood thinner medication 24 hours before'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'bring_documents', 'Bring insurance card and ID');

-- Sarah's availability preferences
INSERT INTO availability_preferences (patient_id, preference_type, day_of_week, start_time, end_time, preference_data) VALUES
  ('22222222-2222-2222-2222-222222222222', 'recurring_block', 2, '09:00:00', '11:00:00', '{"reason": "Kids music class"}'),
  ('22222222-2222-2222-2222-222222222222', 'recurring_block', 4, '09:00:00', '11:00:00', '{"reason": "Kids music class"}'),
  ('22222222-2222-2222-2222-222222222222', 'notice_requirement', NULL, NULL, NULL, '{"hours_needed": 2}');
```

---

## Project Structure

Your folder structure should look like:

```
medharmony-command-center/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing/login page
│   ├── globals.css                # Global styles
│   ├── provider/
│   │   ├── page.tsx               # Provider dashboard
│   │   └── orders/
│   │       └── new/
│   │           └── page.tsx       # Create order form
│   ├── patient/
│   │   ├── page.tsx               # Patient dashboard
│   │   ├── orders/
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Order detail
│   │   ├── preferences/
│   │   │   └── page.tsx           # Availability manager
│   │   └── karma/
│   │       └── page.tsx           # Karma dashboard
│   └── api/
│       ├── orders/
│       │   └── route.ts
│       ├── appointments/
│       │   └── route.ts
│       └── ai/
│           └── schedule/
│               └── route.ts
├── components/
│   ├── provider/
│   │   ├── OrderCreationForm.tsx
│   │   └── RevenueMeter.tsx
│   ├── patient/
│   │   ├── AIScheduler.tsx
│   │   └── KarmaDashboard.tsx
│   └── shared/
│       └── Header.tsx
├── lib/
│   ├── supabase/
│   │   └── client.ts
│   ├── ai/
│   │   └── openrouter.ts
│   └── types/
│       └── index.ts
└── .env.local
```

---

## Component Templates

### 1. Supabase Client Setup

**File:** `lib/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// For server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### 2. TypeScript Types

**File:** `lib/types/index.ts`

```typescript
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'provider' | 'patient' | 'caregiver' | 'admin';
}

export interface Order {
  id: string;
  patient_id: string;
  provider_id: string;
  order_type: string;
  title: string;
  description?: string;
  priority: 'routine' | 'urgent' | 'stat';
  status: 'unscheduled' | 'scheduled' | 'completed' | 'cancelled';
  estimated_revenue?: number;
  created_at: string;
}

export interface Prerequisite {
  id: string;
  order_id: string;
  provider_id?: string;
  prerequisite_type: string;
  description: string;
  is_required: boolean;
}

export interface Appointment {
  id: string;
  order_id: string;
  patient_id: string;
  scheduled_start: string;
  scheduled_end: string;
  location: string;
  staff_assigned?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
}

export interface AvailabilityPreference {
  id: string;
  patient_id: string;
  preference_type: 'recurring_block' | 'one_time_block' | 'preferred_time' | 'notice_requirement';
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  preference_data?: any;
}
```

### 3. Landing Page with Quick Login

**File:** `app/page.tsx`

```typescript
'use client';
import { useRouter } from 'next/navigation';

const DEMO_USERS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Dr. Sarah Jones', role: 'provider' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Sarah Martinez', role: 'patient' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'John Davis', role: 'patient' },
];

export default function HomePage() {
  const router = useRouter();

  const handleLogin = (user: typeof DEMO_USERS[0]) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    router.push(`/${user.role}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002C5F] to-[#008080]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">MedHarmony</h1>
        <p className="text-2xl text-white/90 mb-12">Harmonized Care, Simplified Scheduling</p>
        
        <div className="bg-white rounded-2xl p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Demo Login</h2>
          
          {DEMO_USERS.map(user => (
            <button
              key={user.id}
              onClick={() => handleLogin(user)}
              className="w-full mb-3 px-6 py-3 bg-white text-[#002C5F] border-2 border-[#008080] rounded-full font-semibold hover:bg-[#008080] hover:text-white transition"
            >
              Login as {user.name} ({user.role})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 4. Provider Dashboard Starter

**File:** `app/provider/page.tsx`

```typescript
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ProviderDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        patient:users!orders_patient_id_fkey(full_name),
        prerequisites(*)
      `)
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setOrders(data);
    setLoading(false);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#002C5F] text-white p-6">
        <h1 className="text-3xl font-bold">Provider Dashboard</h1>
      </header>
      
      <main className="p-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Revenue Protection</h2>
          <div className="text-4xl font-bold text-red-600">
            ${orders.filter(o => o.status === 'unscheduled').length * 200} AT RISK
          </div>
          <div className="text-gray-600">
            {orders.filter(o => o.status === 'unscheduled').length} unscheduled orders
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">Recent Orders</h2>
          </div>
          <div className="divide-y">
            {orders.map((order: any) => (
              <div key={order.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{order.title}</h3>
                    <p className="text-gray-600">Patient: {order.patient.full_name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    order.status === 'unscheduled' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
```

### 5. Patient Dashboard Starter

**File:** `app/patient/page.tsx`

```typescript
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

export default function PatientDashboard() {
  const [orders, setOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [karmaScore, setKarmaScore] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*, prerequisites(*)')
      .eq('patient_id', user.id);
    
    const { data: apptData } = await supabase
      .from('appointments')
      .select('*, orders(*)')
      .eq('patient_id', user.id);

    const { data: patientData } = await supabase
      .from('patient_profiles')
      .select('karma_score')
      .eq('id', user.id)
      .single();

    if (ordersData) setOrders(ordersData);
    if (apptData) setAppointments(apptData);
    if (patientData) setKarmaScore(patientData.karma_score);
  };

  const unscheduledOrders = orders.filter((o: any) => o.status === 'unscheduled');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#002C5F] text-white p-6">
        <h1 className="text-3xl font-bold">Patient Dashboard</h1>
      </header>
      
      <main className="p-8 max-w-6xl mx-auto">
        {unscheduledOrders.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">
              You have {unscheduledOrders.length} order(s) that need scheduling
            </h2>
            <p className="text-red-700 mb-4">Please schedule these as soon as possible.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 mb-2">Your Karma Score</div>
            <div className="text-4xl font-bold text-[#50C878]">{karmaScore}/100</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 mb-2">Unscheduled Orders</div>
            <div className="text-4xl font-bold text-red-600">{unscheduledOrders.length}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 mb-2">Upcoming Appointments</div>
            <div className="text-4xl font-bold text-[#008080]">{appointments.length}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">Your Orders</h2>
          </div>
          <div className="divide-y">
            {orders.map((order: any) => (
              <Link 
                key={order.id} 
                href={`/patient/orders/${order.id}`}
                className="block p-6 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{order.title}</h3>
                    <p className="text-gray-600">{order.prerequisites?.length || 0} prerequisites</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    order.status === 'unscheduled' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {order.status === 'unscheduled' ? 'NEEDS SCHEDULING' : 'SCHEDULED'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
```

---

## API Route Templates

### 1. AI Scheduling Endpoint

**File:** `app/api/ai/schedule/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { orderId, patientPreferences } = await request.json();

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an AI scheduling assistant for healthcare appointments. Return JSON only.'
          },
          {
            role: 'user',
            content: `Generate 3 appointment options for this order. Patient preferences: ${JSON.stringify(patientPreferences)}. Return JSON with: options array, each with: rank, datetime, location, reasoning, karmaBonus.`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error('AI scheduling error:', error);
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 });
  }
}
```

### 2. Orders API

**File:** `app/api/orders/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  const providerId = searchParams.get('providerId');

  let query = supabaseAdmin.from('orders').select('*, prerequisites(*)');
  
  if (patientId) query = query.eq('patient_id', patientId);
  if (providerId) query = query.eq('provider_id', providerId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, providerId, orderType, title, priority, prerequisites } = body;

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        patient_id: patientId,
        provider_id: providerId,
        order_type: orderType,
        title,
        priority,
        status: 'unscheduled'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create prerequisites
    if (prerequisites?.length > 0) {
      const prereqData = prerequisites.map((p: any) => ({
        order_id: order.id,
        provider_id: providerId,
        prerequisite_type: p.type,
        description: p.description,
        is_required: p.isRequired
      }));

      await supabaseAdmin.from('prerequisites').insert(prereqData);
    }

    return NextResponse.json({ order, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 3. Appointments API

**File:** `app/api/appointments/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, patientId, scheduledStart, scheduledEnd, location, staffAssigned } = body;

    // Create appointment
    const { data: appointment, error: apptError } = await supabaseAdmin
      .from('appointments')
      .insert({
        order_id: orderId,
        patient_id: patientId,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        location,
        staff_assigned: staffAssigned,
        status: 'scheduled'
      })
      .select()
      .single();

    if (apptError) throw apptError;

    // Update order status
    await supabaseAdmin
      .from('orders')
      .update({ status: 'scheduled' })
      .eq('id', orderId);

    // Award karma points
    await supabaseAdmin
      .from('patient_profiles')
      .update({ karma_score: supabaseAdmin.raw('karma_score + 5') })
      .eq('id', patientId);

    return NextResponse.json({ appointment, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## Environment Variables

**File:** `.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenRouter
OPENROUTER_API_KEY=your_openrouter_key_here

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Running the App

```bash
# Start development server
npm run dev

# Open in browser
# http://localhost:3000

# Login as any demo user to test different views
```

---

## Phase 2 Roadmap

These features are documented but not built in MVP:

### 1. Voice Interface for Elderly Patients
- Integration with Google AI Studio (Gemini)
- Phone call reminders: "Hi Margaret, this is Harmony..."
- Voice-based appointment scheduling
- Conversational rescheduling

### 2. Unified Health Records (Cross-Network)
- FHIR API integration
- Pull records from Mercy + Freeman + other networks
- Single timeline view of all medical history
- Selective provider sharing
- "Share with all" quick button

### 3. Family/Caregiver Portal
- Multi-patient management dashboard
- Permission levels (view only, manage appointments, full access)
- Child account → adult account migration
- Shared family calendar

### 4. Predictive No-Show Prevention
- ML model predicting no-show risk percentage
- Automatic backup patient booking
- Dynamic confirmation requirements based on risk
- Additional reminders for high-risk patients

### 5. Multi-Appointment Orchestration
- Schedule 3+ related appointments optimally
- Account for preparation time between visits
- Coordinate across multiple providers
- Minimize total patient time investment

### 6. Provider-to-Provider Referrals
- Dr. A refers to Dr. B with prerequisites
- Dr. B adds additional prerequisites
- Patient sees unified checklist with provider attribution
- Track referral completion rates

### 7. Mobile App (React Native or PWA)
- Native push notifications
- Location-based suggestions
- Offline mode
- Biometric authentication

### 8. Insurance Verification
- Auto-verify coverage before appointment
- Alert patient if coverage issues
- Estimate out-of-pocket costs
- Prevent surprise bills

---

## Troubleshooting

### Common Issues:

**1. "Cannot find module '@supabase/supabase-js'"**
```bash
npm install @supabase/supabase-js
```

**2. Environment variables not loading**
- Restart dev server after changing `.env.local`
- Make sure file is named exactly `.env.local` (not `.env`)

**3. Database connection errors**
- Check Supabase project is running (not paused)
- Verify API keys are correct in `.env.local`
- Check if IP is allowed in Supabase settings

**4. OpenRouter API errors**
- Verify API key is valid
- Check you have credits/quota available
- Try a different model if rate limited

---

## Quick Tips

1. **Use Claude Code in VS Code** - Upload this guide + the spec for help
2. **Test as you build** - Login as different users to test each flow
3. **Real-time updates** - Add Supabase subscriptions for live dashboard updates
4. **Styling** - Use Tailwind utility classes, MedHarmony color palette
5. **Keep it simple** - Focus on core flows first, polish later

---

## Success Checklist

Before demo:
- [ ] Can login as provider and create order
- [ ] Can login as patient and see order
- [ ] AI scheduling works (returns 3 options)
- [ ] Can book appointment
- [ ] Provider dashboard updates in real-time
- [ ] Karma score displays correctly
- [ ] Demo data is loaded
- [ ] All environment variables set
- [ ] Deployed to Vercel
- [ ] Demo video recorded

---

## Need Help?

If stuck, ask Claude Code in VS Code:
- "Following the BUILD_GUIDE.md, how do I [specific question]?"
- Upload both MEDHARMONY_PROJECT_SPEC.md and BUILD_GUIDE.md as context
- Reference specific sections by name

**Remember:** Build core flows first, add polish later. You've got this!

---

*End of Build Guide - Ready to build MedHarmony Command Center! 🚀*
