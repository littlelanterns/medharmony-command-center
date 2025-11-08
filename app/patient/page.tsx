'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

export default function PatientDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [karmaScore, setKarmaScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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

    if (ordersData) setOrders(ordersData);
    if (apptData) setAppointments(apptData);
    if (patientData) setKarmaScore(patientData.karma_score);
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
      {/* Header */}
      <header className="bg-[#002C5F] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Patient Dashboard</h1>
          <p className="text-white/80 mt-1">Welcome, {user?.name || 'Patient'}</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
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
          <Link href="/patient/karma" className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-600 font-semibold">Your Karma Score</div>
              <span className="text-2xl">⭐</span>
            </div>
            <div className="text-4xl font-bold text-[#50C878]">{karmaScore}/100</div>
            <div className="mt-2 text-sm text-gray-500">
              {karmaScore >= 90 ? 'Exemplary Patient' :
               karmaScore >= 75 ? 'Excellent Patient' :
               karmaScore >= 60 ? 'Good Patient' : 'Building Karma'}
            </div>
          </Link>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-600 font-semibold">Unscheduled Orders</div>
              <span className="text-2xl">{unscheduledOrders.length > 0 ? '🔴' : '✅'}</span>
            </div>
            <div className="text-4xl font-bold text-red-600">{unscheduledOrders.length}</div>
            <div className="mt-2 text-sm text-gray-500">
              {unscheduledOrders.length === 0 ? 'All caught up!' : 'Need your attention'}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-600 font-semibold">Upcoming Appointments</div>
              <span className="text-2xl">📅</span>
            </div>
            <div className="text-4xl font-bold text-[#008080]">{upcomingAppointments.length}</div>
            <div className="mt-2 text-sm text-gray-500">
              {upcomingAppointments.length === 0 ? 'None scheduled' : 'Next 30 days'}
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
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
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'unscheduled'
                            ? 'bg-red-100 text-red-700'
                            : order.status === 'scheduled'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status === 'unscheduled' ? '🔴 NEEDS SCHEDULING' : '✅ SCHEDULED'}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-2">
                        From: <span className="font-semibold">{order.provider?.full_name || 'Your Provider'}</span>
                      </p>

                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Type: {order.order_type}</span>
                        <span>{order.prerequisites?.length || 0} prerequisites</span>
                        {order.priority !== 'routine' && (
                          <span className="text-orange-600 font-semibold">Priority: {order.priority}</span>
                        )}
                      </div>

                      {order.status === 'unscheduled' && (
                        <div className="mt-3">
                          <button className="btn-primary text-sm py-2 px-6">
                            Schedule Now with AI
                          </button>
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
        </div>

        {/* Appointments Section */}
        {upcomingAppointments.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Upcoming Appointments</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {upcomingAppointments.map((appointment: any) => (
                <div key={appointment.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {appointment.orders?.title || 'Appointment'}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        {new Date(appointment.scheduled_start).toLocaleString()}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {appointment.location}
                      </div>
                    </div>

                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
