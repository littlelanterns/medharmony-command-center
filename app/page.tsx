'use client';
import { useRouter } from 'next/navigation';

interface DemoUser {
  id: string;
  name: string;
  role: string;
  badge?: string;
}

const DEMO_USERS: DemoUser[] = [
  // Caregiver - Show first (most impressive demo)
  { id: '20000000-0000-0000-0000-000000000001', name: 'Jennifer Martinez', role: 'caregiver', badge: 'Managing 6 family members + $50K heart surgery' },

  // Providers
  { id: '10000000-0000-0000-0000-000000000003', name: 'Dr. Michael Chen', role: 'provider', badge: 'Cardiologist - Ruthie\'s heart surgery order' },
  { id: '11111111-1111-1111-1111-111111111111', name: 'Dr. Sarah Jones', role: 'provider', badge: 'Pediatrician - AI schedule across 3 locations' },
  { id: '10000000-0000-0000-0000-000000000001', name: 'Dr. Patel', role: 'provider', badge: 'Pediatrics - 10 appointments' },
  { id: '10000000-0000-0000-0000-000000000002', name: 'Dr. Kim', role: 'provider', badge: 'Endocrinology - 8 appointments' },
  { id: '10000000-0000-0000-0000-000000000004', name: 'Dr. Amanda Rodriguez', role: 'provider', badge: 'Child Psychiatry' },
  { id: '10000000-0000-0000-0000-000000000007', name: 'Dr. Maria Santos', role: 'provider', badge: 'Family Medicine - Primary care' },

  // Patients
  { id: '30000000-0000-0000-0000-000000000001', name: 'Robert Chen', role: 'patient', badge: 'High karma: 95/100 ⭐' },
  { id: '30000000-0000-0000-0000-000000000002', name: 'Maria Gonzalez', role: 'patient', badge: 'High karma: 92/100 ⭐' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Sarah Martinez', role: 'patient', badge: 'Standard patient' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'John Davis', role: 'patient', badge: 'Standard patient' },
];

export default function HomePage() {
  const router = useRouter();

  const handleLogin = (user: DemoUser) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    router.push(`/${user.role}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002C5F] to-[#008080]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">MedHarmony</h1>
        <p className="text-2xl text-white/90 mb-2">Harmonized Care, Simplified Scheduling</p>
        <p className="text-sm text-white/70 mb-12">Powered by AI • Real Hospital Pricing Data • Smart Scheduling</p>

        <div className="bg-white rounded-2xl p-8 max-w-md mx-auto shadow-2xl">
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Demo Login</h2>
          <p className="text-xs text-gray-500 mb-6">Using real Freeman Health System pricing data</p>

          {DEMO_USERS.map(user => (
            <button
              key={user.id}
              onClick={() => handleLogin(user)}
              className="w-full mb-3 px-6 py-3 bg-white text-[#002C5F] border-2 border-[#008080] rounded-lg font-semibold hover:bg-[#008080] hover:text-white transition-all duration-300 text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">{user.name}</div>
                  <div className="text-sm text-gray-600 capitalize">{user.role}</div>
                </div>
                {user.badge && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {user.badge}
                  </span>
                )}
              </div>
            </button>
          ))}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              This is a demo application. No real authentication required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
