'use client';
import { useRouter } from 'next/navigation';

const DEMO_USERS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Dr. Sarah Jones', role: 'provider' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Sarah Martinez', role: 'patient' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'John Davis', role: 'patient' },
  { id: '20000000-0000-0000-0000-000000000001', name: 'Jennifer Martinez', role: 'caregiver' },
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

        <div className="bg-white rounded-2xl p-8 max-w-md mx-auto shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Demo Login</h2>

          {DEMO_USERS.map(user => (
            <button
              key={user.id}
              onClick={() => handleLogin(user)}
              className="w-full mb-3 px-6 py-3 bg-white text-[#002C5F] border-2 border-[#008080] rounded-full font-semibold hover:bg-[#008080] hover:text-white transition-all duration-300"
            >
              Login as {user.name} ({user.role})
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
