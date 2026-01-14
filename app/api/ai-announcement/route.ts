import { NextRequest, NextResponse } from 'next/server';

// Types for AI request and response
interface AIAnnouncementRequest {
  flight: {
    airline: string;
    flightNumber: string;
    destination: string;
    origin: string;
    scheduledTime: string;
    estimatedTime?: string;
    gate?: string;
    status: string;
    delay?: number;
  };
  announcementType: string;
  context: {
    weatherConditions?: string;
    passengerCount?: number;
    timeOfDay: string;
    isPeakHours: boolean;
    previousAnnouncements: string[];
    passengerSentiment: number;
  };
  customMessage?: string;
}

interface AIAnnouncementResponse {
  text: string;
  tone: 'professional' | 'urgent' | 'reassuring' | 'informative';
  priority: number;
  shouldAnnounce: boolean;
  estimatedDuration: number;
}

// OpenRouter client setup for NVIDIA Nemotron
class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }
  }

  async generateCompletion(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Airport Announcement System'
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-nano-12b-v2-vl:free',
          messages: [
            {
              role: 'system',
              content: 'You are an airport announcement system AI. Create clear, professional, and concise announcements for passengers. Always respond with just the announcement text without any additional explanations, labels, or markdown. Be polite and professional. Use standard airport terminology. Speak in present tense. Make it easy to understand for non-native speakers'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.7,
          top_p: 0.9,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid response format from OpenRouter:', data);
        throw new Error('Invalid response format from AI service');
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenRouter API call failed:', error);
      throw error;
    }
  }
}

// Prompt templates for different announcement types
const promptTemplates = {
  'delay-reason': (request: AIAnnouncementRequest) => `
Create a professional airport announcement for a delayed flight.

FLIGHT INFORMATION:
- Airline: ${request.flight.airline}
- Flight: ${request.flight.flightNumber}
- Destination: ${request.flight.destination}
- Scheduled: ${request.flight.scheduledTime}
- Estimated: ${request.flight.estimatedTime || 'Unknown'}
- Delay: ${request.flight.delay} minutes
- Gate: ${request.flight.gate || 'TBA'}

CONTEXT:
- Time: ${request.context.timeOfDay}
- Peak hours: ${request.context.isPeakHours ? 'Yes' : 'No'}
- Passenger sentiment: ${request.context.passengerSentiment >= 0 ? 'Positive' : 'Negative'}

GUIDELINES:
- Be clear and concise
- Provide reason for delay if known
- Show empathy for inconvenience
- Mention expected duration if available
- Include gate information if confirmed
- Keep it under 100 words
- Use professional but friendly tone
`,

  'weather-update': (request: AIAnnouncementRequest) => `
Create a weather-related airport announcement for passengers.

FLIGHT: ${request.flight.airline} ${request.flight.flightNumber} to ${request.flight.destination}
DELAY: ${request.flight.delay} minutes due to weather

CONTEXT:
- Time: ${request.context.timeOfDay}
- Current conditions: ${request.context.weatherConditions || 'Not specified'}

INSTRUCTIONS:
- Explain weather impact clearly
- Provide reassurance about safety
- Mention any expected improvements
- Keep tone professional but empathetic
- Include practical advice if relevant
- Maximum 80 words
`,

  'passenger-assistance': (request: AIAnnouncementRequest) => `
Napravi kratku i korisnu objavu za putnike koji se ukrcavaju.

Let: ${request.flight.airline} ${request.flight.flightNumber}
Destinacija: ${request.flight.destination}
Gejt: ${request.flight.gate}

Objavu ograniči na 2-3 rečenice. Budi prijatan i koristan.
`,

  'gate-change': (request: AIAnnouncementRequest) => `
Create a gate change announcement.

FLIGHT: ${request.flight.airline} ${request.flight.flightNumber}
FROM: ${request.flight.origin} to ${request.flight.destination}
ORIGINAL GATE: ${request.flight.gate || 'Not assigned'}

INSTRUCTIONS:
- Clear and urgent tone
- Repeat important information
- Provide clear directions
- Mention reason if available (optional)
- Keep it very concise (40-60 words)
- Make it easy to understand
`,

  'baggage-info': (request: AIAnnouncementRequest) => `
Create a baggage information announcement.

CONTEXT:
- Airline: ${request.flight.airline}
- General baggage information
- Time: ${request.context.timeOfDay}
- Peak hours: ${request.context.isPeakHours ? 'Yes' : 'No'}

GUIDELINES:
- Provide helpful baggage information
- Mention size/weight restrictions
- Security reminders
- Lost baggage procedures
- Professional and clear tone
- 70-90 words maximum
`
};

// Fallback announcements in case AI fails
const getFallbackAnnouncement = (request: AIAnnouncementRequest): string => {
  const fallbackAnnouncements = {
    'delay-reason': `We apologize for the delay. ${request.flight.airline} flight ${request.flight.flightNumber} to ${request.flight.destination} is currently delayed. We appreciate your patience and will update you as soon as we have more information.`,
    'weather-update': `Due to current weather conditions, some flights may experience delays. Please check the information screens for updates on your flight status.`,
    'passenger-assistance': `Passengers requiring special assistance, please visit our information desk. Our staff is available to help with any needs during this delay.`,
    'gate-change': `Gate change announcement. Please check the information screens for updated gate assignments.`,
    'baggage-info': `Please ensure your baggage meets airline size and weight requirements. See airline staff for any baggage assistance.`
  };

  return fallbackAnnouncements[request.announcementType as keyof typeof fallbackAnnouncements] || 
    `Attention please. ${request.flight.airline} flight ${request.flight.flightNumber} announcement. Please listen for further updates.`;
};

// Tone analyzer based on context
function determineTone(request: AIAnnouncementRequest): AIAnnouncementResponse['tone'] {
  const { passengerSentiment, isPeakHours } = request.context;
  const delay = request.flight.delay || 0;

  if (delay > 120 || passengerSentiment < -0.3) {
    return 'reassuring';
  } else if (request.announcementType === 'gate-change') {
    return 'urgent';
  } else if (delay > 60 || isPeakHours) {
    return 'informative';
  } else {
    return 'professional';
  }
}

// Priority calculator
function calculatePriority(request: AIAnnouncementRequest): number {
  const { announcementType } = request;
  const delay = request.flight.delay || 0;

  const priorityMap: Record<string, number> = {
    'gate-change': 1,
    'delay-reason': 2,
    'weather-update': 2,
    'passenger-assistance': 3,
    'baggage-info': 4
  };

  let priority = priorityMap[announcementType] || 3;

  // Adjust based on delay severity
  if (delay > 120) priority -= 1;
  if (delay > 180) priority -= 1;

  return Math.max(1, Math.min(5, priority));
}

// Duration calculator
function calculateDuration(text: string): number {
  const wordCount = text.split(/\s+/).length;
  const wordsPerMinute = 150;
  const baseDuration = (wordCount / wordsPerMinute) * 60 * 1000;
  return Math.max(3000, baseDuration + 2000); // Minimum 3 seconds + pause
}

// Business logic to decide if announcement should be made
function shouldMakeAnnouncement(request: AIAnnouncementRequest): boolean {
  const { announcementType, context, flight } = request;
  
  // Don't announce during very negative sentiment situations (might need human intervention)
  if (context.passengerSentiment < -0.7) {
    return false;
  }

  // Don't make too many of the same type of announcements
  if (context.previousAnnouncements.length > 5) {
    const similarAnnouncements = context.previousAnnouncements.filter(
      ann => ann.includes(announcementType)
    ).length;
    
    if (similarAnnouncements > 2) {
      return false;
    }
  }

  // Specific rules for each announcement type
  switch (announcementType) {
    case 'delay-reason':
      return (flight.delay || 0) > 15; // Only announce delays over 15 minutes
      
    case 'weather-update':
      return (flight.delay || 0) > 30; // Weather updates for significant delays
      
    case 'passenger-assistance':
      return (flight.delay || 0) > 60; // Assistance for long delays
      
    case 'gate-change':
      return true; // Always announce gate changes
      
    case 'baggage-info':
      return context.isPeakHours; // Baggage info during busy times
      
    default:
      return true;
  }
}

// Clean up AI response
function cleanAIResponse(text: string): string {
  return text
    .replace(/^(Announcement:|Text:|"|')/g, '') // Remove prefixes
    .replace(/("|')$/g, '') // Remove trailing quotes
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body: AIAnnouncementRequest = await request.json();

    // Validate required fields
    if (!body.flight || !body.announcementType) {
      return NextResponse.json(
        { error: 'Missing required fields: flight and announcementType are required' },
        { status: 400 }
      );
    }

    // Check if we should even announce (based on some business logic)
    const shouldAnnounce = shouldMakeAnnouncement(body);

    if (!shouldAnnounce) {
      return NextResponse.json({
        text: '',
        tone: 'professional',
        priority: 5,
        shouldAnnounce: false,
        estimatedDuration: 0
      });
    }

    let announcementText: string;

    try {
      // Initialize OpenRouter client
      const openRouter = new OpenRouterClient();
      
      // Get the appropriate prompt template
      const promptTemplate = promptTemplates[body.announcementType as keyof typeof promptTemplates];
      
      if (!promptTemplate) {
        throw new Error(`Unknown announcement type: ${body.announcementType}`);
      }

      const prompt = promptTemplate(body);
      announcementText = await openRouter.generateCompletion(prompt);

      // Clean up the AI response
      announcementText = cleanAIResponse(announcementText);

      // If AI returned empty response, use fallback
      if (!announcementText || announcementText.length < 10) {
        throw new Error('AI returned empty response');
      }

    } catch (aiError) {
      console.error('AI generation failed, using fallback:', aiError);
      announcementText = getFallbackAnnouncement(body);
    }

    // Determine tone and priority
    const tone = determineTone(body);
    const priority = calculatePriority(body);
    const estimatedDuration = calculateDuration(announcementText);

    const response: AIAnnouncementResponse = {
      text: announcementText,
      tone,
      priority,
      shouldAnnounce: true,
      estimatedDuration
    };

    console.log(`Generated AI announcement for ${body.flight.airline} ${body.flight.flightNumber}:`, {
      type: body.announcementType,
      tone,
      priority,
      length: announcementText.length
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('AI announcement API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate announcement',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'AI Announcement API is running',
    service: 'OpenRouter with NVIDIA Nemotron',
    status: 'operational',
    model: 'nvidia/nemotron-nano-12b-v2-vl:free'
  });
}