import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { formatDemoDate, formatDemoTime } from '@/lib/date-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { orderId, patientId, orderDetails, prerequisites } = await request.json();

    // Fetch patient's availability preferences
    const { data: preferences } = await supabase
      .from('availability_preferences')
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_active', true);

    // Fetch the order to get provider_id
    const { data: orderData } = await supabase
      .from('orders')
      .select('provider_id')
      .eq('id', orderId)
      .single();

    const providerId = orderData?.provider_id;

    // Fetch patient's existing appointments to avoid conflicts
    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('scheduled_start, scheduled_end, order:orders!appointments_order_id_fkey(title)')
      .eq('patient_id', patientId)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_start', new Date().toISOString())
      .order('scheduled_start', { ascending: true });

    // Fetch provider's existing appointments to avoid conflicts
    const { data: providerAppointments } = await supabase
      .from('appointments')
      .select('scheduled_start, scheduled_end, patient:users!patient_id(full_name)')
      .eq('provider_id', providerId)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_start', new Date().toISOString())
      .order('scheduled_start', { ascending: true });

    // Fetch provider's blocked time (vacation, sick days, etc.)
    const { data: providerTimeBlocks } = await supabase
      .from('provider_time_blocks')
      .select('start_datetime, end_datetime, block_type, reason')
      .eq('provider_id', providerId)
      .eq('is_active', true)
      .gte('end_datetime', new Date().toISOString())
      .order('start_datetime', { ascending: true });

    // Fetch provider schedules
    const { data: schedules } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true });

    // Build patient preferences string
    const recurringBlocks = preferences?.filter(p => p.preference_type === 'recurring_block') || [];
    const oneTimeBlocks = preferences?.filter(p => p.preference_type === 'one_time_block') || [];
    const preferredTimePref = preferences?.find(p => p.preference_type === 'preferred_time');
    const noticePref = preferences?.find(p => p.preference_type === 'notice_requirement');

    const preferredTimes = preferredTimePref?.preference_data?.times || ['morning'];
    const hoursNeeded = noticePref?.preference_data?.hours_needed || 2;

    const DAYS_MAP = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let patientPrefsText = `PATIENT PREFERENCES:
- Preferred times: ${preferredTimes.join(', ')}
- Notice requirement: At least ${hoursNeeded} hours advance notice`;

    if (recurringBlocks.length > 0) {
      patientPrefsText += '\n- Recurring unavailable times:';
      recurringBlocks.forEach(block => {
        patientPrefsText += `\n  * ${DAYS_MAP[block.day_of_week]}s ${block.start_time?.substring(0, 5)} - ${block.end_time?.substring(0, 5)} (${block.preference_data?.reason || 'blocked'})`;
      });
    }

    if (oneTimeBlocks.length > 0) {
      patientPrefsText += '\n- One-time unavailable dates:';
      oneTimeBlocks.forEach(block => {
        patientPrefsText += `\n  * ${block.block_start?.substring(0, 10)} to ${block.block_end?.substring(0, 10)} (${block.preference_data?.reason || 'blocked'})`;
      });
    }

    // Build existing appointments string (CRITICAL: Must avoid these times!)
    let existingApptsText = '';
    if (existingAppointments && existingAppointments.length > 0) {
      existingApptsText = '\n\n🚨 PATIENT\'S EXISTING APPOINTMENTS (MUST AVOID CONFLICTS!):\n';
      existingAppointments.forEach(appt => {
        existingApptsText += `- ${formatDemoDate(appt.scheduled_start)} ${formatDemoTime(appt.scheduled_start)} - ${formatDemoTime(appt.scheduled_end)}: ${(appt as any).order?.title || 'Appointment'}\n`;
      });
      existingApptsText += '\n⚠️ DO NOT suggest any times that overlap with patient appointments!\n';
    }

    // Build provider's appointments string
    let providerApptsText = '';
    if (providerAppointments && providerAppointments.length > 0) {
      providerApptsText = '\n\n🚨 PROVIDER\'S EXISTING APPOINTMENTS (PROVIDER IS BUSY!):\n';
      providerAppointments.forEach(appt => {
        const patientName = (appt as any).patient?.full_name || 'Patient';
        providerApptsText += `- ${formatDemoDate(appt.scheduled_start)} ${formatDemoTime(appt.scheduled_start)} - ${formatDemoTime(appt.scheduled_end)}: ${patientName}\n`;
      });
      providerApptsText += '\n⚠️ Provider is NOT available during these times!\n';
    }

    // Build provider's blocked time string
    let blockedTimeText = '';
    if (providerTimeBlocks && providerTimeBlocks.length > 0) {
      blockedTimeText = '\n\n🚫 PROVIDER UNAVAILABLE PERIODS (VACATION, SICK DAYS, ETC.):\n';
      providerTimeBlocks.forEach(block => {
        const blockType = block.block_type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const reason = block.reason ? ` - ${block.reason}` : '';
        blockedTimeText += `- ${formatDemoDate(block.start_datetime)} ${formatDemoTime(block.start_datetime)} to ${formatDemoDate(block.end_datetime)} ${formatDemoTime(block.end_datetime)}: ${blockType}${reason}\n`;
      });
      blockedTimeText += '\n⚠️ Provider is completely UNAVAILABLE during these blocked periods!\n';
    }

    // Build provider schedules string
    const locationSchedules = new Map<string, any[]>();
    schedules?.forEach(schedule => {
      if (!locationSchedules.has(schedule.location)) {
        locationSchedules.set(schedule.location, []);
      }
      locationSchedules.get(schedule.location)!.push(schedule);
    });

    let schedulesText = 'AVAILABLE LOCATIONS AND TIMES:';
    locationSchedules.forEach((scheds, location) => {
      const days = scheds.map(s => DAYS_MAP[s.day_of_week]).join(', ');
      const firstSched = scheds[0];
      const timeRange = `${firstSched.start_time?.substring(0, 5)} - ${firstSched.end_time?.substring(0, 5)}`;
      const staff = firstSched.staff_available || [];
      schedulesText += `\n- ${location}: ${days} ${timeRange} (Staff: ${staff.join(', ')})`;
    });

    // Build the AI prompt
    const prompt = `You are an AI scheduling assistant for healthcare appointments.

ORDER DETAILS:
- Type: ${orderDetails.type}
- Title: ${orderDetails.title}
- Priority: ${orderDetails.priority}

PREREQUISITES:
${prerequisites.map((p: any) => `- ${p.description}`).join('\n')}

${patientPrefsText}
${existingApptsText}
${providerApptsText}
${blockedTimeText}

${schedulesText}

CURRENT DATE: ${new Date().toISOString().split('T')[0]}
CURRENT TIME: ${new Date().toISOString()}

Generate 3 ranked appointment options. Consider:
1. Patient's preferred times of day
2. Avoiding all recurring and one-time unavailable blocks
3. 🚨 CRITICAL: Avoiding ALL patient's existing appointments (no time conflicts or overlaps!)
4. 🚨 CRITICAL: Avoiding ALL provider's existing appointments (provider must be available!)
5. 🚫 CRITICAL: NEVER schedule during provider blocked time periods (vacation, sick days, etc.)
6. Meeting all prerequisites (fasting = morning appointment)
7. Respecting the notice requirement (${hoursNeeded} hours minimum)
8. Earliness (sooner is better, but not too urgent - at least 2-3 days out)
9. Different locations for variety
10. Only schedule during actual provider operating hours
11. 🕐 MANDATORY: Use ONLY standard time slots ending in :00, :15, :30, or :45 (e.g., 9:00, 9:15, 9:30, 9:45). NEVER use odd times like 9:22 or 10:37.
12. Assign actual staff members from the available list

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "options": [
    {
      "rank": 1,
      "datetime": "2024-12-09T07:45:00Z",
      "location": "MedHarmony Labs - Main St",
      "staffAssigned": "Lisa Chen, Phlebotomist",
      "reasoning": "Earliest available morning slot that meets fasting requirements and avoids conflicts",
      "prerequisiteTimeline": [
        {"prerequisite": "Begin fasting", "when": "Sunday 11:45pm", "description": "Stop eating/drinking 8 hours before appointment"},
        {"prerequisite": "Stop blood thinner", "when": "Sunday 7:45am", "description": "Take last dose 24 hours before appointment"}
      ],
      "reminders": [
        {"when": "Sunday 6:00pm", "message": "Reminder: Begin fasting at 11:45pm tonight"},
        {"when": "Monday 6:00am", "message": "Appointment in 2 hours - you should be fasting"}
      ],
      "karmaBonus": 5
    },
    {
      "rank": 2,
      "datetime": "2024-12-11T08:30:00Z",
      "location": "MedHarmony Labs - Oak Ave",
      "staffAssigned": "Mark Johnson, Phlebotomist",
      "reasoning": "Slightly later option with closer location and more planning time",
      "prerequisiteTimeline": [
        {"prerequisite": "Begin fasting", "when": "Wednesday 12:30am", "description": "Stop eating/drinking 8 hours before"},
        {"prerequisite": "Stop blood thinner", "when": "Tuesday 8:30am", "description": "Take last dose 24 hours before"}
      ],
      "reminders": [
        {"when": "Tuesday 6:00pm", "message": "Reminder: Begin fasting at 12:30am"},
        {"when": "Wednesday 6:30am", "message": "Appointment in 2 hours"}
      ],
      "karmaBonus": 3
    },
    {
      "rank": 3,
      "datetime": "2024-12-13T09:00:00Z",
      "location": "MedHarmony Labs - Riverside",
      "staffAssigned": "Amy Wu, Phlebotomist",
      "reasoning": "Latest option with most flexibility for planning, different location",
      "prerequisiteTimeline": [
        {"prerequisite": "Begin fasting", "when": "Friday 1:00am", "description": "Stop eating/drinking 8 hours before"},
        {"prerequisite": "Stop blood thinner", "when": "Thursday 9:00am", "description": "Take last dose 24 hours before"}
      ],
      "reminders": [
        {"when": "Thursday 6:00pm", "message": "Reminder: Begin fasting at 1:00am"},
        {"when": "Friday 7:00am", "message": "Appointment in 2 hours"}
      ],
      "karmaBonus": 2
    }
  ]
}`;

    // Call OpenRouter API
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;

    if (!openrouterApiKey) {
      console.warn('OpenRouter API key not configured, using mock data with real preferences');

      // Generate smart dates based on patient preferences
      const now = new Date();
      const msPerDay = 24 * 60 * 60 * 1000;

      // Find next available days avoiding blocked times
      const availableDates: Date[] = [];
      let daysChecked = 0;
      let candidateDate = new Date(now.getTime() + (hoursNeeded / 24 + 2) * msPerDay); // Start after notice period + 2 days

      while (availableDates.length < 3 && daysChecked < 30) {
        const dayOfWeek = candidateDate.getDay();
        const isBlocked = recurringBlocks.some(block => block.day_of_week === dayOfWeek);

        // Check if this date/time conflicts with patient's existing appointments
        const hasPatientConflict = existingAppointments?.some(appt => {
          const apptDate = new Date(appt.scheduled_start);
          return candidateDate.toDateString() === apptDate.toDateString();
        }) || false;

        // Check if this date/time conflicts with provider's existing appointments
        const hasProviderConflict = providerAppointments?.some(appt => {
          const apptDate = new Date(appt.scheduled_start);
          return candidateDate.toDateString() === apptDate.toDateString();
        }) || false;

        // Check if this date falls within provider's blocked time
        const isProviderBlocked = providerTimeBlocks?.some(block => {
          const blockStart = new Date(block.start_datetime);
          const blockEnd = new Date(block.end_datetime);
          return candidateDate >= blockStart && candidateDate <= blockEnd;
        }) || false;

        // Check if it's a weekday (Monday-Friday) and no conflicts
        if (dayOfWeek >= 1 && dayOfWeek <= 5 && !isBlocked && !hasPatientConflict && !hasProviderConflict && !isProviderBlocked) {
          availableDates.push(new Date(candidateDate));
        }

        candidateDate = new Date(candidateDate.getTime() + msPerDay);
        daysChecked++;
      }

      // Get locations from schedules
      const locations = Array.from(locationSchedules.keys());
      const allStaff = ['Lisa Chen', 'Mark Johnson', 'Amy Wu'];

      // Build preferred time based on provider schedules (use actual business hours)
      // Provider schedules are typically 7AM-6PM, so let's use sensible times
      const preferredHour = preferredTimes.includes('morning') ? 9 :
                           preferredTimes.includes('afternoon') ? 14 : 10;

      // Helper to create proper datetime string in Central Time
      // This creates a timestamp that will display correctly in Central Time
      const createAppointmentTime = (date: Date, hour: number, minute: number) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hourStr = String(hour).padStart(2, '0');
        const minStr = String(minute).padStart(2, '0');

        // Create timestamp: YYYY-MM-DD HH:MM:SS
        // When this gets stored in Postgres with the AT TIME ZONE conversion,
        // it will be interpreted as Central Time and stored as UTC
        // Format: ISO string without Z suffix, will be handled by Postgres
        return `${year}-${month}-${day}T${hourStr}:${minStr}:00-06:00`; // -06:00 is Central Standard Time offset
      };

      // Return mock data for demo purposes
      return NextResponse.json({
        options: [
          {
            rank: 1,
            datetime: createAppointmentTime(availableDates[0], preferredHour, 0),
            location: locations[0] || "MedHarmony Labs - Main St",
            staffAssigned: `${allStaff[0]}, Phlebotomist`,
            reasoning: `Earliest available ${preferredTimes[0] || 'morning'} slot that meets all your requirements and avoids your blocked times`,
            prerequisiteTimeline: [
              { prerequisite: "Begin fasting", when: "Night before at 11:45pm", description: "Stop eating/drinking 8 hours before appointment" },
              { prerequisite: "Stop blood thinner", when: "Day before at 7:45am", description: "Take last dose 24 hours before appointment" },
              { prerequisite: "Bring documents", when: "Morning of appointment", description: "Insurance card and ID" }
            ],
            reminders: [
              { when: "Evening before at 6:00pm", "message": "Reminder: Begin fasting at 11:45pm tonight for your bloodwork tomorrow" },
              { when: "Morning of at 6:00am", "message": "Good morning! Your appointment is in 2 hours. You should be fasting." }
            ],
            karmaBonus: 5,
            travelTimeMinutes: 15
          },
          {
            rank: 2,
            datetime: createAppointmentTime(availableDates[1], preferredHour + 2, 30),
            location: locations[1] || "MedHarmony Labs - Oak Ave",
            staffAssigned: `${allStaff[1]}, Phlebotomist`,
            reasoning: "Slightly later option with more time to prepare, still respects your preferences",
            prerequisiteTimeline: [
              { prerequisite: "Begin fasting", when: "Night before at 12:30am", description: "Stop eating/drinking 8 hours before" },
              { prerequisite: "Stop blood thinner", when: "Day before at 8:30am", description: "Take last dose 24 hours before" },
              { prerequisite: "Bring documents", when: "Morning of appointment", description: "Insurance card and ID" }
            ],
            reminders: [
              { when: "Evening before at 6:00pm", "message": "Reminder: Begin fasting at 12:30am for your appointment" },
              { when: "Morning of at 6:30am", "message": "Appointment in 2 hours - remember to bring insurance card" }
            ],
            karmaBonus: 3,
            travelTimeMinutes: 12
          },
          {
            rank: 3,
            datetime: createAppointmentTime(availableDates[2], preferredHour + 1, 15),
            location: locations[2] || locations[0] || "MedHarmony Labs - Riverside",
            staffAssigned: `${allStaff[2]}, Phlebotomist`,
            reasoning: "Most flexible timing with a full week to prepare, end-of-week convenience",
            prerequisiteTimeline: [
              { prerequisite: "Begin fasting", when: "Night before at 1:00am", description: "Stop eating/drinking 8 hours before" },
              { prerequisite: "Stop blood thinner", when: "Day before at 9:00am", description: "Take last dose 24 hours before" },
              { prerequisite: "Bring documents", when: "Morning of appointment", description: "Insurance card and ID" }
            ],
            reminders: [
              { when: "Evening before at 6:00pm", "message": "Reminder: Begin fasting at 1:00am for tomorrow's appointment" },
              { when: "Morning of at 7:00am", "message": "Appointment in 2 hours - all set for your bloodwork!" }
            ],
            karmaBonus: 2,
            travelTimeMinutes: 15
          }
        ]
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'MedHarmony Command Center',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI scheduling assistant. Return ONLY valid JSON, no markdown formatting, no code blocks.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    let aiResponse;

    try {
      const content = data.choices[0].message.content;
      // Remove markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiResponse = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse AI response:', data.choices[0].message.content);
      throw new Error('AI returned invalid JSON');
    }

    return NextResponse.json(aiResponse);
  } catch (error: any) {
    console.error('AI scheduling error:', error);
    return NextResponse.json({
      error: 'Failed to generate schedule options',
      details: error.message
    }, { status: 500 });
  }
}
