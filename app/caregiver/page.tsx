'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface FamilyMember {
  id: string;
  full_name: string;
  email: string;
  relationship_type: string;
  patient_profile?: {
    date_of_birth: string;
    medical_conditions: string[];
    karma_score: number;
  };
}

interface Order {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_color: string;
  title: string;
  description: string;
  status: string;
  urgency: string;
  prerequisites: string[];
  provider?: {
    full_name: string;
    specialty: string;
  };
  created_at: string;
}

interface Appointment {
  id: string;
  order_id: string;
  patient_id: string;
  patient_name: string;
  scheduled_start: string;
  scheduled_end: string;
  location: string;
  status: string;
  confirmation_required: boolean;
  order: {
    title: string;
  };
}

const PATIENT_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', badge: 'bg-blue-100' },
  { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-700', badge: 'bg-pink-100' },
  { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', badge: 'bg-green-100' },
  { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', badge: 'bg-purple-100' },
  { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', badge: 'bg-orange-100' },
];

export default function CaregiverDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('all');
  const [schedulingAll, setSchedulingAll] = useState(false);
  const [processingAppointment, setProcessingAppointment] = useState<string | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [bookingPatientId, setBookingPatientId] = useState<string>('');
  const [bookingProviderId, setBookingProviderId] = useState<string>('');
  const [bookingInProgress, setBookingInProgress] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setUser(userData);

    if (userData.role !== 'caregiver') {
      alert('Access denied. This page is for caregivers only.');
      router.push('/');
      return;
    }

    if (userData.id) {
      loadFamilyData(userData.id);
    }
  }, [router]);

  const loadFamilyData = async (caregiverId: string) => {
    setLoading(true);

    // Load family members
    const { data: relationships } = await supabase
      .from('caregiver_relationships')
      .select(`
        patient_id,
        relationship_type,
        patient:users!caregiver_relationships_patient_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('caregiver_id', caregiverId);

    if (relationships) {
      const members: FamilyMember[] = [];

      for (const rel of relationships) {
        const patient = (rel as any).patient;

        // Get patient profile
        const { data: profile } = await supabase
          .from('patient_profiles')
          .select('date_of_birth, medical_conditions, karma_score')
          .eq('id', patient.id)
          .single();

        members.push({
          id: patient.id,
          full_name: patient.full_name,
          email: patient.email,
          relationship_type: rel.relationship_type,
          patient_profile: profile || undefined,
        });
      }

      setFamilyMembers(members);

      // Load all orders for all family members
      const patientIds = members.map(m => m.id);
      await loadOrders(patientIds, members);
      await loadAppointments(patientIds, members);
    }

    // Load all providers for booking appointments
    await loadProviders();

    setLoading(false);
  };

  const loadOrders = async (patientIds: string[], members: FamilyMember[]) => {
    const { data: ordersData } = await supabase
      .from('orders')
      .select(`
        *,
        provider:provider_profiles!orders_provider_id_fkey (
          id,
          specialty,
          user:users!provider_profiles_id_fkey (
            full_name
          )
        )
      `)
      .in('patient_id', patientIds)
      .order('created_at', { ascending: false });

    if (ordersData) {
      const ordersWithPatientInfo: Order[] = ordersData.map((order, index) => {
        const patient = members.find(m => m.id === order.patient_id);
        const patientIndex = members.findIndex(m => m.id === order.patient_id);
        const colorScheme = PATIENT_COLORS[patientIndex % PATIENT_COLORS.length];

        return {
          ...order,
          patient_name: patient?.full_name || 'Unknown',
          patient_color: colorScheme.bg,
          provider: order.provider
            ? {
                full_name: (order.provider as any).user.full_name,
                specialty: (order.provider as any).specialty,
              }
            : undefined,
        };
      });

      setOrders(ordersWithPatientInfo);
    }
  };

  const loadAppointments = async (patientIds: string[], members: FamilyMember[]) => {
    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select(`
        *,
        order:orders!appointments_order_id_fkey (
          title
        )
      `)
      .in('patient_id', patientIds)
      .gte('scheduled_start', new Date().toISOString())
      .order('scheduled_start', { ascending: true });

    if (appointmentsData) {
      const appointmentsWithPatientInfo: Appointment[] = appointmentsData.map(appt => {
        const patient = members.find(m => m.id === appt.patient_id);
        return {
          ...appt,
          patient_name: patient?.full_name || 'Unknown',
          order: (appt as any).order,
        };
      });

      setAppointments(appointmentsWithPatientInfo);
    }
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

  const getAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleScheduleAll = async () => {
    setSchedulingAll(true);

    try {
      const unscheduledOrders = filteredOrders.filter(o => o.status === 'unscheduled');

      if (unscheduledOrders.length === 0) {
        alert('No unscheduled orders to schedule!');
        setSchedulingAll(false);
        return;
      }

      if (!confirm(`Schedule ${unscheduledOrders.length} appointment(s) for your family members using AI? This will find optimal times considering everyone's schedule.`)) {
        setSchedulingAll(false);
        return;
      }

      // Prepare orders for API
      const ordersToSchedule = unscheduledOrders.map(o => ({
        orderId: o.id,
        patientId: o.patient_id,
        patientName: o.patient_name,
        providerId: o.provider_id,
        urgency: o.urgency,
      }));

      // Call multi-patient AI scheduling API
      const response = await fetch('/api/caregiver/schedule-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caregiverId: user.id,
          orders: ordersToSchedule,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to schedule appointments');
      }

      // Show results
      if (result.scheduled > 0) {
        let message = `✅ Successfully scheduled ${result.scheduled} appointment(s)!\n\n`;

        if (result.appointments && result.appointments.length > 0) {
          message += 'Scheduled appointments:\n';
          result.appointments.forEach((appt: any) => {
            const date = new Date(appt.scheduled_start);
            message += `\n• ${appt.patientName}: ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
            if (appt.recommendation?.reasoning) {
              message += `\n  Reason: ${appt.recommendation.reasoning}`;
            }
          });
        }

        if (result.failed > 0) {
          message += `\n\n⚠️ ${result.failed} appointment(s) could not be scheduled. Please schedule these manually.`;
        }

        alert(message);

        // Reload data
        if (user.id) {
          await loadFamilyData(user.id);
        }
      } else {
        alert('❌ No appointments could be scheduled. Please try scheduling individually or contact support.');
      }

      setSchedulingAll(false);
    } catch (error: any) {
      console.error('Scheduling error:', error);
      alert(`❌ Error scheduling appointments: ${error.message}`);
      setSchedulingAll(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string, patientName: string) => {
    if (!confirm(`Are you sure you want to cancel this appointment for ${patientName}?`)) {
      return;
    }

    setProcessingAppointment(appointmentId);

    try {
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel appointment');
      }

      alert(`✅ Appointment cancelled successfully for ${patientName}`);

      // Reload data
      if (user.id) {
        await loadFamilyData(user.id);
      }
    } catch (error: any) {
      console.error('Cancel error:', error);
      alert(`❌ Error cancelling appointment: ${error.message}`);
    } finally {
      setProcessingAppointment(null);
    }
  };

  const handleRescheduleAppointment = async (orderId: string, patientId: string, patientName: string) => {
    // Navigate to the order page with reschedule and auto-schedule enabled
    router.push(`/patient/orders/${orderId}?patientId=${patientId}&reschedule=true&autoSchedule=true`);
  };

  const handleBookAppointment = async () => {
    if (!bookingPatientId || !bookingProviderId) {
      alert('Please select both a family member and a provider.');
      return;
    }

    const patient = familyMembers.find(m => m.id === bookingPatientId);
    const provider = providers.find(p => p.id === bookingProviderId);

    if (!confirm(`Book an appointment for ${patient?.full_name} with ${(provider as any)?.user?.full_name} (${provider?.specialty})?`)) {
      return;
    }

    setBookingInProgress(true);

    try {
      // Create a new order for this appointment
      const { data: newOrder, error } = await supabase
        .from('orders')
        .insert({
          patient_id: bookingPatientId,
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
      router.push(`/patient/orders/${newOrder.id}?patientId=${bookingPatientId}&autoSchedule=true`)
    } catch (error: any) {
      console.error('Booking error:', error);
      alert(`❌ Error creating appointment: ${error.message}`);
    } finally {
      setBookingInProgress(false);
    }
  };

  const filteredOrders = selectedPatientId === 'all'
    ? orders
    : orders.filter(o => o.patient_id === selectedPatientId);

  const filteredAppointments = selectedPatientId === 'all'
    ? appointments
    : appointments.filter(a => a.patient_id === selectedPatientId);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'standard': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading family data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#008080] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="text-white/80 hover:text-white mb-2 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </button>
          <h1 className="text-3xl font-bold">Family Health Manager</h1>
          <p className="text-white/90 mt-1">
            Managing healthcare for {familyMembers.length} family member{familyMembers.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {/* Family Member Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Family</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {familyMembers.map((member, index) => {
              const colorScheme = PATIENT_COLORS[index % PATIENT_COLORS.length];
              const age = member.patient_profile?.date_of_birth
                ? getAge(member.patient_profile.date_of_birth)
                : null;

              return (
                <div
                  key={member.id}
                  className={`${colorScheme.bg} border-2 ${colorScheme.border} rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedPatientId === member.id ? 'ring-4 ring-offset-2 ring-[#008080]' : ''
                  }`}
                  onClick={() => setSelectedPatientId(member.id === selectedPatientId ? 'all' : member.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className={`font-bold ${colorScheme.text} text-lg`}>
                        {member.full_name}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">{member.relationship_type}</p>
                      {age !== null && (
                        <p className="text-sm text-gray-500">Age {age}</p>
                      )}
                    </div>
                    <div className={`${colorScheme.badge} px-2 py-1 rounded-full text-xs font-semibold ${colorScheme.text}`}>
                      Karma: {member.patient_profile?.karma_score || 'N/A'}
                    </div>
                  </div>

                  {member.patient_profile?.medical_conditions && member.patient_profile.medical_conditions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Conditions:</p>
                      <div className="flex flex-wrap gap-1">
                        {member.patient_profile.medical_conditions.map((condition, i) => (
                          <span key={i} className="text-xs bg-white/60 px-2 py-1 rounded">
                            {condition}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Filter Indicator */}
          <div className="flex items-center justify-between">
            <div>
              {selectedPatientId !== 'all' ? (
                <p className="text-sm text-gray-600">
                  Showing appointments for{' '}
                  <span className="font-semibold">
                    {familyMembers.find(m => m.id === selectedPatientId)?.full_name}
                  </span>
                  {' '}
                  <button
                    onClick={() => setSelectedPatientId('all')}
                    className="text-[#008080] hover:underline ml-2"
                  >
                    Show All
                  </button>
                </p>
              ) : (
                <p className="text-sm text-gray-600">Showing all family members</p>
              )}
            </div>

            {filteredOrders.filter(o => o.status === 'unscheduled').length > 0 && (
              <button
                onClick={handleScheduleAll}
                disabled={schedulingAll}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {schedulingAll ? '⏳ Scheduling...' : '🤖 AI Schedule All'}
              </button>
            )}
          </div>
        </div>

        {/* Book New Appointment */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-[#008080] to-[#002C5F] rounded-xl p-6 text-white shadow-lg">
            <h2 className="text-2xl font-bold mb-4">📅 Book New Appointment</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold mb-2">Family Member</label>
                <select
                  value={bookingPatientId}
                  onChange={(e) => setBookingPatientId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-white/20 bg-white/10 text-white focus:outline-none focus:border-white"
                  disabled={bookingInProgress}
                >
                  <option value="" className="text-gray-900">Select family member...</option>
                  {familyMembers.map((member) => (
                    <option key={member.id} value={member.id} className="text-gray-900">
                      {member.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Provider / Specialist</label>
                <select
                  value={bookingProviderId}
                  onChange={(e) => setBookingProviderId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-white/20 bg-white/10 text-white focus:outline-none focus:border-white"
                  disabled={bookingInProgress}
                >
                  <option value="" className="text-gray-900">Select provider...</option>
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
                  disabled={bookingInProgress || !bookingPatientId || !bookingProviderId}
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

        {/* Upcoming Appointments */}
        {filteredAppointments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Appointments</h2>
            <div className="space-y-3">
              {filteredAppointments.map((appt) => {
                const patient = familyMembers.find(m => m.id === appt.patient_id);
                const patientIndex = familyMembers.findIndex(m => m.id === appt.patient_id);
                const colorScheme = PATIENT_COLORS[patientIndex % PATIENT_COLORS.length];
                const appointmentDate = new Date(appt.scheduled_start);

                return (
                  <div
                    key={appt.id}
                    className={`${colorScheme.bg} border-2 ${colorScheme.border} rounded-lg p-4`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`${colorScheme.badge} px-3 py-1 rounded-full text-sm font-semibold ${colorScheme.text}`}>
                            {patient?.full_name}
                          </span>
                          {appt.confirmation_required && appt.status === 'scheduled' && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                              Needs Confirmation
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">{appt.order.title}</h3>
                        <div className="text-sm text-gray-600 mt-2 space-y-1">
                          <p>📅 {appointmentDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}</p>
                          <p>⏰ {appointmentDate.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}</p>
                          <p>📍 {appt.location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Reschedule and Cancel Buttons */}
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleRescheduleAppointment(appt.order_id, appt.patient_id, patient?.full_name || 'Patient')}
                        disabled={processingAppointment === appt.id}
                        className="px-4 py-2 bg-[#008080] text-white rounded-full font-semibold hover:bg-[#006666] transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        🔄 Reschedule
                      </button>
                      <button
                        onClick={() => handleCancelAppointment(appt.id, patient?.full_name || 'Patient')}
                        disabled={processingAppointment === appt.id}
                        className="px-4 py-2 border-2 border-red-300 text-red-700 rounded-full font-semibold hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {processingAppointment === appt.id ? '⏳ Cancelling...' : '❌ Cancel'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Orders */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Medical Orders ({filteredOrders.length})
          </h2>

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <p className="text-gray-500">No orders found for selected family member(s).</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const patient = familyMembers.find(m => m.id === order.patient_id);
                const patientIndex = familyMembers.findIndex(m => m.id === order.patient_id);
                const colorScheme = PATIENT_COLORS[patientIndex % PATIENT_COLORS.length];

                return (
                  <div
                    key={order.id}
                    className={`${colorScheme.bg} border-2 ${colorScheme.border} rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`${colorScheme.badge} px-3 py-1 rounded-full text-sm font-semibold ${colorScheme.text}`}>
                            {patient?.full_name}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getUrgencyColor(order.urgency)}`}>
                            {order.urgency.toUpperCase()}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'scheduled'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'completed'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{order.title}</h3>
                        <p className="text-gray-600 mt-1">{order.description}</p>

                        {order.provider && (
                          <p className="text-sm text-gray-500 mt-2">
                            👨‍⚕️ {order.provider.full_name} ({order.provider.specialty})
                          </p>
                        )}

                        {order.prerequisites && order.prerequisites.length > 0 && (
                          <div className="mt-3 bg-white/60 rounded-lg p-3">
                            <p className="text-sm font-semibold text-gray-700 mb-1">Prerequisites:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {order.prerequisites.map((prereq, i) => (
                                <li key={i}>• {prereq}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {order.status === 'unscheduled' && (
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => router.push(`/patient/orders/${order.id}?patientId=${order.patient_id}`)}
                          className="btn-primary"
                        >
                          🤖 Let AI Schedule This
                        </button>
                        <button
                          onClick={() => router.push(`/patient/orders/${order.id}?patientId=${order.patient_id}`)}
                          className="px-6 py-3 border-2 border-gray-300 rounded-full font-semibold hover:bg-gray-100 transition"
                        >
                          View Details
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
