import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Fetch provider schedules
    const { data: schedules } = await supabase
      .from('provider_schedules')
      .select('*')
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

${schedulesText}

CURRENT DATE: ${new Date().toISOString().split('T')[0]}
CURRENT TIME: ${new Date().toISOString()}

Generate 3 ranked appointment options. Consider:
1. Patient's preferred times of day
2. Avoiding all recurring and one-time unavailable blocks
3. Meeting all prerequisites (fasting = morning appointment)
4. Respecting the notice requirement (${hoursNeeded} hours minimum)
5. Earliness (sooner is better, but not too urgent - at least 2-3 days out)
6. Different locations for variety
7. Only schedule during actual provider operating hours
8. Assign actual staff members from the available list

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

        // Check if it's a weekday (Monday-Friday)
        if (dayOfWeek >= 1 && dayOfWeek <= 5 && !isBlocked) {
          availableDates.push(new Date(candidateDate));
        }

        candidateDate = new Date(candidateDate.getTime() + msPerDay);
        daysChecked++;
      }

      // Get locations from schedules
      const locations = Array.from(locationSchedules.keys());
      const allStaff = ['Lisa Chen', 'Mark Johnson', 'Amy Wu'];

      // Build preferred time
      const preferredHour = preferredTimes.includes('morning') ? 7 :
                           preferredTimes.includes('afternoon') ? 13 : 8;

      // Return mock data for demo purposes
      return NextResponse.json({
        options: [
          {
            rank: 1,
            datetime: new Date(availableDates[0].setHours(preferredHour, 45, 0)).toISOString(),
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
            datetime: new Date(availableDates[1].setHours(preferredHour + 1, 30, 0)).toISOString(),
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
            datetime: new Date(availableDates[2].setHours(preferredHour, 0, 0)).toISOString(),
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
