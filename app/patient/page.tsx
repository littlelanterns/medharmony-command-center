'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import Header from '@/components/shared/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/shared/StatusBadge';
import AppointmentCard from '@/components/patient/AppointmentCard';

export default function PatientDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [karmaScore, setKarmaScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasPreferences, setHasPreferences] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setUser(userData);
    if (userData.id) {
      loadData(userData.id);
      subscribeToUpdates(userData.id);
    }
  }, []);

  const loadData = async (patientId: string) => {
    // Load orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select(`
        *,
        prerequisites(*),
        provider:users!orders_provider_id_fkey(full_name)
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    // Load appointments
    const { data: apptData } = await supabase
      .from('appointments')
      .select('*, orders(*)')
      .eq('patient_id', patientId)
      .order('scheduled_start', { ascending: true });

    // Load karma score
    const { data: patientData } = await supabase
      .from('patient_profiles')
      .select('karma_score, reliability_percentage')
      .eq('id', patientId)
      .single();

    // Check if patient has set preferences
    const { data: prefsData } = await supabase
      .from('availability_preferences')
      .select('id')
      .eq('patient_id', patientId)
      .eq('is_active', true)
      .limit(1);

    if (ordersData) setOrders(ordersData);
    if (apptData) setAppointments(apptData);
    if (patientData) setKarmaScore(patientData.karma_score);
    setHasPreferences((prefsData?.length || 0) > 0);
    setLoading(false);
  };

  const subscribeToUpdates = (patientId: string) => {
    const channel = supabase
      .channel('patient-updates')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `patient_id=eq.${patientId}`
        },
        (payload) => {
          console.log('Order changed:', payload);
          loadData(patientId);
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `patient_id=eq.${patientId}`
        },
        (payload) => {
          console.log('Appointment changed:', payload);
          loadData(patientId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const unscheduledOrders = orders.filter((o: any) => o.status === 'unscheduled');
  const upcomingAppointments = appointments.filter((a: any) =>
    new Date(a.scheduled_start) > new Date() && a.status !== 'cancelled'
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Patient Dashboard"
        userName={user?.name || 'Patient'}
        actionButton={{
          label: hasPreferences ? 'Update My Availability' : 'Set My Availability',
          href: '/patient/preferences',
          variant: 'secondary',
        }}
      />

      <main className="max-w-7xl mx-auto p-8">
        {/* Alert for missing preferences */}
        {!hasPreferences && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-lg">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h2 className="text-xl font-bold text-blue-800 mb-2">
                  Set Your Availability Preferences
                </h2>
                <p className="text-blue-700 mb-3">
                  Help our AI find the perfect appointment times by setting your availability preferences. This only takes a minute!
                </p>
                <Link href="/patient/preferences" className="btn-primary text-sm py-2 px-6">
                  Set Preferences Now
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Alert for unscheduled orders */}
        {unscheduledOrders.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded-r-lg">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h2 className="text-xl font-bold text-red-800 mb-2">
                  You have {unscheduledOrders.length} order{unscheduledOrders.length !== 1 ? 's' : ''} that need{unscheduledOrders.length === 1 ? 's' : ''} scheduling
                </h2>
                <p className="text-red-700">
                  Please schedule {unscheduledOrders.length === 1 ? 'this order' : 'these orders'} as soon as possible to complete your care plan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/patient/karma">
            <Card hoverable>
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-600 font-semibold">Your Karma Score</div>
                <span className="text-2xl">⭐</span>
              </div>
              <div className="text-4xl font-bold text-[#50C878]">{karmaScore}/100</div>
              <div className="mt-2 text-sm text-gray-500">
                {karmaScore >= 90
                  ? 'Exemplary Patient'
                  : karmaScore >= 75
                  ? 'Excellent Patient'
                  : karmaScore >= 60
                  ? 'Good Patient'
                  : 'Building Karma'}
              </div>
            </Card>
          </Link>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-600 font-semibold">Unscheduled Orders</div>
              <span className="text-2xl">{unscheduledOrders.length > 0 ? '🔴' : '✅'}</span>
            </div>
            <div className="text-4xl font-bold text-red-600">{unscheduledOrders.length}</div>
            <div className="mt-2 text-sm text-gray-500">
              {unscheduledOrders.length === 0 ? 'All caught up!' : 'Need your attention'}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-600 font-semibold">Upcoming Appointments</div>
              <span className="text-2xl">📅</span>
            </div>
            <div className="text-4xl font-bold text-[#008080]">{upcomingAppointments.length}</div>
            <div className="mt-2 text-sm text-gray-500">
              {upcomingAppointments.length === 0 ? 'None scheduled' : 'Next 30 days'}
            </div>
          </Card>
        </div>

        {/* Orders Section */}
        <Card className="mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Your Orders</h2>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg">No orders yet.</p>
              <p className="mt-2">Your healthcare provider will create orders for you.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/patient/orders/${order.id}`}
                  className="block p-6 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{order.title}</h3>
                        <StatusBadge status={order.status} />
                      </div>

                      <p className="text-gray-600 mb-2">
                        From:{' '}
                        <span className="font-semibold">
                          {order.provider?.full_name || 'Your Provider'}
                        </span>
                      </p>

                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Type: {order.order_type}</span>
                        <span>{order.prerequisites?.length || 0} prerequisites</span>
                        {order.priority !== 'routine' && (
                          <span className="text-orange-600 font-semibold">
                            Priority: {order.priority}
                          </span>
                        )}
                      </div>

                      {order.status === 'unscheduled' && (
                        <div className="mt-3">
                          <Button size="sm">Schedule Now with AI</Button>
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Appointments Section */}
        {upcomingAppointments.length > 0 && (
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Upcoming Appointments</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {upcomingAppointments.map((appointment: any) => (
                <div key={appointment.id} className="p-6">
                  <AppointmentCard appointment={appointment} showTitle={true} />
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
