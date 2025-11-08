'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function KarmaDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [karmaScore, setKarmaScore] = useState(0);
  const [reliabilityPercentage, setReliabilityPercentage] = useState(100);
  const [karmaHistory, setKarmaHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({
    appointmentsKept: 0,
    appointmentsCancelled: 0,
    cancellationsClaimed: 0,
    noShows: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setUser(userData);
    if (userData.id) {
      loadKarmaData(userData.id);
    }
  }, []);

  const loadKarmaData = async (patientId: string) => {
    // Load patient profile
    const { data: profile } = await supabase
      .from('patient_profiles')
      .select('karma_score, reliability_percentage')
      .eq('id', patientId)
      .single();

    if (profile) {
      setKarmaScore(profile.karma_score);
      setReliabilityPercentage(profile.reliability_percentage);
    }

    // Load karma history
    const { data: history } = await supabase
      .from('karma_history')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (history) {
      setKarmaHistory(history);

      // Calculate stats from history
      const kept = history.filter(h => h.action_type === 'kept_appointment').length;
      const claimed = history.filter(h => h.action_type === 'claimed_cancellation').length;
      const cancelled = history.filter(h => h.action_type.includes('cancelled')).length;
      const noShows = history.filter(h => h.action_type === 'no_show').length;

      setStats({
        appointmentsKept: kept,
        appointmentsCancelled: cancelled,
        cancellationsClaimed: claimed,
        noShows,
      });
    }

    setLoading(false);
  };

  const getTier = () => {
    if (karmaScore >= 90) return { name: 'Exemplary Patient', color: 'text-green-600', stars: 5 };
    if (karmaScore >= 75) return { name: 'Excellent Patient', color: 'text-blue-600', stars: 4 };
    if (karmaScore >= 60) return { name: 'Good Patient', color: 'text-yellow-600', stars: 3 };
    if (karmaScore >= 40) return { name: 'Fair Patient', color: 'text-orange-600', stars: 2 };
    return { name: 'Needs Improvement', color: 'text-red-600', stars: 1 };
  };

  const tier = getTier();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading your karma dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#002C5F] text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push('/patient')}
            className="text-white/80 hover:text-white mb-2 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">Your Healthcare Karma</h1>
          <p className="text-white/80 mt-1">Track your impact and unlock benefits</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        {/* Overall Score Card */}
        <div className="bg-gradient-to-r from-[#002C5F] to-[#008080] rounded-xl shadow-2xl p-8 mb-8 text-white">
          <div className="text-center">
            <h2 className="text-xl mb-4">Overall Score</h2>
            <div className="text-7xl font-bold mb-4">{karmaScore}<span className="text-3xl">/100</span></div>
            <div className={`text-2xl font-semibold mb-2 ${tier.color.replace('text-', 'text-white/')}`}>
              {tier.name}
              {tier.stars >= 4 && <span className="ml-2">(Top {tier.stars === 5 ? '10' : '25'}%)</span>}
            </div>
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-8 h-8 ${i < tier.stars ? 'text-yellow-400' : 'text-white/30'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Your Impact This Year</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">✅ Appointments kept on time</span>
                <span className="font-bold text-2xl text-green-600">{stats.appointmentsKept}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">🎯 Cancellation slots claimed</span>
                <span className="font-bold text-2xl text-blue-600">{stats.cancellationsClaimed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">📅 Appointments rescheduled</span>
                <span className="font-bold text-2xl text-yellow-600">{stats.appointmentsCancelled}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">❌ No-shows</span>
                <span className="font-bold text-2xl text-red-600">{stats.noShows}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold text-green-800">You've helped {stats.cancellationsClaimed} other patients receive care faster!</div>
                    <div className="text-sm text-green-700 mt-1">Your reliability has prevented revenue loss for healthcare providers.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Your Benefits</h3>
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${karmaScore >= 75 ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800">🎁 Priority Cancellation Alerts</span>
                  {karmaScore >= 75 ? (
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">ACTIVE</span>
                  ) : (
                    <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full">Locked (75+)</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">You're first to know when better times open up</p>
              </div>

              <div className={`p-4 rounded-lg ${karmaScore >= 80 ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800">🎁 Extended Booking Window</span>
                  {karmaScore >= 80 ? (
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">ACTIVE</span>
                  ) : (
                    <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full">Locked (80+)</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {karmaScore >= 80
                    ? 'Book appointments 60 days in advance (Standard: 30 days)'
                    : 'Unlock to book 60 days in advance'}
                </p>
              </div>

              <div className={`p-4 rounded-lg ${karmaScore >= 90 ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800">🎁 Simplified Confirmations</span>
                  {karmaScore >= 90 ? (
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">ACTIVE</span>
                  ) : (
                    <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full">Locked (90+)</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">Auto-confirm enabled - no need to confirm routine appointments</p>
              </div>

              <div className={`p-4 rounded-lg ${karmaScore >= 85 ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800">🎁 Provider Trust Badge</span>
                  {karmaScore >= 85 ? (
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">ACTIVE</span>
                  ) : (
                    <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full">Locked (85+)</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">Providers see your reliability score and may offer better times</p>
              </div>
            </div>
          </div>
        </div>

        {/* How Karma Works */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-4 text-gray-800">How Karma Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-700 mb-3">Earn Points:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>+20 points</span><span className="text-gray-600">Keep appointment on time</span></div>
                <div className="flex justify-between"><span>+10 points</span><span className="text-gray-600">Claim a cancellation slot</span></div>
                <div className="flex justify-between"><span>+5 points</span><span className="text-gray-600">Cancel with 3+ days notice</span></div>
                <div className="flex justify-between"><span>+3 points</span><span className="text-gray-600">Reschedule with 24+ hours notice</span></div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-red-700 mb-3">Lose Points:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>-20 points</span><span className="text-gray-600">No-show for appointment</span></div>
                <div className="flex justify-between"><span>-10 points</span><span className="text-gray-600">Repeatedly ignore cancellation alerts</span></div>
                <div className="flex justify-between"><span>-5 points</span><span className="text-gray-600">Cancel with less than 24 hours notice</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Recent Activity</h3>
          {karmaHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No activity yet. Start scheduling appointments to build your karma!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {karmaHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-800">
                      {item.description || item.action_type.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${item.points_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.points_change > 0 ? '+' : ''}{item.points_change}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Why This Matters */}
        <div className="bg-blue-50 rounded-xl shadow-lg p-8 mt-8 border-l-4 border-blue-500">
          <h3 className="text-xl font-bold mb-4 text-blue-900">💡 Why This Matters</h3>
          <div className="text-blue-800 space-y-2">
            <p>When you keep appointments and claim cancellations:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Doctors can see more patients who need care</li>
              <li>Other patients get appointments faster</li>
              <li>Healthcare providers stay financially healthy</li>
              <li>Everyone benefits from a more efficient system</li>
            </ul>
            <p className="mt-4 font-semibold">Your actions have real impact on your community! 🙏</p>
          </div>
        </div>
      </main>
    </div>
  );
}
