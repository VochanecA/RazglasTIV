import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, flightInfo } = await request.json();

    // OpenRouter API konfiguracija
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    // Kreiraj prompt za airport announcement
    const prompt = createAnnouncementPrompt(text, flightInfo);

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-domain.com', // Zamijenite sa vašim domenom
        'X-Title': 'Airport PA System'
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-nano-9b-v2:free',
        messages: [
          {
            role: 'system',
            content: `You are an airport public announcement system. Create clear, professional, and concise airport announcements in English. Follow these rules:
1. Keep announcements under 50 words
2. Use clear, simple language
3. Include flight numbers and destinations prominently
4. Be polite and professional
5. Use standard airport terminology
6. Speak in present tense
7. Make it easy to understand for non-native speakers`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate announcement' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content?.trim();

    if (!generatedText) {
      return NextResponse.json(
        { error: 'No text generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      text: generatedText,
      originalText: text 
    });

  } catch (error) {
    console.error('AI TTS error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function createAnnouncementPrompt(text: string, flightInfo?: any): string {
  if (flightInfo) {
    const { type, airline, flightNumber, destination, origin } = flightInfo;
    
    if (type === 'DEP') {
      return `Create a departure announcement for ${airline} flight ${flightNumber} to ${destination}. ${text}`;
    } else if (type === 'ARR') {
      return `Create an arrival announcement for ${airline} flight ${flightNumber} from ${origin}. ${text}`;
    } else if (type === 'General') {
      return `Create a general airport announcement: ${text}`;
    }
  }
  
  return `Create an airport announcement: ${text}`;
}