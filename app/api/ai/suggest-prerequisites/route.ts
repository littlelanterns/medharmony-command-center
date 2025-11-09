import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { orderType, title, description } = await request.json();

    // Smart preset suggestions based on order type
    const presetSuggestions: Record<string, Array<{ type: string; description: string }>> = {
      lab: [
        { type: 'fasting', description: 'Fast for 8-12 hours before appointment' },
        { type: 'hydration', description: 'Drink plenty of water before test' },
        { type: 'medication_stop', description: 'Stop blood thinners 24 hours before' },
        { type: 'bring_documents', description: 'Bring insurance card and ID' },
        { type: 'avoid_exercise', description: 'Avoid strenuous exercise 24 hours before' },
      ],
      imaging: [
        { type: 'remove_metal', description: 'Remove all metal jewelry and accessories' },
        { type: 'no_lotions', description: 'Do not apply lotions or deodorant' },
        { type: 'pregnancy_check', description: 'Notify if pregnant or possibly pregnant' },
        { type: 'bring_documents', description: 'Bring previous imaging results if available' },
        { type: 'medication_info', description: 'Bring list of current medications' },
      ],
      procedure: [
        { type: 'fasting', description: 'Fast for 12 hours before procedure' },
        { type: 'ride_home', description: 'Arrange for someone to drive you home' },
        { type: 'medication_stop', description: 'Stop certain medications as instructed' },
        { type: 'bring_documents', description: 'Bring insurance card, ID, and consent forms' },
        { type: 'comfortable_clothing', description: 'Wear loose, comfortable clothing' },
      ],
      'follow-up': [
        { type: 'bring_documents', description: 'Bring previous test results' },
        { type: 'medication_list', description: 'Bring current medication list' },
        { type: 'symptom_diary', description: 'Keep diary of symptoms since last visit' },
        { type: 'questions_prepared', description: 'Prepare list of questions' },
      ],
    };

    // Get preset suggestions for this order type
    let suggestions = presetSuggestions[orderType] || [];

    // If OpenRouter API key is available and we have title/description, use AI for more specific suggestions
    if (process.env.OPENROUTER_API_KEY && (title || description)) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are a medical assistant helping providers create orders. Suggest relevant patient prerequisites for medical orders. Return JSON array only, no other text.'
              },
              {
                role: 'user',
                content: `For a ${orderType} order titled "${title || 'untitled'}"${description ? ` with description "${description}"` : ''}, suggest 5-7 relevant prerequisites. Return JSON array with format: [{"type": "short_type", "description": "patient instruction"}]`
              }
            ],
            temperature: 0.3,
            max_tokens: 500
          })
        });

        const data = await response.json();
        const aiSuggestions = JSON.parse(data.choices[0].message.content);

        // Merge AI suggestions with presets (AI takes priority)
        suggestions = aiSuggestions;
      } catch (error) {
        console.error('AI suggestion error, using presets:', error);
        // Fall back to presets if AI fails
      }
    }

    return NextResponse.json({ suggestions });

  } catch (error: any) {
    console.error('Error suggesting prerequisites:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
