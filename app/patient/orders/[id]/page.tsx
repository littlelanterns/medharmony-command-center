'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  const orderId = params.id as string;

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
        alert(
          'Appointment scheduled successfully! You earned +' + option.karmaBonus + ' karma points.'
        );
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
              <h3 className="text-xl font-bold mb-4">Appointment Details</h3>
              {order.appointments.map((appt: any) => (
                <AppointmentCard key={appt.id} appointment={appt} showTitle={false} />
              ))}
            </Card>
          </div>
        )}

        {/* AI Scheduling Section */}
        {!isScheduled && (
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
          />
        )}
      </main>
    </div>
  );
}
