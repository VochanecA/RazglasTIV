'use client';

import { useEffect, useState } from 'react';
import { fetchFlightData } from './flightDataFetcher';
import { processAnnouncements } from './announcementQueue';
import { setupBackgroundMusic, fadeOutBackgroundMusic, fadeInBackgroundMusic, stopBackgroundMusic,cleanupAudioResources } from './audioManager';
import { useUser } from '@/lib/auth'; // Import the useUser hook

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

export const checkIsAnnouncementTime = () => {
  const currentHour = new Date().getHours();
  const currentMonth = new Date().getMonth();

  // Announcement times:
  // April to October (months 3-9): 6am to 8pm
  // November to March (months 10-2): 6am to 3pm
  if (currentMonth >= 3 && currentMonth <= 9) {
    return currentHour >= 6 && currentHour < 20;
  } else {
    return currentHour >= 6 && currentHour < 16;
  }
};

export const useFlightAnnouncements = () => {
  const { user } = useUser(); // Get user authentication status
  const [flights, setFlights] = useState<FlightData | null>(null);

  useEffect(() => {
    const fetchAndProcessFlights = async () => {
      try {
        // Only fetch and process if user is logged in
        if (!user) {
          // Stop background music if no user
          stopBackgroundMusic();
          cleanupAudioResources();
          return;
        }

        const flightData = await fetchFlightData();
        setFlights(flightData);

        // Only process announcements during specific hours
        if (checkIsAnnouncementTime()) {
          setupBackgroundMusic();
          
          if (flightData) {
            await processAnnouncements(flightData);
          }
        }
      } catch (error) {
        console.error('Error fetching or processing flight data:', error);
      }
    };

    // Initial fetch
    fetchAndProcessFlights();

    // Set up interval to continuously fetch data
    const intervalId = setInterval(fetchAndProcessFlights, 60000); // Every minute

    // Cleanup function
    return () => {
      clearInterval(intervalId);
      
      // Restore background music if it was modified
      fadeInBackgroundMusic();
    };
  }, []);

  return flights;
};