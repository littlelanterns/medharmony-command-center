'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import Header from '@/components/shared/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/shared/StatusBadge';
import AppointmentCard from '@/components/patient/AppointmentCard';
import CancellationAlertCard from '@/components/patient/CancellationAlertCard';

export default function PatientDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [karmaScore, setKarmaScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [cancellationAlerts, setCancellationAlerts] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [bookingProviderId, setBookingProviderId] = useState<string>('');
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [showUnscheduledModal, setShowUnscheduledModal] = useState(false);

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

    // Load cancellation alerts (high priority notifications)
    const { data: alertsData } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', patientId)
      .eq('notification_type', 'cancellation_alert')
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (ordersData) setOrders(ordersData);
    if (apptData) setAppointments(apptData);
    if (patientData) setKarmaScore(patientData.karma_score);
    setHasPreferences((prefsData?.length || 0) > 0);
    if (alertsData) setCancellationAlerts(alertsData);

    // Load providers for booking appointments
    await loadProviders();

    setLoading(false);
  };

  const loadProviders = async () => {
    const { data: providersData } = await supabase
      .from('provider_profiles')
      .select(`
        id,
        specialty,
        user:users!provider_profiles_id_fkey (
          full_name
        )
      `)
      .eq('verified', true)
      .order('specialty', { ascending: true });

    if (providersData) {
      setProviders(providersData);
    }
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

  const handleBookAppointment = async () => {
    if (!bookingProviderId) {
      alert('Please select a provider.');
      return;
    }

    const provider = providers.find(p => p.id === bookingProviderId);

    if (!confirm(`Book an appointment with ${(provider as any)?.user?.full_name} (${provider?.specialty})?`)) {
      return;
    }

    setBookingInProgress(true);

    try {
      // Create a new order for this appointment
      const { data: newOrder, error } = await supabase
        .from('orders')
        .insert({
          patient_id: user.id,
          provider_id: bookingProviderId,
          order_type: 'consultation',
          title: `Consultation - ${provider?.specialty}`,
          description: `New appointment booking with ${(provider as any)?.user?.full_name}`,
          status: 'unscheduled',
          priority: 'routine',
          estimated_revenue: 200,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Automatically redirect to the AI scheduler for the new order
      window.location.href = `/patient/orders/${newOrder.id}?autoSchedule=true`
    } catch (error: any) {
      console.error('Booking error:', error);
      alert(`❌ Error creating appointment: ${error.message}`);
    } finally {
      setBookingInProgress(false);
    }
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
        userName={user?.full_name || user?.name || 'Patient'}
        userId={user?.id}
        userRole="patient"
        actionButton={{
          label: hasPreferences ? 'Update My Availability' : 'Set My Availability',
          href: '/patient/preferences',
          variant: 'secondary',
        }}
      />

      <main className="max-w-7xl mx-auto p-8">

        {/* Cancellation Alerts - Show first! */}
        {cancellationAlerts.map((alert) => (
          <CancellationAlertCard
            key={alert.id}
            notification={alert}
            patientId={user?.id || ''}
            onClaimed={() => loadData(user?.id)}
          />
        ))}

        {/* Alert for unscheduled orders - Clickable */}
        {unscheduledOrders.length > 0 && (
          <button
            onClick={() => setShowUnscheduledModal(true)}
            className="w-full bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded-r-lg hover:bg-red-100 transition cursor-pointer text-left"
          >
            <div className="flex items-start">
              <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-red-800 mb-2">
                  You have {unscheduledOrders.length} order{unscheduledOrders.length !== 1 ? 's' : ''} that need{unscheduledOrders.length === 1 ? 's' : ''} scheduling
                </h2>
                <p className="text-red-700">
                  Please schedule {unscheduledOrders.length === 1 ? 'this order' : 'these orders'} as soon as possible to complete your care plan.
                </p>
                <p className="text-red-600 font-semibold mt-2 text-sm">
                  Click to view details →
                </p>
              </div>
            </div>
          </button>
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

        {/* Book New Appointment */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-[#008080] to-[#002C5F] rounded-xl p-6 text-white shadow-lg">
            <h2 className="text-2xl font-bold mb-4">📅 Book New Appointment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold mb-2">Select Provider / Specialist</label>
                <select
                  value={bookingProviderId}
                  onChange={(e) => setBookingProviderId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-white/20 bg-white/10 text-white focus:outline-none focus:border-white"
                  disabled={bookingInProgress}
                >
                  <option value="" className="text-gray-900">Select a provider...</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id} className="text-gray-900">
                      {(provider as any).user.full_name} - {provider.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  onClick={handleBookAppointment}
                  disabled={bookingInProgress || !bookingProviderId}
                  className="w-full px-6 py-2 bg-white text-[#008080] rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookingInProgress ? '⏳ Booking...' : '➕ Create Appointment Order'}
                </button>
              </div>
            </div>
            <p className="text-sm text-white/80 mt-3">
              This will create a new appointment order that you can then schedule using AI.
            </p>
          </div>
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

      {/* Unscheduled Orders Modal */}
      {showUnscheduledModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowUnscheduledModal(false)}>
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-red-50 border-b-4 border-red-500 p-6 sticky top-0 z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-red-900 mb-2">
                    Orders Needing Scheduling ({unscheduledOrders.length})
                  </h2>
                  <p className="text-red-700">Schedule these orders to complete your care plan</p>
                </div>
                <button
                  onClick={() => setShowUnscheduledModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-white/50"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {unscheduledOrders.map((order: any) => (
                <div key={order.id} className="bg-white border-2 border-red-200 rounded-lg p-5 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{order.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{order.description}</p>
                      <p className="text-sm text-gray-600">
                        From: <span className="font-semibold">{order.provider?.full_name || 'Your Provider'}</span>
                      </p>
                      {order.priority !== 'routine' && (
                        <span className="inline-block mt-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">
                          {order.priority.toUpperCase()} PRIORITY
                        </span>
                      )}
                    </div>
                  </div>

                  {order.prerequisites && order.prerequisites.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Prerequisites:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {order.prerequisites.map((prereq: any, i: number) => (
                          <li key={i}>• {prereq.description || prereq}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Link href={`/patient/orders/${order.id}`}>
                    <button className="w-full px-4 py-2 bg-[#008080] text-white rounded-lg font-semibold hover:bg-[#006666] transition">
                      🤖 Schedule Now with AI
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
