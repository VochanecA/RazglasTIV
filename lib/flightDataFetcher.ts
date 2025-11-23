'use client';

import { FlightData } from './flightTTS';

export async function fetchFlightData(): Promise<FlightData | null> {
  try {
    const response = await fetch('/api/fetchFlights');
    if (!response.ok) {
      throw new Error('Failed to fetch flight data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching flight data:', error);
    return null;
  }
}