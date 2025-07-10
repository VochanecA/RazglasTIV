'use client';

import React, { useState, useEffect } from 'react';
import { FlightAnnouncementsProvider } from '@/components/ui/FlightAnnouncementsProvider';
import { useFlightAnnouncements } from '@/lib/flightTTS';
import FlightCard from '@/components/ui/FlightCard';
import AirlineDistributionCard from '@/components/ui/AirlineDistributionCard';
import { FlightData } from '@/types/flight';
import Skeleton from '@/components/ui/skeleton';
import { PlaneTakeoff, PlaneLanding, Lock, ListFilter, List } from 'lucide-react'; // Added ListFilter and List icons
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';


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
  // New state to control showing all flights
  const [showAllFlights, setShowAllFlights] = useState(false);

  // Always call the hook unconditionally
  const flightData = useFlightAnnouncements(); // This will always be called

  // Conditionally handle flights based on user
  const flights = user ? (flightData as FlightData) : null;

  // Redirect to sign-in after showing message
  useEffect(() => {
    if (!user) {
      setShowLoginMessage(true);

      // Set a timeout to redirect after 10 seconds
      const redirectTimer = setTimeout(() => {
        router.push('/sign-in');
      }, 10000); // 10 seconds delay

      // Clear the timeout if the component unmounts
      return () => clearTimeout(redirectTimer);
    }
  }, [user, router]);

  // Effect to update last fetched time when flights are fetched
  useEffect(() => {
    if (flights) {
      setLastFetchedTime(new Date().toLocaleString());
    }
  }, [flights]);

  // Effect to switch tabs every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab(prevTab => (prevTab === 'departures' ? 'arrivals' : 'departures'));
    }, 10000); // Switch every 30 seconds

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
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago

  // Filter flights based on their scheduled time to hide departed/arrived ones
  const getFilteredFlightsByTime = (flightsArray: FlightData['departures'] | FlightData['arrivals']) => {
    // If showAllFlights is true, return the array without time filtering
    if (showAllFlights) {
      return flightsArray;
    }

    return flightsArray.filter(flight => {
      // Assuming 'scheduled_out' is the relevant time for both departures and arrivals.
      // If your FlightData type has a 'scheduled_in' for arrivals, use that for arrivals.
      if (!flight.scheduled_out) return false;
      const [hours, minutes] = flight.scheduled_out.split(':').map(Number);
      const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      // Keep the flight if its scheduled time is after the 'tenMinutesAgo' mark
      return scheduledTime > tenMinutesAgo;
    });
  };

  // Apply time-based filtering before applying search query filter
  const timeFilteredDepartures = flights?.departures ? getFilteredFlightsByTime(flights.departures) : [];
  const timeFilteredArrivals = flights?.arrivals ? getFilteredFlightsByTime(flights.arrivals) : [];

  // Combine time-filtered flights with search query filter
  const filteredFlights = (activeTab === 'departures' ? timeFilteredDepartures : timeFilteredArrivals).filter(flight => {
    const flightNumberMatch = flight.ident.toLowerCase().includes(searchQuery.toLowerCase());
    const iataCodeMatch = flight.Kompanija?.toLowerCase().includes(searchQuery.toLowerCase());
    const destinationMatch = flight.grad?.toLowerCase().includes(searchQuery.toLowerCase());
    const destinationCodeMatch = flight.destination.code?.toLowerCase().includes(searchQuery.toLowerCase());

    return flightNumberMatch || iataCodeMatch || destinationMatch || destinationCodeMatch;
  });

  // Combine all flights for airline distribution (both departures and arrivals)
  const allFlights = [...(flights?.departures || []), ...(flights?.arrivals || [])];

  return (
    <div className="container mx-auto p-4 bg-white dark:bg-gray-800">
      <FlightAnnouncementsProvider />

      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Flight Information
      </h1>

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
              <span>Hide Departed/Arrived</span>
            </>
          ) : (
            <>
              <List size={18} />
              <span>Show All Flights</span>
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