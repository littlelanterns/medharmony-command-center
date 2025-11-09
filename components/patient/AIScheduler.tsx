'use client';
import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { AIScheduleOption } from '@/lib/types';
import { formatDemoDateTime } from '@/lib/date-utils';
import AvailabilityCalendar from '@/components/patient/AvailabilityCalendar';
import { TimeSlot } from '@/lib/slot-generator';

interface AISchedulerProps {
  orderId: string;
  userId: string;
  orderDetails: {
    type: string;
    title: string;
    priority: string;
  };
  durationMinutes?: number; // Appointment duration for this order
  prerequisites: any[];
  onOptionSelected: (option: AIScheduleOption) => void;
  autoRun?: boolean; // Auto-trigger scheduling on mount
}

export default function AIScheduler({
  orderId,
  userId,
  orderDetails,
  durationMinutes = 30,
  prerequisites,
  onOptionSelected,
  autoRun = false,
}: AISchedulerProps) {
  const [schedulingMode, setSchedulingMode] = useState(autoRun);
  const [aiOptions, setAiOptions] = useState<AIScheduleOption[] | null>(null);
  const [generatingOptions, setGeneratingOptions] = useState(false);
  const [bookingAppointment, setBookingAppointment] = useState(false);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [providerInfo, setProviderInfo] = useState<{ id: string; name: string } | null>(null);

  // Auto-trigger AI scheduling if autoRun is true (reschedule scenario)
  useEffect(() => {
    if (autoRun && !aiOptions && !generatingOptions) {
      handleAISchedule();
    }
  }, [autoRun]);

  const handleAISchedule = async () => {
    setGeneratingOptions(true);
    setSchedulingMode(true);

    try {
      const response = await fetch('/api/ai/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          patientId: userId,
          orderDetails,
          prerequisites,
        }),
      });

      const data = await response.json();

      if (data.options) {
        setAiOptions(data.options);
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

  const handleBookOption = async (option: AIScheduleOption) => {
    setBookingAppointment(true);
    await onOptionSelected(option);
    setBookingAppointment(false);
  };

  // Fetch provider info when opening availability calendar
  const handleShowCalendar = async () => {
    try {
      // Fetch order to get provider info
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data: order } = await supabase
        .from('orders')
        .select('provider_id, provider:users!orders_provider_id_fkey(full_name)')
        .eq('id', orderId)
        .single();

      if (order) {
        setProviderInfo({
          id: order.provider_id,
          name: (order as any).provider?.full_name || 'Provider'
        });
        setShowFullCalendar(true);
      } else {
        alert('Could not load provider information');
      }
    } catch (error) {
      console.error('Error loading provider:', error);
      alert('Error loading availability calendar');
    }
  };

  // Handle slot selection from availability calendar
  const handleSlotSelected = async (slot: TimeSlot & { date: string }) => {
    const option: AIScheduleOption = {
      rank: 1,
      datetime: slot.datetime,
      location: slot.location || 'Medical Center',
      staffAssigned: slot.staffAssigned?.join(', ') || '',
      reasoning: 'Selected from available times',
      karmaBonus: 5,
      travelTimeMinutes: 15,
      prerequisiteTimeline: [],
      reminders: []
    };

    setShowFullCalendar(false);
    await handleBookOption(option);
  };

  // Initial state - show AI prompt
  if (!schedulingMode) {
    return (
      <Card className="bg-gradient-to-r from-[#002C5F] to-[#008080] text-white text-center">
        <h3 className="text-2xl font-bold mb-4">Let AI Find the Perfect Time</h3>
        <p className="mb-6 text-white/90">
          Our AI will analyze your availability preferences and find the 3 best appointment options for
          you in seconds.
        </p>
        <Button
          onClick={handleAISchedule}
          disabled={generatingOptions}
          variant="secondary"
        >
          {generatingOptions ? 'Finding Best Times...' : '🤖 Let AI Schedule This'}
        </Button>
      </Card>
    );
  }

  // Loading state
  if (generatingOptions) {
    return (
      <Card>
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
      </Card>
    );
  }

  // Display options
  if (aiOptions && aiOptions.length > 0) {
    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-center mb-6">Choose Your Preferred Time</h3>

        {aiOptions.map((option, index) => (
          <Card key={index} hoverable>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    index === 0
                      ? 'bg-green-100 text-green-700'
                      : index === 1
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {index === 0 ? '⭐ RECOMMENDED' : index === 1 ? 'CONVENIENT' : 'FLEXIBLE'}
                </span>
              </div>
              <span className="text-sm font-semibold text-[#50C878]">
                +{option.karmaBonus} Karma Points
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center text-lg">
                <svg className="w-6 h-6 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-bold">{formatDemoDateTime(option.datetime)}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{option.location}</span>
              </div>
              {option.staffAssigned && (
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
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
                  {option.prerequisiteTimeline.map((item, i) => (
                    <div key={i} className="text-sm text-blue-700">
                      • {item.when}: {item.description}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => handleBookOption(option)}
              disabled={bookingAppointment}
              fullWidth
            >
              {bookingAppointment ? 'Booking...' : `Book This Time (+${option.karmaBonus} Karma)`}
            </Button>
          </Card>
        ))}

        {/* See More Availability Button */}
        <div className="mt-8 text-center border-t pt-6">
          <p className="text-gray-600 mb-4">Don't see a time that works?</p>
          <button
            onClick={handleShowCalendar}
            className="text-[#008080] font-semibold text-lg hover:text-[#006666] transition inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            See All Available Times
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Full Availability Calendar Modal */}
        {showFullCalendar && providerInfo && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">All Available Times</h2>
                <button
                  onClick={() => setShowFullCalendar(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <AvailabilityCalendar
                providerId={providerInfo.id}
                providerName={providerInfo.name}
                orderDetails={orderDetails}
                durationMinutes={durationMinutes}
                onSlotSelected={handleSlotSelected}
                onClose={() => setShowFullCalendar(false)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
