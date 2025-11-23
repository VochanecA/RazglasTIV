'use client';

import React, { useState, useEffect } from 'react';
//import { FlightAnnouncementsProvider } from '@/components/ui/FlightAnnouncementsProvider';
import FlightTable from '@/components/ui/FlightTable'; 
import { FlightData } from '@/types/flight'; 

const Tab = ({ label, isActive, onClick, darkMode }: { label: string; isActive: boolean; onClick: () => void; darkMode: boolean; }) => (
  <button
    className={`flex items-center py-2 px-4 font-semibold rounded-lg transition-colors duration-200 ease-in-out 
      ${isActive ? (darkMode ? 'bg-gray-800 text-white' : 'bg-blue-600 text-white') : (darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-200')}`}
    onClick={onClick}
  >
    {label}
  </button>
);

export default function FlightTimetable() {
  const [activeTab, setActiveTab] = useState<'departures' | 'arrivals'>('departures');
  const [flightsData, setFlightsData] = useState<FlightData | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false); // Add dark mode state
  const [currentTime, setCurrentTime] = useState<string>(''); // State for current time
  // Fetch flight data
  const fetchFlights = async () => {
    try {
      const response = await fetch('/api/fetchFlights'); // Adjust the path as necessary
      if (!response.ok) {
        throw new Error('Failed to fetch flight data');
      }
      const data: FlightData = await response.json();
      console.log("Fetched Data:", data); // Log fetched data for debugging

      // Get current time
      const now = new Date();

      // Filter out flights that have departed or arrived more than one hour ago
      const filteredDepartures = data.departures.filter(flight => {
        if (!flight.scheduled_out) return false; // Skip if undefined
        const [hours, minutes] = flight.scheduled_out.split(':').map(Number);
        const scheduledOutTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        return scheduledOutTime > new Date(now.getTime() - 60 * 60 * 1000); // Within the last hour
      });

      const filteredArrivals = data.arrivals.filter(flight => {
        if (!flight.scheduled_out) return false; // Skip if undefined
        const [hours, minutes] = flight.scheduled_out.split(':').map(Number);
        const scheduledInTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        return scheduledInTime > new Date(now.getTime() - 60 * 60 * 1000); // Within the last hour
      });

      // Set filtered data based on active tab
      setFlightsData({
        departures: filteredDepartures,
        arrivals: filteredArrivals,
      });
    } catch (error) {
      console.error('Error fetching flight data:', error);
      setFlightsData(null); // Handle error state if necessary
    }
  };

  useEffect(() => {
    fetchFlights(); // Initial fetch

    const interval = setInterval(() => {
      fetchFlights(); // Fetch every 45 seconds
    }, 45000); // 45000 milliseconds = 45 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  
  useEffect(() => {
    // Update current time every minute
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })); // Format HH:mm
    };

    updateTime(); // Set initial time

    const timerId = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(timerId); // Cleanup interval on unmount
  }, []);

  useEffect(() => {
    // Switch tabs every 30 seconds
    const switchTabInterval = setInterval(() => {
      setActiveTab(prevTab => (prevTab === 'departures' ? 'arrivals' : 'departures'));
    }, 30000); // Switch every 30 seconds

    return () => clearInterval(switchTabInterval); // Cleanup interval on unmount
  }, []);

  // Filter flights based on active tab
  const filteredFlights = flightsData ? flightsData[activeTab] : [];

  return (
    <div >
   {/* <FlightAnnouncementsProvider />  ako treba i announcements */}  
      
    {/* Tabs */}
    <div className="flex justify-between items-center mb-4 p-2 rounded-lg bg-gray-800 text-white">

{/* Tabs */}
<div className="flex space-x-4">
  <span className={`text-5xl font-extrabold ${activeTab === 'departures' ? 'text-orange-600' : 'text-gray-900'}`}>
    Departures
  </span>
  <span className={`text-5xl font-extrabold ${activeTab === 'arrivals' ? 'text-orange-600' : 'text-gray-900'}`}>
    Arrivals
  </span>
</div>

        {/* Current Time Display */}
        <div className={`text-yellow-400 font-extrabold text-6xl`}>{currentTime}</div>
      </div>


      {/* Show flight table */}
      {flightsData ? (
        filteredFlights.length > 0 ? (
          <FlightTable flights={filteredFlights} type={activeTab} darkMode={darkMode} /> 
        ) : (
          <p className="text-gray-500">No flights found</p>
        )
      ) : (
        <p className="text-gray-500">Loading flights...</p>
      )}
    </div>
  );
}
