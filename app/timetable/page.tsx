'use client';

import React, { useState, useEffect } from 'react';
import { FlightAnnouncementsProvider } from '@/components/ui/FlightAnnouncementsProvider';
import { useFlightAnnouncements } from '@/lib/flightTTS';
import FlightCard from '@/components/ui/FlightCard'; // Adjust the import path as necessary
import { FlightData } from '@/types/flight'; // Import the FlightData type
import Skeleton from '@/components/ui/skeleton'; // Import your Skeleton component
import { PlaneTakeoff, PlaneLanding } from 'lucide-react'; // Importing required icons

const Tab = ({ label, isActive, onClick, icon }: { label: string; isActive: boolean; onClick: () => void; icon: React.ReactNode }) => (
  <button
    className={`flex items-center py-2 px-4 font-semibold ${isActive ? 'border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
    onClick={onClick}
  >
    {icon} {/* Render the icon */}
    <span className="ml-2">{label}</span> {/* Add margin for spacing */}
  </button>
);

export default function Page() {
  const flights = useFlightAnnouncements() as FlightData; // Cast to FlightData type
  const [activeTab, setActiveTab] = useState<'departures' | 'arrivals'>('departures');
  const [lastFetchedTime, setLastFetchedTime] = useState<string | null>(null);

  // Effect to update last fetched time when flights are fetched
  useEffect(() => {
    if (flights) {
      setLastFetchedTime(new Date().toLocaleString()); // Update with current time
    }
  }, [flights]);

  return (
    <div className="container mx-auto p-4 bg-white dark:bg-gray-800">
      <FlightAnnouncementsProvider />
      
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Flight Information
      </h1>
      
      <div className="flex space-x-4 mb-4">
        <Tab 
          label="Departures" 
          isActive={activeTab === 'departures'} 
          onClick={() => setActiveTab('departures')} 
          icon={<PlaneTakeoff color="lightblue" size={20} />} // Add PlaneTakeoff icon
        />
        <Tab 
          label="Arrivals" 
          isActive={activeTab === 'arrivals'} 
          onClick={() => setActiveTab('arrivals')} 
          icon={<PlaneLanding color="lightblue" size={20} />} // Add PlaneLanding icon
        />
      </div>

      {/* Show skeletons while loading flights */}
      {flights ? (
        <div className="flex flex-col gap-4"> {/* Change to flex-col for vertical stacking */}
          {activeTab === 'departures' && flights.departures.length > 0 ? (
            flights.departures.map((flight) => (
              <FlightCard key={flight.ident} flight={flight} type="departure" />
            ))
          ) : activeTab === 'arrivals' && flights.arrivals.length > 0 ? (
            flights.arrivals.map((flight) => (
              <FlightCard key={flight.ident} flight={flight} type="arrival" />
            ))
          ) : (
            <p className="text-gray-500">No flights scheduled</p>
          )}
        </div>
      ) : (
        // Display skeletons while loading
        <div className="flex flex-col gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index}>
              <Skeleton className="h-24 mb-2" /> {/* Adjust height for each skeleton */}
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
<div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
    We recommend using <strong>Chrome</strong> or <strong>Firefox</strong> for better audio experience.
</div>

      {/* Logos Section */}
      <div className="flex justify-center mt-2">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Google_Chrome_icon_%28February_2022%29.svg/48px-Google_Chrome_icon_%28February_2022%29.svg.png" 
          alt="Chrome Logo" 
          className="h-8 mx-2" 
        />
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Firefox_logo%2C_2019.svg/1024px-Firefox_logo%2C_2019.svg.png" 
          alt="Firefox Logo" 
          className="h-8 mx-2" 
        />
      </div>

      {/* Courtesy Text */}
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
        Courtesy of Smooth Lounge Radio - California Chill
      </div>
    </div>
  );
}
