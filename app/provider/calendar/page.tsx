'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Header from '@/components/shared/Header';
import { formatDemoDateTime, formatDemoDate, formatDemoTime } from '@/lib/date-utils';

interface Appointment {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  patient: { full_name: string } | null;
  orders: { title: string } | null;
  status: string;
  location: string;
  staff_assigned: string[];
}

interface TimeBlock {
  id: string;
  provider_id: string;
  start_datetime: string;
  end_datetime: string;
  block_type: string;
  reason: string | null;
  is_active: boolean;
  affected_patients_notified: boolean;
}

type ViewType = 'day' | 'week' | 'month';

export default function ProviderCalendar() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerName, setProviderName] = useState<string>('');
  const [view, setView] = useState<ViewType>('week');
  const [showBlockedTimes, setShowBlockedTimes] = useState(false);

  // Get logged in provider from localStorage (demo mode)
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (!userData.id || userData.role !== 'provider') {
      window.location.href = '/';
      return;
    }

    setProviderId(userData.id);
    setProviderName(userData.name || 'Provider');
  }, []);

  // Calculate week boundaries
  const getWeekBoundaries = (date: Date) => {
    const start = new Date(date);
    // Set to Monday of the current week
    const dayOfWeek = start.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday (0)
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 4); // Friday
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  // Calculate day boundaries
  const getDayBoundaries = (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  // Calculate month boundaries
  const getMonthBoundaries = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    return { start, end };
  };

  const loadAppointments = async () => {
    if (!providerId) return;

    setLoading(true);

    let start: Date, end: Date;
    if (view === 'day') {
      ({ start, end } = getDayBoundaries(currentDate));
    } else if (view === 'week') {
      ({ start, end } = getWeekBoundaries(currentWeek));
    } else {
      ({ start, end } = getMonthBoundaries(currentDate));
    }

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_start,
        scheduled_end,
        status,
        location,
        staff_assigned,
        patient:users!patient_id(full_name),
        orders(title)
      `)
      .eq('provider_id', providerId)
      .gte('scheduled_start', start.toISOString())
      .lte('scheduled_start', end.toISOString())
      .order('scheduled_start', { ascending: true });

    console.log('📅 Calendar Query:', {
      providerId,
      view,
      dateRange: `${start.toISOString()} to ${end.toISOString()}`,
      appointmentsFound: data?.length || 0,
      appointments: data
    });

    if (error) {
      console.error('❌ Error loading appointments:', error);
    }

    if (data) {
      setAppointments(data as any);
    }
    setLoading(false);
  };

  const loadTimeBlocks = async () => {
    if (!providerId) return;

    try {
      const response = await fetch(`/api/provider/block-time?providerId=${providerId}`);
      const data = await response.json();

      if (data.timeBlocks) {
        console.log('Loaded time blocks:', data.timeBlocks.length, data.timeBlocks);
        setTimeBlocks(data.timeBlocks);
      } else {
        console.log('No time blocks found');
        setTimeBlocks([]);
      }
    } catch (error) {
      console.error('Error loading time blocks:', error);
    }
  };

  const handleDeleteTimeBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to remove this blocked time period?')) {
      return;
    }

    try {
      const response = await fetch(`/api/provider/block-time?blockId=${blockId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Blocked time removed successfully!');
        loadTimeBlocks();
      } else {
        alert('Failed to remove blocked time');
      }
    } catch (error) {
      console.error('Error deleting time block:', error);
      alert('Error removing blocked time');
    }
  };

  useEffect(() => {
    if (providerId) {
      loadAppointments();
      loadTimeBlocks();
    }
  }, [currentWeek, currentDate, providerId, view]);

  // Subscribe to real-time appointment updates
  useEffect(() => {
    if (!providerId) return;

    const channel = supabase
      .channel('calendar-appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `provider_id=eq.${providerId}`,
        },
        () => {
          loadAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [providerId]);

  // Subscribe to real-time time block updates
  useEffect(() => {
    if (!providerId) return;

    const channel = supabase
      .channel('calendar-time-blocks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'provider_time_blocks',
          filter: `provider_id=eq.${providerId}`,
        },
        () => {
          console.log('Time block updated, reloading...');
          loadTimeBlocks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [providerId]);

  // Generate time slots (8am - 6pm in 30-min intervals)
  const timeSlots = [];
  for (let hour = 8; hour <= 18; hour++) {
    for (let min of [0, 30]) {
      if (hour === 18 && min === 30) break;
      timeSlots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }
  }

  // Generate weekdays
  const { start: weekStart } = getWeekBoundaries(currentWeek);
  const weekdays: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    weekdays.push(day);
  }

  // Function to get appointments for a specific day/time slot
  const getAppointmentForSlot = (day: Date, time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const slotTime = new Date(day);
    slotTime.setHours(hour, minute, 0, 0);

    return appointments.find(apt => {
      const aptStart = new Date(apt.scheduled_start);
      return (
        aptStart.getFullYear() === slotTime.getFullYear() &&
        aptStart.getMonth() === slotTime.getMonth() &&
        aptStart.getDate() === slotTime.getDate() &&
        aptStart.getHours() === slotTime.getHours() &&
        aptStart.getMinutes() === slotTime.getMinutes()
      );
    });
  };

  // Function to check if a time slot is blocked
  const isSlotBlocked = (day: Date, time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const slotTime = new Date(day);
    slotTime.setHours(hour, minute, 0, 0);
    const slotEnd = new Date(slotTime);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30); // 30-minute slots

    const blocked = timeBlocks.some(block => {
      const blockStart = new Date(block.start_datetime);
      const blockEnd = new Date(block.end_datetime);

      // Check if the slot overlaps with the blocked time
      const overlaps = slotTime < blockEnd && slotEnd > blockStart;

      if (overlaps) {
        console.log('Slot blocked:', {
          slot: `${slotTime.toLocaleString()} - ${slotEnd.toLocaleString()}`,
          block: `${blockStart.toLocaleString()} - ${blockEnd.toLocaleString()}`,
          blockType: block.block_type
        });
      }

      return overlaps;
    });

    return blocked;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const goToPrevious = () => {
    if (view === 'day') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
    } else if (view === 'week') {
      const newWeek = new Date(currentWeek);
      newWeek.setDate(newWeek.getDate() - 7);
      setCurrentWeek(newWeek);
    } else {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentDate(newDate);
    }
  };

  const goToNext = () => {
    if (view === 'day') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    } else if (view === 'week') {
      const newWeek = new Date(currentWeek);
      newWeek.setDate(newWeek.getDate() + 7);
      setCurrentWeek(newWeek);
    } else {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentWeek(today);
    setCurrentDate(today);
  };

  if (loading || !providerId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#008080] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getHeaderSubtitle = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } else if (view === 'week') {
      const { start: weekStart } = getWeekBoundaries(currentWeek);
      const weekdays: Date[] = [];
      for (let i = 0; i < 5; i++) {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + i);
        weekdays.push(day);
      }
      return `Week of ${formatDate(weekStart)} - ${formatDate(weekdays[4])}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  // Check if there are any blocked times in the current view
  const getBlockedTimesInView = () => {
    let start: Date, end: Date;
    if (view === 'day') {
      ({ start, end } = getDayBoundaries(currentDate));
    } else if (view === 'week') {
      ({ start, end } = getWeekBoundaries(currentWeek));
    } else {
      ({ start, end } = getMonthBoundaries(currentDate));
    }

    return timeBlocks.filter(block => {
      const blockStart = new Date(block.start_datetime);
      const blockEnd = new Date(block.end_datetime);
      // Check if block overlaps with current view
      return blockStart <= end && blockEnd >= start;
    });
  };

  const blockedTimesInView = getBlockedTimesInView();

  const getNavigationLabel = () => {
    if (view === 'day') return 'Day';
    if (view === 'week') return 'Week';
    return 'Month';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={`${providerName}'s Calendar`}
        subtitle={getHeaderSubtitle()}
      />

      <main className="max-w-7xl mx-auto p-8">
        {/* View Toggle */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() => setView('day')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              view === 'day'
                ? 'bg-[#008080] text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              view === 'week'
                ? 'bg-[#008080] text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView('month')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              view === 'month'
                ? 'bg-[#008080] text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Month
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPrevious}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700"
          >
            ← Previous {getNavigationLabel()}
          </button>

          <button
            onClick={goToToday}
            className="px-6 py-2 bg-[#008080] text-white rounded-lg hover:bg-[#006666] transition font-medium"
          >
            Today
          </button>

          <button
            onClick={goToNext}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700"
          >
            Next {getNavigationLabel()} →
          </button>
        </div>

        {/* Blocked Time Alert */}
        {blockedTimesInView.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-start">
              <span className="text-2xl mr-3">🚫</span>
              <div className="flex-1">
                <h4 className="font-bold text-red-900 mb-2">Blocked Time in This {view === 'day' ? 'Day' : view === 'week' ? 'Week' : 'Month'}</h4>
                <div className="space-y-2">
                  {blockedTimesInView.map((block) => (
                    <div key={block.id} className="text-sm text-red-800">
                      <span className="font-semibold">
                        {block.block_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}:
                      </span>{' '}
                      {formatDemoDate(block.start_datetime)} {formatDemoTime(block.start_datetime)} - {formatDemoDate(block.end_datetime)} {formatDemoTime(block.end_datetime)}
                      {block.reason && <span className="italic"> ({block.reason})</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <Card>
          <div className="overflow-x-auto">
            {/* Day View */}
            {view === 'day' && (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-[#002C5F] to-[#008080]">
                    <th className="border border-gray-300 p-3 w-32 text-white font-semibold">Time</th>
                    <th className="border border-gray-300 p-3 text-white">
                      <div className="font-bold text-lg">
                        {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                      </div>
                      <div className={`text-sm ${isToday(currentDate) ? 'bg-yellow-400 text-gray-900 px-2 py-1 rounded-full inline-block mt-1 font-bold' : 'text-gray-200'}`}>
                        {formatDate(currentDate)}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(time => {
                    const appointment = getAppointmentForSlot(currentDate, time);
                    const isBlocked = isSlotBlocked(currentDate, time);

                    return (
                      <tr key={time} className="hover:bg-gray-50 transition">
                        <td className="border border-gray-300 p-3 text-sm text-gray-600 text-right pr-4 font-medium bg-gray-50">
                          {time}
                        </td>
                        <td className="border border-gray-300 p-2 h-20 align-top">
                          {isBlocked && !appointment && (
                            <div className="p-3 rounded-md text-sm h-full bg-red-100 border-l-4 border-red-500">
                              <div className="font-semibold text-red-900">
                                🚫 Blocked
                              </div>
                              <div className="text-xs text-red-700 mt-1">
                                Unavailable
                              </div>
                            </div>
                          )}
                          {appointment && (
                            <div className={`p-3 rounded-md text-sm h-full ${
                              appointment.status === 'confirmed'
                                ? 'bg-green-50 border-l-4 border-green-500'
                                : appointment.status === 'scheduled'
                                ? 'bg-yellow-50 border-l-4 border-yellow-500'
                                : appointment.status === 'cancelled'
                                ? 'bg-gray-100 border-l-4 border-gray-400'
                                : 'bg-blue-50 border-l-4 border-blue-500'
                            }`}>
                              <div className="font-semibold text-gray-900">
                                {appointment.patient?.full_name || 'Unknown Patient'}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {appointment.orders?.title || 'Appointment'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {appointment.location}
                              </div>
                              {appointment.status === 'scheduled' && (
                                <div className="text-xs text-yellow-700 mt-1 font-medium">
                                  ⚠ Needs Confirmation
                                </div>
                              )}
                              {appointment.status === 'confirmed' && (
                                <div className="text-xs text-green-700 mt-1">
                                  ✓ Confirmed
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Week View */}
            {view === 'week' && (
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gradient-to-r from-[#002C5F] to-[#008080]">
                    <th className="border border-gray-300 p-3 w-24 text-white font-semibold">Time</th>
                    {weekdays.map((day, idx) => (
                      <th key={idx} className="border border-gray-300 p-3 text-white">
                        <div className="font-bold text-lg">
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={`text-sm ${isToday(day) ? 'bg-yellow-400 text-gray-900 px-2 py-1 rounded-full inline-block mt-1 font-bold' : 'text-gray-200'}`}>
                          {formatDate(day)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(time => (
                    <tr key={time} className="hover:bg-gray-50 transition">
                      <td className="border border-gray-300 p-2 text-sm text-gray-600 text-right pr-3 font-medium bg-gray-50">
                        {time}
                      </td>
                      {weekdays.map((day, dayIdx) => {
                        const appointment = getAppointmentForSlot(day, time);
                        const isBlocked = isSlotBlocked(day, time);

                        return (
                          <td key={dayIdx} className="border border-gray-300 p-1 h-20 align-top">
                            {isBlocked && !appointment && (
                              <div className="p-2 rounded-md text-sm h-full bg-red-100 border-l-4 border-red-500">
                                <div className="font-semibold text-red-900 truncate text-xs">
                                  🚫 Blocked
                                </div>
                              </div>
                            )}
                            {appointment && (
                              <div className={`p-2 rounded-md text-sm h-full ${
                                appointment.status === 'confirmed'
                                  ? 'bg-green-50 border-l-4 border-green-500'
                                  : appointment.status === 'scheduled'
                                  ? 'bg-yellow-50 border-l-4 border-yellow-500'
                                  : appointment.status === 'cancelled'
                                  ? 'bg-gray-100 border-l-4 border-gray-400'
                                  : 'bg-blue-50 border-l-4 border-blue-500'
                              }`}>
                                <div className="font-semibold text-gray-900 truncate">
                                  {appointment.patient?.full_name || 'Unknown Patient'}
                                </div>
                                <div className="text-xs text-gray-600 truncate mt-1">
                                  {appointment.orders?.title || 'Appointment'}
                                </div>
                                {appointment.status === 'scheduled' && (
                                  <div className="text-xs text-yellow-700 mt-1 font-medium">
                                    ⚠ Needs Confirmation
                                  </div>
                                )}
                                {appointment.status === 'confirmed' && (
                                  <div className="text-xs text-green-700 mt-1">
                                    ✓ Confirmed
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Month View */}
            {view === 'month' && (
              <div className="p-4">
                {(() => {
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth();
                  const firstDay = new Date(year, month, 1);
                  const lastDay = new Date(year, month + 1, 0);
                  const daysInMonth = lastDay.getDate();
                  const startDayOfWeek = firstDay.getDay();

                  const weeks: Date[][] = [];
                  let currentWeekDays: Date[] = [];

                  // Add empty cells for days before the month starts
                  for (let i = 0; i < startDayOfWeek; i++) {
                    const emptyDate = new Date(year, month, -(startDayOfWeek - i - 1));
                    currentWeekDays.push(emptyDate);
                  }

                  // Add all days of the month
                  for (let day = 1; day <= daysInMonth; day++) {
                    currentWeekDays.push(new Date(year, month, day));
                    if (currentWeekDays.length === 7) {
                      weeks.push(currentWeekDays);
                      currentWeekDays = [];
                    }
                  }

                  // Add remaining days to complete the last week
                  if (currentWeekDays.length > 0) {
                    while (currentWeekDays.length < 7) {
                      const lastDate = currentWeekDays[currentWeekDays.length - 1];
                      currentWeekDays.push(new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + 1));
                    }
                    weeks.push(currentWeekDays);
                  }

                  return (
                    <div>
                      <div className="grid grid-cols-7 gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center font-bold text-gray-700 p-2 bg-gradient-to-r from-[#002C5F] to-[#008080] text-white rounded-t">
                            {day}
                          </div>
                        ))}
                      </div>

                      {weeks.map((week, weekIdx) => (
                        <div key={weekIdx} className="grid grid-cols-7 gap-2 mt-2">
                          {week.map((date, dayIdx) => {
                            const isCurrentMonth = date.getMonth() === month;
                            const dayAppointments = appointments.filter(apt => {
                              const aptDate = new Date(apt.scheduled_start);
                              return (
                                aptDate.getDate() === date.getDate() &&
                                aptDate.getMonth() === date.getMonth() &&
                                aptDate.getFullYear() === date.getFullYear()
                              );
                            });

                            return (
                              <div
                                key={dayIdx}
                                className={`min-h-[100px] border rounded p-2 ${
                                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                                } ${isToday(date) ? 'border-2 border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
                              >
                                <div className={`text-sm font-semibold ${
                                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                                } ${isToday(date) ? 'text-yellow-800 bg-yellow-200 rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                                  {date.getDate()}
                                </div>
                                <div className="mt-1 space-y-1">
                                  {dayAppointments.slice(0, 3).map(apt => (
                                    <div
                                      key={apt.id}
                                      className={`text-xs p-1 rounded truncate ${
                                        apt.status === 'confirmed'
                                          ? 'bg-green-100 text-green-800'
                                          : apt.status === 'scheduled'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-gray-100 text-gray-600'
                                      }`}
                                      title={`${new Date(apt.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${apt.patient?.full_name}`}
                                    >
                                      {new Date(apt.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </div>
                                  ))}
                                  {dayAppointments.length > 3 && (
                                    <div className="text-xs text-gray-500 font-medium">
                                      +{dayAppointments.length - 3} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </Card>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-50 border-l-4 border-green-500 rounded"></div>
            <span className="text-gray-700 font-medium">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-50 border-l-4 border-yellow-500 rounded"></div>
            <span className="text-gray-700 font-medium">Awaiting Confirmation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-100 border-l-4 border-gray-400 rounded"></div>
            <span className="text-gray-700 font-medium">Cancelled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-100 border-l-4 border-red-500 rounded"></div>
            <span className="text-gray-700 font-medium">Blocked Time</span>
          </div>
        </div>

        {/* Blocked Times List */}
        {timeBlocks.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Your Blocked Time Periods</h3>
              <button
                onClick={() => setShowBlockedTimes(!showBlockedTimes)}
                className="text-[#008080] hover:text-[#006666] font-medium"
              >
                {showBlockedTimes ? 'Hide' : 'Show'} ({timeBlocks.length})
              </button>
            </div>

            {showBlockedTimes && (
              <Card>
                <div className="space-y-3">
                  {timeBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="flex items-start justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-red-900">
                            🚫 {block.block_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">From:</span> {formatDemoDateTime(block.start_datetime)}
                        </div>
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">To:</span> {formatDemoDateTime(block.end_datetime)}
                        </div>
                        {block.reason && (
                          <div className="text-sm text-gray-600 mt-2 italic">
                            Reason: {block.reason}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteTimeBlock(block.id)}
                        className="ml-4 px-3 py-1 text-sm bg-white border border-red-300 text-red-700 rounded hover:bg-red-50 transition font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Summary Stats */}
        <Card className="mt-6">
          <h3 className="font-bold text-lg mb-4 text-gray-900">This Week Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-[#008080] to-[#006666] p-4 rounded-lg text-white">
              <div className="text-3xl font-bold">
                {appointments.filter(a => a.status !== 'cancelled').length}
              </div>
              <div className="text-sm mt-1 opacity-90">Total Appointments</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg text-white">
              <div className="text-3xl font-bold">
                {appointments.filter(a => a.status === 'confirmed').length}
              </div>
              <div className="text-sm mt-1 opacity-90">Confirmed</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-4 rounded-lg text-white">
              <div className="text-3xl font-bold">
                {appointments.filter(a => a.status === 'scheduled').length}
              </div>
              <div className="text-sm mt-1 opacity-90">Pending Confirmation</div>
            </div>
            <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-4 rounded-lg text-white">
              <div className="text-3xl font-bold">
                {appointments.filter(a => a.status === 'cancelled').length}
              </div>
              <div className="text-sm mt-1 opacity-90">Cancelled</div>
            </div>
          </div>
        </Card>

        {/* Back to Dashboard */}
        <div className="mt-6 text-center">
          <a
            href="/provider"
            className="inline-block px-6 py-3 bg-white border-2 border-[#008080] text-[#008080] rounded-lg hover:bg-[#008080] hover:text-white transition font-medium"
          >
            ← Back to Dashboard
          </a>
        </div>
      </main>
    </div>
  );
}
