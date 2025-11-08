import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { orderId, patientId, orderDetails, prerequisites } = await request.json();

    // Build the AI prompt
    const prompt = `You are an AI scheduling assistant for healthcare appointments.

ORDER DETAILS:
- Type: ${orderDetails.type}
- Title: ${orderDetails.title}
- Priority: ${orderDetails.priority}

PREREQUISITES:
${prerequisites.map((p: any) => `- ${p.description}`).join('\n')}

PATIENT PREFERENCES:
- Preferred times: Mornings before 10am
- Unavailable: Tuesdays 9-11am, Thursdays 9-11am (kids' music class)
- Notice requirement: At least 2 hours advance notice

AVAILABLE LOCATIONS AND TIMES:
- MedHarmony Labs - Main St: Monday-Friday 7am-4pm
- MedHarmony Labs - Oak Ave: Monday-Friday 7am-4pm
- MedHarmony Labs - Riverside: Monday-Friday 8am-3pm

CURRENT DATE: ${new Date().toISOString().split('T')[0]}

Generate 3 ranked appointment options. Consider:
1. Patient's morning preference
2. Avoiding Tuesday/Thursday 9-11am conflicts
3. Meeting all prerequisites (fasting = morning appointment)
4. Earliness (sooner is better, but not too urgent)
5. Different locations for variety

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
      console.warn('OpenRouter API key not configured, using mock data');
      // Return mock data for demo purposes
      return NextResponse.json({
        options: [
          {
            rank: 1,
            datetime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
            location: "MedHarmony Labs - Main St",
            staffAssigned: "Lisa Chen, Phlebotomist",
            reasoning: "Earliest available morning slot that meets fasting requirements and avoids your Tuesday/Thursday conflicts",
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
            datetime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
            location: "MedHarmony Labs - Oak Ave",
            staffAssigned: "Mark Johnson, Phlebotomist",
            reasoning: "Slightly later option with closer location (1.8 miles) and more time to prepare",
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
            datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            location: "MedHarmony Labs - Main St",
            staffAssigned: "Amy Wu, Phlebotomist",
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
