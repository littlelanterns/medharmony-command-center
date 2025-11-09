/**
 * Appointment Slot Generator
 *
 * Generates available time slots for providers based on:
 * - Provider schedules (when they work)
 * - Blocked time (vacation, sick days, etc.)
 * - Existing appointments (what's already booked)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface TimeSlot {
  time: string;              // "09:00"
  datetime: string;          // "2025-11-18T09:00:00-06:00"
  available: boolean;
  reason?: string;           // If not available: "Booked", "Blocked", etc.
  location?: string;
  staffAssigned?: string[];
}

export interface DaySlots {
  date: string;              // "2025-11-18"
  dayOfWeek: string;         // "Monday"
  slots: TimeSlot[];
}

export interface AvailableSlotsResult {
  availableSlots: DaySlots[];
  metadata: {
    totalSlotsFound: number;
    totalSlotsAvailable: number;
    dateRange: string;
    providerName?: string;
    providerSpecialty?: string;
  };
}

export type TimePreference = 'morning' | 'afternoon' | 'evening' | 'all';

interface GenerateAvailableSlotsParams {
  providerId: string;
  startDate: Date;
  endDate: Date;
  appointmentDuration?: number; // minutes, default 30
  timePreference?: TimePreference;
}

/**
 * Main function to generate available appointment slots
 */
export async function generateAvailableSlots({
  providerId,
  startDate,
  endDate,
  appointmentDuration = 30,
  timePreference = 'all'
}: GenerateAvailableSlotsParams): Promise<AvailableSlotsResult> {

  // 1. Fetch provider information
  const { data: provider } = await supabase
    .from('users')
    .select('full_name, provider_profiles(specialty)')
    .eq('id', providerId)
    .single();

  // 2. Fetch provider's schedule
  const { data: schedules } = await supabase
    .from('provider_schedules')
    .select('*')
    .eq('provider_id', providerId)
    .eq('is_active', true);

  // 3. Fetch provider's blocked time
  const { data: blockedTimes } = await supabase
    .from('provider_time_blocks')
    .select('*')
    .eq('provider_id', providerId)
    .eq('is_active', true)
    .gte('end_datetime', startDate.toISOString())
    .lte('start_datetime', endDate.toISOString());

  // 4. Fetch existing appointments
  const { data: existingAppointments } = await supabase
    .from('appointments')
    .select('scheduled_start, scheduled_end')
    .eq('provider_id', providerId)
    .in('status', ['scheduled', 'confirmed'])
    .gte('scheduled_start', startDate.toISOString())
    .lte('scheduled_start', endDate.toISOString());

  // 5. Generate slots for each day in range
  const daySlots: DaySlots[] = [];
  let totalSlots = 0;
  let availableSlots = 0;

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();

    // Find if provider works this day
    const daySchedule = schedules?.find(s => s.day_of_week === dayOfWeek);

    if (daySchedule) {
      const slots = generateSlotsForDay(
        currentDate,
        daySchedule,
        blockedTimes || [],
        existingAppointments || [],
        appointmentDuration,
        timePreference
      );

      if (slots.length > 0) {
        daySlots.push({
          date: currentDate.toISOString().split('T')[0],
          dayOfWeek: getDayName(dayOfWeek),
          slots
        });

        totalSlots += slots.length;
        availableSlots += slots.filter(s => s.available).length;
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    availableSlots: daySlots,
    metadata: {
      totalSlotsFound: totalSlots,
      totalSlotsAvailable: availableSlots,
      dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      providerName: provider?.full_name,
      providerSpecialty: (provider as any)?.provider_profiles?.specialty
    }
  };
}

/**
 * Generate time slots for a specific day
 */
function generateSlotsForDay(
  date: Date,
  schedule: any,
  blockedTimes: any[],
  appointments: any[],
  duration: number,
  timePreference: TimePreference
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  // Parse schedule times (format: "08:00:00")
  const [startHour, startMin] = schedule.start_time.split(':').map(Number);
  const [endHour, endMin] = schedule.end_time.split(':').map(Number);

  // Generate slots every 30 minutes (or specified duration)
  let currentHour = startHour;
  let currentMin = startMin;

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMin < endMin)
  ) {
    const slotTime = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

    // Create datetime in Central Time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const slotDatetime = `${year}-${month}-${day}T${slotTime}:00-06:00`;

    // Check if this slot matches time preference
    if (matchesTimePreference(currentHour, timePreference)) {
      // Check availability
      const availabilityCheck = checkSlotAvailability(
        new Date(slotDatetime),
        duration,
        blockedTimes,
        appointments
      );

      slots.push({
        time: slotTime,
        datetime: slotDatetime,
        available: availabilityCheck.available,
        reason: availabilityCheck.reason,
        location: schedule.location,
        staffAssigned: schedule.staff_available
      });
    }

    // Increment by 30 minutes (or duration)
    currentMin += 30;
    if (currentMin >= 60) {
      currentMin -= 60;
      currentHour += 1;
    }
  }

  return slots;
}

/**
 * Check if a specific slot is available
 */
function checkSlotAvailability(
  slotStart: Date,
  duration: number,
  blockedTimes: any[],
  appointments: any[]
): { available: boolean; reason?: string } {
  const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

  // Check if slot overlaps with blocked time
  for (const block of blockedTimes) {
    const blockStart = new Date(block.start_datetime);
    const blockEnd = new Date(block.end_datetime);

    if (slotStart < blockEnd && slotEnd > blockStart) {
      const blockType = block.block_type.split('_').map((w: string) =>
        w.charAt(0).toUpperCase() + w.slice(1)
      ).join(' ');
      return { available: false, reason: `Blocked (${blockType})` };
    }
  }

  // Check if slot overlaps with existing appointment
  for (const appt of appointments) {
    const apptStart = new Date(appt.scheduled_start);
    const apptEnd = new Date(appt.scheduled_end);

    if (slotStart < apptEnd && slotEnd > apptStart) {
      return { available: false, reason: 'Booked' };
    }
  }

  return { available: true };
}

/**
 * Check if hour matches time preference
 */
function matchesTimePreference(hour: number, preference: TimePreference): boolean {
  if (preference === 'all') return true;

  if (preference === 'morning') {
    return hour >= 7 && hour < 12;
  }

  if (preference === 'afternoon') {
    return hour >= 12 && hour < 17;
  }

  if (preference === 'evening') {
    return hour >= 17 && hour < 20;
  }

  return true;
}

/**
 * Get day name from day number
 */
function getDayName(dayNum: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNum];
}
