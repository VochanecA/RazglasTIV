'use client';

import React, { useState, useEffect } from 'react';
import FlightTable from '@/components/ui/FlightTable'; 
import { FlightData } from '@/types/flight'; 

export default function FlightTimetable() {
  const [activeTab, setActiveTab] = useState<'departures' | 'arrivals'>('departures');
  const [flightsData, setFlightsData] = useState<FlightData | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchFlights = async () => {
    try {
      const response = await fetch('/api/fetchFlights');
      if (!response.ok) {
        throw new Error('Failed to fetch flight data');
      }
      const data: FlightData = await response.json();
      console.log("Fetched Data:", data);

      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      // Filter out flights that have departed or arrived more than one hour ago
      const filteredDepartures = data.departures.filter(flight => {
        if (!flight.scheduled_out) return false;
        const [hours, minutes] = flight.scheduled_out.split(':').map(Number);
        const scheduledOutTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        return scheduledOutTime > new Date(now.getTime() - 60 * 60 * 1000);
      });

      const filteredArrivals = data.arrivals.filter(flight => {
        if (!flight.scheduled_out) return false;
        const [hours, minutes] = flight.scheduled_out.split(':').map(Number);
        const scheduledInTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        return scheduledInTime > new Date(now.getTime() - 60 * 60 * 1000);
      });

      setFlightsData({
        departures: filteredDepartures,
        arrivals: filteredArrivals,
      });
    } catch (error) {
      console.error('Error fetching flight data:', error);
      setFlightsData(null);
    }
  };

  useEffect(() => {
    fetchFlights();
    const interval = setInterval(() => {
      fetchFlights();
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const timerId = setInterval(updateTime, 60000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const switchTabInterval = setInterval(() => {
      setActiveTab(prevTab => (prevTab === 'departures' ? 'arrivals' : 'departures'));
    }, 30000);
    return () => clearInterval(switchTabInterval);
  }, []);

  const filteredFlights = flightsData ? flightsData[activeTab] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      {/* Header Section */}
      <div className="mb-8">
        {/* Airport Title */}
        <div className="text-center mb-6">
          <h1 className="text-6xl font-black text-white mb-2 tracking-tight">
            TIVAT AIRPORT
          </h1>
          <div className="flex justify-center items-center gap-8">
            <span className="text-2xl font-bold text-amber-400">TIV</span>
            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
            <span className="text-xl text-gray-300">Montenegro</span>
          </div>
        </div>

        {/* Tabs and Time Display */}
        <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-2xl">
          <div className="flex justify-between items-center">
            {/* Tabs */}
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('departures')}
                className={`text-7xl font-black transition-all duration-500 ${
                  activeTab === 'departures' 
                    ? 'text-amber-400 scale-105' 
                    : 'text-gray-500 hover:text-gray-400'
                }`}
              >
                DEPARTURES
              </button>
              <button
                onClick={() => setActiveTab('arrivals')}
                className={`text-7xl font-black transition-all duration-500 ${
                  activeTab === 'arrivals' 
                    ? 'text-emerald-400 scale-105' 
                    : 'text-gray-500 hover:text-gray-400'
                }`}
              >
                ARRIVALS
              </button>
            </div>

            {/* Time Display */}
            <div className="text-right">
              <div className="text-8xl font-black text-white mb-2 font-mono tracking-wider">
                {currentTime}
              </div>
              <div className="text-sm text-gray-400">
                Last updated: {lastUpdated}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flight Table */}
      <div className="bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {flightsData ? (
          filteredFlights.length > 0 ? (
            <FlightTable flights={filteredFlights} type={activeTab} />
          ) : (
            <div className="flex items-center justify-center h-32">
              <p className="text-2xl text-gray-400 font-semibold">No flights found</p>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
              <p className="text-xl text-gray-400 font-semibold">Loading flights...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}