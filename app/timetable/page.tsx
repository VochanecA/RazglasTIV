'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FlightAnnouncementsProvider } from '@/components/ui/FlightAnnouncementsProvider';
import { useFlightAnnouncements } from '@/lib/flightTTS';
import FlightCard from '@/components/ui/FlightCard';
import AirlineDistributionCard from '@/components/ui/AirlineDistributionCard';
import Skeleton from '@/components/ui/skeleton';
import { PlaneTakeoff, PlaneLanding, Lock, ListFilter, List } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';
import BackgroundVolume from '@/components/ui/BackgroundVolume';
import { setupBackgroundMusic, playBackgroundMusic, cleanupAudioResources } from '@/lib/audioManager'; // Import audio functions
import { FlightData, Flight } from '@/types/flight'; // Ensure FlightData and Flight are imported from the correct source

// Custom hook for debouncing a value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const Tab = ({ label, isActive, onClick, icon }: { label: string; isActive: boolean; onClick: () => void; icon: React.ReactNode }) => (
  <button
    className={`flex items-center py-2 px-4 font-semibold ${isActive ? 'border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
    onClick={onClick}
  >
    {icon}
    <span className="ml-2">{label}</span>
  </button>
);

export default function Page() {
  const { user } = useUser();
  const router = useRouter();
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<'departures' | 'arrivals'>('departures');
  const [lastFetchedTime, setLastFetchedTime] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllFlights, setShowAllFlights] = useState(false);

  // Debounce the search query to reduce re-renders during typing
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // 300ms debounce delay

  // Always call the hook unconditionally
  // Explicitly cast the return type to resolve type mismatch errors
  const flightData = useFlightAnnouncements() as FlightData | null | undefined;

  // Conditionally handle flights based on user
  const flights = user ? flightData : null;

  // Effect for setting up and cleaning up background music
  useEffect(() => {
    setupBackgroundMusic();

    // IMPORTANT: playBackgroundMusic needs to be triggered by a user interaction.
    // For a real application, you'd typically have a "Start Experience" button
    // or similar that the user clicks, which then calls playBackgroundMusic().
    // For development/testing, you might temporarily uncomment the line below
    // but be aware of browser autoplay policies.
    // playBackgroundMusic(); // Uncomment this ONLY if you have a user gesture that triggers it.

    return () => {
      cleanupAudioResources(); // Clean up all audio resources on component unmount
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleanup on unmount

  // Redirect to sign-in after showing message
  useEffect(() => {
    if (!user) {
      setShowLoginMessage(true);

      const redirectTimer = setTimeout(() => {
        router.push('/sign-in');
      }, 10000);

      return () => clearTimeout(redirectTimer);
    }
  }, [user, router]);

  // Effect to update last fetched time when flights are fetched
  useEffect(() => {
    if (flights) {
      setLastFetchedTime(new Date().toLocaleString());
    }
  }, [flights]);

  // Effect to switch tabs every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab(prevTab => (prevTab === 'departures' ? 'arrivals' : 'departures'));
    }, 10000); // Switch every 10 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // If no user, show login prompt
  if (!user && showLoginMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8 max-w-md w-full text-center">
          <Lock className="mx-auto mb-4 text-gray-500" size={48} />
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Login Required
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            To view this page, you must log in to your account.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You will be redirected to the login page in 10 seconds...
          </p>
          <button
            onClick={() => router.push('/sign-in')}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login Now
          </button>
        </div>
      </div>
    );
  }

  // Render nothing if still loading or no user
  if (!user) return null;

  // Define a grace period for filtering out departed/arrived flights
  const now = useMemo(() => new Date(), []); // Memoize 'now' to prevent unnecessary re-calculation
  const tenMinutesAgo = useMemo(() => new Date(now.getTime() - 10 * 60 * 1000), [now]);

  // Memoize the time-based filtering function
  // Changed the type of flightsArray to Flight[]
  const getFilteredFlightsByTime = useCallback((flightsArray: Flight[]) => {
    if (showAllFlights) {
      return flightsArray;
    }
    return flightsArray.filter(flight => {
      if (!flight.scheduled_out) return false;
      const [hours, minutes] = flight.scheduled_out.split(':').map(Number);
      const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      return scheduledTime > tenMinutesAgo;
    });
  }, [showAllFlights, now, tenMinutesAgo]);


  // Memoize time-filtered departures and arrivals
  const timeFilteredDepartures = useMemo(
    () => (flights?.departures ? getFilteredFlightsByTime(flights.departures) : []),
    [flights?.departures, getFilteredFlightsByTime]
  );
  const timeFilteredArrivals = useMemo(
    () => (flights?.arrivals ? getFilteredFlightsByTime(flights.arrivals) : []),
    [flights?.arrivals, getFilteredFlightsByTime]
  );

  // Memoize the final filtered flights based on search query and active tab
  const filteredFlights = useMemo(() => {
    const currentFlights = activeTab === 'departures' ? timeFilteredDepartures : timeFilteredArrivals;
    if (!debouncedSearchQuery) {
      return currentFlights;
    }
    const lowerCaseSearchQuery = debouncedSearchQuery.toLowerCase();
    return currentFlights.filter(flight => {
      const flightNumberMatch = flight.ident.toLowerCase().includes(lowerCaseSearchQuery);
      const iataCodeMatch = flight.Kompanija?.toLowerCase().includes(lowerCaseSearchQuery);
      const destinationMatch = flight.grad?.toLowerCase().includes(lowerCaseSearchQuery);
      const destinationCodeMatch = flight.destination.code?.toLowerCase().includes(lowerCaseSearchQuery);
      return flightNumberMatch || iataCodeMatch || destinationMatch || destinationCodeMatch;
    });
  }, [activeTab, timeFilteredDepartures, timeFilteredArrivals, debouncedSearchQuery]);

  // Memoize all flights for airline distribution
  const allFlights = useMemo(
    () => [...(flights?.departures || []), ...(flights?.arrivals || [])],
    [flights?.departures, flights?.arrivals]
  );

  return (
    <div className="container mx-auto p-4 bg-white dark:bg-gray-800">
      {/* FlightAnnouncementsProvider should wrap the entire app or a significant portion */}
      <FlightAnnouncementsProvider />

      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Flight Information
      </h1>
      <div className="mb-6">
        <BackgroundVolume />
      </div>
      {/* Airline Distribution Card */}
      <div className="mb-6">
        <AirlineDistributionCard flights={allFlights} />
      </div>

      {/* Search Input Field */}
      <input
        type="text"
        placeholder="Search Flights, airlines, destination, IATA code of origin/destination..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4 p-2 border rounded-full bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-300 w-full"
      />

      {/* Tabs and Show All Flights Toggle */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <Tab
            label="Departures"
            isActive={activeTab === 'departures'}
            onClick={() => setActiveTab('departures')}
            icon={<PlaneTakeoff color="lightblue" size={20} />}
          />
          <Tab
            label="Arrivals"
            isActive={activeTab === 'arrivals'}
            onClick={() => setActiveTab('arrivals')}
            icon={<PlaneLanding color="lightblue" size={20} />}
          />
        </div>

        {/* Show All Flights Toggle Button */}
        <button
          onClick={() => setShowAllFlights(!showAllFlights)}
          className={`flex items-center justify-center gap-2 py-2 px-4 rounded-full font-semibold transition-colors duration-200 ease-in-out
            ${showAllFlights
              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
              : 'bg-blue-200 text-blue-800 shadow-md hover:bg-blue-300 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700'
            }`}
        >
          {showAllFlights ? (
            <>
              <ListFilter size={18} />
              <span>Hide</span>
            </>
          ) : (
            <>
              <List size={18} />
              <span>All</span>
            </>
          )}
        </button>
      </div>

      {/* Show skeletons while loading flights */}
      {flights ? (
        <div className="flex flex-col gap-4">
          {filteredFlights.length > 0 ? (
            filteredFlights.map((flight) => (
              <FlightCard key={`${flight.ident}-${flight.Kompanija}`} flight={flight} type={activeTab === 'departures' ? 'departure' : 'arrival'} />
            ))
          ) : (
            <p className="text-gray-500">No flights found</p>
          )}
        </div>
      ) : (
        // Display skeletons while loading
        <div className="flex flex-col gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index}>
              <Skeleton className="h-24 mb-2" />
              <Skeleton className="h-6 w-full mb-1" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      )}


      {/* Last Fetched Time */}
      {lastFetchedTime && (
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          Last fetched at: {lastFetchedTime}
        </div>
      )}
    </div>
  );
}
