'use client';
import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { AIScheduleOption } from '@/lib/types';

interface AISchedulerProps {
  orderId: string;
  userId: string;
  orderDetails: {
    type: string;
    title: string;
    priority: string;
  };
  prerequisites: any[];
  onOptionSelected: (option: AIScheduleOption) => void;
  autoRun?: boolean; // Auto-trigger scheduling on mount
}

export default function AIScheduler({
  orderId,
  userId,
  orderDetails,
  prerequisites,
  onOptionSelected,
  autoRun = false,
}: AISchedulerProps) {
  const [schedulingMode, setSchedulingMode] = useState(autoRun);
  const [aiOptions, setAiOptions] = useState<AIScheduleOption[] | null>(null);
  const [generatingOptions, setGeneratingOptions] = useState(false);
  const [bookingAppointment, setBookingAppointment] = useState(false);

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
                <span className="font-bold">{new Date(option.datetime).toLocaleString()}</span>
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
      </div>
    );
  }

  return null;
}
