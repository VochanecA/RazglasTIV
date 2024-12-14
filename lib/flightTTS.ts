'use client';

import { useEffect, useState } from 'react';
import { fetchFlightData } from './flightDataFetcher';
import { processAnnouncements } from './announcementQueue';
import { setupBackgroundMusic, fadeOutBackgroundMusic, fadeInBackgroundMusic } from './audioManager';

// Flight and FlightData interfaces
export interface Flight {
  ident: string;
  status: string;
  scheduled_out: string;
  estimated_out: string;
  actual_out: string;
  origin: { code: string };
  destination: { code: string };
  grad: string;
  Kompanija: string;
  KompanijaICAO: string;
  KompanijaNaziv: string;
  checkIn: string;
  gate: string;
}

export interface FlightData {
  departures: Flight[];
  arrivals: Flight[];
}

// Define a type for the TTS engine
export interface TTSEngine {
  initialize: () => void; // Define other methods as needed
}

// Function to get and initialize the TTS engine
export const getFlightTTSEngine = (): TTSEngine => {
    // Your TTS engine initialization logic here
    console.log("TTS Engine initialized");
    return {
        initialize() {
            // Initialization logic here
        }
    };
};

export const checkIsAnnouncementTime = () => {
  const currentHour = new Date().getHours();
  const currentMonth = new Date().getMonth();

  // Announcement times:
  // April to October (months 3-9): 6am to 8pm
  // November to March (months 10-2): 6am to 3pm
  if (currentMonth >= 3 && currentMonth <= 9) {
    return currentHour >= 6 && currentHour < 20;
  } else {
    return currentHour >= 6 && currentHour < 21;
  }
};

// Hook for managing flight announcements
export const useFlightAnnouncements = () => {
  const [flights, setFlights] = useState<FlightData | null>(null);

  useEffect(() => {
    // Function to fetch flight data continuously
    const fetchData = async () => {
      try {
        const flightData = await fetchFlightData();
        setFlights(flightData);
      } catch (error) {
        console.error('Error fetching flight data:', error);
      }
    };

    // Function to handle announcements during allowed times
    const setupAnnouncements = async () => {
      if (!checkIsAnnouncementTime()) return;

      // Setup background music
      setupBackgroundMusic();

      try {
        if (flights) {
          await processAnnouncements(flights);
        }
      } catch (error) {
        console.error('Error setting up flight announcements:', error);
      }
    };

    // Fetch flight data continuously, 24/7
    fetchData();
    const fetchIntervalId = setInterval(fetchData, 60000); // Fetch every minute

    // Handle announcements only during specific times
    setupAnnouncements();
    const announcementIntervalId = setInterval(setupAnnouncements, 60000); // Check every minute

    return () => {
      clearInterval(fetchIntervalId);
      clearInterval(announcementIntervalId);
      fadeInBackgroundMusic(); // Ensure background music is restored
    };
  }, [flights]);

  return flights;
};