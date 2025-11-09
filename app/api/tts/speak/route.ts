import { NextRequest, NextResponse } from 'next/server';

/**
 * Text-to-Speech API Route
 *
 * Supports two modes:
 * 1. Browser TTS (default) - Uses client-side SpeechSynthesis API
 * 2. OpenRouter TTS (optional) - Server-generated audio if API key is configured
 */
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // Option 1: OpenRouter TTS (if API key is available)
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/tts-1-hd', // High-quality HD voice model
            input: text,
            voice: 'shimmer', // Natural, warm female voice (most human-like)
            speed: 1.0, // Natural speaking pace
          })
        });

        if (response.ok) {
          const audioBuffer = await response.arrayBuffer();

          return new NextResponse(audioBuffer, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'no-cache',
            },
          });
        } else {
          console.error('OpenRouter TTS failed:', await response.text());
        }
      } catch (apiError) {
        console.error('OpenRouter TTS error:', apiError);
      }
    }

    // Option 2: Return text for client-side browser TTS (fallback)
    return NextResponse.json({
      text,
      useBrowserTTS: true,
      message: 'Using browser text-to-speech as fallback'
    });

  } catch (error: any) {
    console.error('TTS route error:', error);
    return NextResponse.json(
      { error: error.message || 'Text-to-speech failed' },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    ttsProvider: process.env.OPENROUTER_API_KEY ? 'openrouter' : 'browser',
    timestamp: new Date().toISOString()
  });
}
