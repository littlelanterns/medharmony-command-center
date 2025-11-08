'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [schedulingMode, setSchedulingMode] = useState(false);
  const [aiOptions, setAiOptions] = useState<any>(null);
  const [generatingOptions, setGeneratingOptions] = useState(false);
  const [bookingAppointment, setBookingAppointment] = useState(false);
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

  const handleAISchedule = async () => {
    setGeneratingOptions(true);
    setSchedulingMode(true);

    try {
      const response = await fetch('/api/ai/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          patientId: user.id,
          orderDetails: {
            type: order.order_type,
            title: order.title,
            priority: order.priority,
          },
          prerequisites: order.prerequisites || [],
        }),
      });

      const data = await response.json();

      if (data.options) {
        setAiOptions(data);
      } else {
        alert('Failed to generate options: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('AI scheduling error:', error);
      alert('Failed to generate scheduling options');
    } finally {
      setGeneratingOptions(false);
    }
  };

  const handleBookOption = async (option: any) => {
    setBookingAppointment(true);

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
        alert('Appointment scheduled successfully! You earned +' + option.karmaBonus + ' karma points.');
        router.push('/patient');
      } else {
        alert('Error booking appointment: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to book appointment');
    } finally {
      setBookingAppointment(false);
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
      <header className="bg-[#002C5F] text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/patient')}
            className="text-white/80 hover:text-white mb-2 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">{order.title}</h1>
          <p className="text-white/80 mt-1">Order from {order.provider?.full_name || 'Your Provider'}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-8">
        {/* Order Status Card */}
        <div className={`rounded-xl shadow-lg p-6 mb-6 ${
          isScheduled ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
        }`}>
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
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
              order.priority === 'stat' ? 'bg-red-200 text-red-900' :
              order.priority === 'urgent' ? 'bg-orange-200 text-orange-900' :
              'bg-gray-200 text-gray-700'
            }`}>
              {order.priority.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
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
        </div>

        {/* Prerequisites */}
        {order.prerequisites && order.prerequisites.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Prerequisites</h3>
            <div className="space-y-3">
              {order.prerequisites.map((prereq: any) => (
                <div key={prereq.id} className="flex items-start p-3 bg-blue-50 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-800">{prereq.description}</div>
                    <div className="text-sm text-gray-600">Type: {prereq.prerequisite_type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appointment Details (if scheduled) */}
        {isScheduled && order.appointments && order.appointments.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Appointment Details</h3>
            {order.appointments.map((appt: any) => (
              <div key={appt.id} className="space-y-3">
                <div className="flex items-center text-lg">
                  <svg className="w-6 h-6 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">{new Date(appt.scheduled_start).toLocaleString()}</span>
                </div>
                <div className="flex items-center text-lg">
                  <svg className="w-6 h-6 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{appt.location}</span>
                </div>
                {appt.staff_assigned && (
                  <div className="flex items-center text-lg">
                    <svg className="w-6 h-6 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>{appt.staff_assigned}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* AI Scheduling Section */}
        {!isScheduled && !schedulingMode && (
          <div className="bg-gradient-to-r from-[#002C5F] to-[#008080] rounded-xl shadow-lg p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Let AI Find the Perfect Time</h3>
            <p className="mb-6 text-white/90">
              Our AI will analyze your availability preferences and find the 3 best appointment options for you in seconds.
            </p>
            <button
              onClick={handleAISchedule}
              disabled={generatingOptions}
              className="btn-primary bg-white text-[#002C5F] hover:bg-gray-100"
            >
              {generatingOptions ? 'Finding Best Times...' : '🤖 Let AI Schedule This'}
            </button>
          </div>
        )}

        {/* AI Options Display */}
        {schedulingMode && generatingOptions && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#008080] mb-4"></div>
              <h3 className="text-xl font-semibold mb-4">🤖 AI Scheduling Agent Working...</h3>
              <div className="space-y-2 text-gray-600">
                <p>✓ Analyzing your availability preferences</p>
                <p>✓ Checking provider schedules at 3 lab locations</p>
                <p>✓ Matching prerequisites with time slots</p>
                <p>✓ Optimizing for your morning preference</p>
              </div>
            </div>
          </div>
        )}

        {schedulingMode && !generatingOptions && aiOptions && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center mb-6">Choose Your Preferred Time</h3>

            {aiOptions.options.map((option: any, index: number) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-green-100 text-green-700' :
                      index === 1 ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {index === 0 ? '⭐ RECOMMENDED' :
                       index === 1 ? 'CONVENIENT' : 'FLEXIBLE'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[#50C878]">
                    +{option.karmaBonus} Karma Points
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-lg">
                    <svg className="w-6 h-6 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span className="font-bold">{new Date(option.datetime).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>{option.location}</span>
                  </div>
                  {option.staffAssigned && (
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span>{option.staffAssigned}</span>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="font-semibold text-gray-700 mb-2">Why this works:</div>
                  <p className="text-gray-600">{option.reasoning}</p>
                </div>

                {option.prerequisiteTimeline && option.prerequisiteTimeline.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="font-semibold text-blue-800 mb-2">Automatic Reminders:</div>
                    <div className="space-y-2">
                      {option.prerequisiteTimeline.map((item: any, i: number) => (
                        <div key={i} className="text-sm text-blue-700">
                          • {item.when}: {item.description}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleBookOption(option)}
                  disabled={bookingAppointment}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {bookingAppointment ? 'Booking...' : `Book This Time (+${option.karmaBonus} Karma)`}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
