'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Header from '@/components/shared/Header';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/shared/StatusBadge';
import AIScheduler from '@/components/patient/AIScheduler';
import PrerequisiteChecklist from '@/components/patient/PrerequisiteChecklist';
import AppointmentCard from '@/components/patient/AppointmentCard';
import { AIScheduleOption } from '@/lib/types';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const autoSchedule = searchParams.get('autoSchedule') === 'true';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setUser(userData);
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        prerequisites(*),
        provider:users!orders_provider_id_fkey(full_name),
        appointments(*)
      `)
      .eq('id', orderId)
      .single();

    if (data) setOrder(data);
    setLoading(false);
  };

  const handleBookOption = async (option: AIScheduleOption) => {
    try {
      // Check if there's an existing appointment
      const existingAppointment = order.appointments?.find(
        (apt: any) => apt.status === 'scheduled' || apt.status === 'confirmed'
      );

      if (existingAppointment) {
        const oldApptTime = new Date(existingAppointment.scheduled_start).toLocaleString();
        const newApptTime = new Date(option.datetime).toLocaleString();

        const confirmed = window.confirm(
          `⚠️ RESCHEDULE CONFIRMATION\n\n` +
          `Your current appointment:\n${oldApptTime}\n\n` +
          `Will be AUTOMATICALLY CANCELLED and replaced with:\n${newApptTime}\n\n` +
          `Karma will be adjusted based on how much notice you're giving.\n\n` +
          `Do you want to proceed?`
        );

        if (!confirmed) {
          return; // User cancelled the reschedule
        }
      }

      // Calculate appointment end time (30 minutes after start)
      const startTime = new Date(option.datetime);
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          patientId: user.id,
          providerId: order.provider_id,
          scheduledStart: option.datetime,
          scheduledEnd: endTime.toISOString(),
          location: option.location,
          staffAssigned: option.staffAssigned,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const message = existingAppointment
          ? 'Appointment rescheduled successfully! Karma has been adjusted.'
          : `Appointment scheduled successfully! You earned +${option.karmaBonus} karma points.`;
        alert(message);
        router.push('/patient');
      } else {
        alert('Error booking appointment: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to book appointment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Order not found</div>
      </div>
    );
  }

  const isScheduled = order.status === 'scheduled' || order.status === 'completed';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={order.title}
        subtitle={`Order from ${order.provider?.full_name || 'Your Provider'}`}
        backButton={{
          label: 'Back to Dashboard',
          href: '/patient',
        }}
      />

      <main className="max-w-4xl mx-auto p-8">
        {/* Order Status Card */}
        <Card
          className={`mb-6 ${
            isScheduled ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className={`text-2xl font-bold mb-2 ${isScheduled ? 'text-green-800' : 'text-red-800'}`}>
                {isScheduled ? '✅ Appointment Scheduled' : '🔴 Needs Scheduling'}
              </h2>
              <p className={isScheduled ? 'text-green-700' : 'text-red-700'}>
                {isScheduled
                  ? 'Your appointment has been scheduled. Details below.'
                  : 'This order requires scheduling. Use the AI scheduler below to find the best time.'}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                order.priority === 'stat'
                  ? 'bg-red-200 text-red-900'
                  : order.priority === 'urgent'
                  ? 'bg-orange-200 text-orange-900'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {order.priority.toUpperCase()}
            </span>
          </div>
        </Card>

        {/* Order Details */}
        <Card className="mb-6">
          <h3 className="text-xl font-bold mb-4">Order Details</h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-semibold">{order.order_type}</span>
            </div>
            {order.description && (
              <div>
                <span className="text-gray-600">Description:</span>
                <p className="mt-1 text-gray-800">{order.description}</p>
              </div>
            )}
            <div>
              <span className="text-gray-600">Created:</span>
              <span className="ml-2">{new Date(order.created_at).toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Prerequisites */}
        {order.prerequisites && order.prerequisites.length > 0 && (
          <div className="mb-6">
            <PrerequisiteChecklist prerequisites={order.prerequisites} />
          </div>
        )}

        {/* Appointment Details (if scheduled) */}
        {isScheduled && order.appointments && order.appointments.length > 0 && (
          <div className="mb-6">
            <Card>
              <h3 className="text-xl font-bold mb-4">Current Appointment</h3>
              {order.appointments
                .filter((appt: any) => appt.status === 'scheduled' || appt.status === 'confirmed')
                .map((appt: any) => (
                  <AppointmentCard key={appt.id} appointment={appt} showTitle={false} />
                ))}
            </Card>
          </div>
        )}

        {/* Reschedule Warning Banner */}
        {isScheduled && order.appointments?.some((apt: any) => apt.status === 'scheduled' || apt.status === 'confirmed') && (
          <div className="mb-6 bg-orange-50 border-2 border-orange-300 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <span className="text-3xl">⚠️</span>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-orange-900 mb-2">Rescheduling Mode</h3>
                <p className="text-orange-800 mb-3">
                  You already have an appointment scheduled. If you select a new time below, your current appointment will be <strong>automatically cancelled</strong> and replaced with the new time.
                </p>
                <p className="text-orange-700 text-sm">
                  ✓ Karma will be adjusted based on how much notice you're giving<br/>
                  ✓ You'll be asked to confirm before the change is finalized<br/>
                  ✓ Your current appointment remains until you book a new one
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI Scheduling Section - Always show for easy rescheduling */}
        <AIScheduler
          orderId={order.id}
          userId={user.id}
          orderDetails={{
            type: order.order_type,
            title: order.title,
            priority: order.priority,
          }}
          prerequisites={order.prerequisites || []}
          onOptionSelected={handleBookOption}
          autoRun={autoSchedule}
        />
      </main>
    </div>
  );
}
