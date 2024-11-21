// ttsLogger.ts
export interface FlightDetails {
  flightIcaoCode: string;
  flightNumber: string;
  destinationCode: string;
  callType: string;
  gate?: string; // Optional field
  filename: string; // Default filename for TTS audio
}

export async function logTTSPlay(flightDetails: FlightDetails) {
  try {
    const response = await fetch('/api/mp3-plays', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flightDetails),
    });

    if (!response.ok) {
      throw new Error(`Failed to log TTS play: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('TTS play logged successfully:', result);
    
  } catch (error) {
    console.error('Error logging TTS play:', error);
  }
}