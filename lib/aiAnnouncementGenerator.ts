'use client';

export interface AIAnnouncementRequest {
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

export interface AIAnnouncementResponse {
  text: string;
  tone: 'professional' | 'urgent' | 'reassuring' | 'informative';
  priority: number;
  shouldAnnounce: boolean;
  estimatedDuration: number;
}

// Cache za AI odgovore da smanjimo API pozive
const aiResponseCache = new Map<string, { response: AIAnnouncementResponse; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minuta

export async function generateAIAnnouncement(
  request: AIAnnouncementRequest
): Promise<AIAnnouncementResponse> {
  const cacheKey = generateCacheKey(request);
  const cached = aiResponseCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Using cached AI response for:', cacheKey);
    return cached.response;
  }

  try {
    const response = await fetch('/api/ai-announcement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data: AIAnnouncementResponse = await response.json();
    
    // Cache the response
    aiResponseCache.set(cacheKey, {
      response: data,
      timestamp: Date.now()
    });

    // Cleanup old cache entries
    cleanupAICache();

    return data;
  } catch (error) {
    console.error('AI announcement generation failed:', error);
    return getFallbackAnnouncement(request);
  }
}

function generateCacheKey(request: AIAnnouncementRequest): string {
  return `${request.flight.airline}-${request.flight.flightNumber}-${request.announcementType}-${request.flight.status}`;
}

function cleanupAICache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  aiResponseCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_DURATION) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => aiResponseCache.delete(key));
}

function getFallbackAnnouncement(request: AIAnnouncementRequest): AIAnnouncementResponse {
  // Fallback announcements kada AI ne radi
  const baseText = generateFallbackText(request);
  
  return {
    text: baseText,
    tone: 'professional',
    priority: 3,
    shouldAnnounce: true,
    estimatedDuration: calculateDuration(baseText)
  };
}

function generateFallbackText(request: AIAnnouncementRequest): string {
  const { flight, announcementType } = request;
  
  switch (announcementType) {
    case 'delay-reason':
      return `Attention please. ${flight.airline} flight ${flight.flightNumber} to ${flight.destination} is delayed due to operational reasons. We apologize for any inconvenience.`;
    
    case 'weather-update':
      return `Weather update: Current conditions may affect some flights. Please check the information screens for latest updates.`;
    
    case 'passenger-assistance':
      return `Passengers requiring special assistance, please proceed to the information desk. Our staff is ready to help you.`;
    
    case 'gate-change':
      return `Gate change announcement. Please check the information screens for your flight's gate assignment.`;
    
    case 'baggage-info':
      return `Baggage information: Please ensure your baggage meets the size and weight requirements. See airline staff for assistance.`;
    
    default:
      return `Attention please. ${flight.airline} flight ${flight.flightNumber} announcement. Please listen for further updates.`;
  }
}

function calculateDuration(text: string): number {
  // Prosečno 150 reči u minuti + dodatno vreme za pauze
  const wordCount = text.split(' ').length;
  const baseDuration = (wordCount / 150) * 60 * 1000; // u milisekundama
  return Math.max(5000, baseDuration + 2000); // Minimum 5 sekundi + 2 sekunde pauze
}

// Utility funkcija za analizu sentimenta
export function analyzePassengerSentiment(
  delayDuration: number,
  timeOfDay: string,
  isPeakHours: boolean
): number {
  let sentiment = 0;
  
  // Delay utiče negativno na sentiment
  if (delayDuration > 60) sentiment -= 0.3;
  if (delayDuration > 120) sentiment -= 0.5;
  
  // Vreme dana utiče na strpljenje
  if (timeOfDay === 'morning') sentiment += 0.1; // Ljudi su strpljiviji ujutru
  if (timeOfDay === 'evening') sentiment -= 0.1; // Manje strpljenja naveče
  
  // Peak hours negativno utiču
  if (isPeakHours) sentiment -= 0.2;
  
  return Math.max(-1, Math.min(1, sentiment));
}