'use client';

import { useState, useEffect } from 'react';
import { DaySlots, TimeSlot } from '@/lib/slot-generator';
import { formatDemoDate, formatDemoTime } from '@/lib/date-utils';

interface AvailabilityCalendarProps {
  providerId: string;
  providerName: string;
  orderDetails: {
    title: string;
    type: string;
  };
  durationMinutes?: number; // Optional duration for this specific order
  onSlotSelected: (slot: TimeSlot & { date: string }) => void;
  onClose: () => void;
}

export default function AvailabilityCalendar({
  providerId,
  providerName,
  orderDetails,
  durationMinutes = 30,
  onSlotSelected,
  onClose
}: AvailabilityCalendarProps) {
  const [slots, setSlots] = useState<DaySlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [startDate, setStartDate] = useState<string>(getDefaultStartDate());
  const [endDate, setEndDate] = useState<string>(getDefaultEndDate());
  const [timePreference, setTimePreference] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  // Load slots when filters change
  useEffect(() => {
    loadAvailableSlots();
  }, [providerId, startDate, endDate, timePreference]);

  // Subscribe to real-time appointment changes
  useEffect(() => {
    const setupRealtime = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const channel = supabase
        .channel('availability-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'appointments',
            filter: `provider_id=eq.${providerId}`
          },
          () => {
            console.log('📅 New appointment detected, refreshing slots...');
            loadAvailableSlots();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'appointments',
            filter: `provider_id=eq.${providerId}`
          },
          () => {
            console.log('📅 Appointment cancelled, refreshing slots...');
            loadAvailableSlots();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtime();
  }, [providerId]);

  const loadAvailableSlots = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        providerId,
        startDate,
        endDate,
        timePreference,
        duration: durationMinutes.toString()
      });

      const response = await fetch(`/api/appointments/available-slots?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSlots(data.availableSlots || []);
      } else {
        setError(data.error || 'Failed to load available slots');
      }
    } catch (err) {
      setError('Network error loading slots');
      console.error('Error loading slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (slot: TimeSlot, date: string) => {
    if (slot.available) {
      onSlotSelected({ ...slot, date });
    }
  };

  const totalAvailable = slots.reduce(
    (sum, day) => sum + day.slots.filter(s => s.available).length,
    0
  );

  return (
    <div className="bg-white rounded-lg">
      {/* Header */}
      <div className="border-b pb-4 mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          Finding times for: {orderDetails.title}
        </h3>
        <p className="text-gray-600">Provider: {providerName}</p>
        {!loading && (
          <p className="text-sm text-green-600 font-semibold mt-2">
            {totalAvailable} available time slots found
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
            />
          </div>
        </div>

        {/* Time Preference */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Time Preference
          </label>
          <div className="flex flex-wrap gap-2">
            {(['all', 'morning', 'afternoon', 'evening'] as const).map((pref) => (
              <button
                key={pref}
                onClick={() => setTimePreference(pref)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  timePreference === pref
                    ? 'bg-[#008080] text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pref.charAt(0).toUpperCase() + pref.slice(1)}
                {pref === 'morning' && ' (7 AM - 12 PM)'}
                {pref === 'afternoon' && ' (12 PM - 5 PM)'}
                {pref === 'evening' && ' (5 PM - 8 PM)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#008080] mb-4"></div>
          <p className="text-gray-600">Loading available times...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadAvailableSlots}
            className="mt-2 text-red-600 font-semibold hover:underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Available Slots */}
      {!loading && !error && slots.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No available time slots found in this date range.</p>
          <p className="text-sm text-gray-500">Try expanding your date range or changing time preference.</p>
        </div>
      )}

      {!loading && !error && slots.length > 0 && (
        <div className="space-y-6 max-h-[500px] overflow-y-auto">
          {slots.map((day) => (
            <div key={day.date} className="border-b pb-4 last:border-b-0">
              {/* Day Header */}
              <h4 className="text-lg font-bold text-gray-900 mb-3">
                {day.dayOfWeek}, {formatDemoDate(new Date(day.date + 'T12:00:00'))}
              </h4>

              {/* Slots Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {day.slots.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSlotClick(slot, day.date)}
                    disabled={!slot.available}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition
                      ${
                        slot.available
                          ? 'bg-green-50 border-2 border-green-500 text-green-700 hover:bg-green-100 cursor-pointer'
                          : 'bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed'
                      }
                    `}
                    title={slot.available ? `Book ${slot.time}` : slot.reason}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>

              {/* Available count for this day */}
              <p className="text-xs text-gray-500 mt-2">
                {day.slots.filter(s => s.available).length} of {day.slots.length} slots available
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      {!loading && slots.length > 0 && (
        <div className="mt-6 pt-4 border-t flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-50 border-2 border-green-500 rounded"></div>
            <span className="text-gray-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-100 border border-gray-300 rounded"></div>
            <span className="text-gray-700">Booked/Blocked</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: Get default start date (tomorrow)
function getDefaultStartDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// Helper: Get default end date (30 days from now)
function getDefaultEndDate(): string {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 31);
  return endDate.toISOString().split('T')[0];
}
