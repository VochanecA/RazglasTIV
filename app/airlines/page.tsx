'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';
import { PlaneTakeoff, Lock, ArrowLeft, BarChart3, TrendingUp, Users } from 'lucide-react';

// Define the FlightData type based on your usage
interface FlightData {
  KompanijaNaziv: string;
  // Add other properties as needed
}

type AirlineCount = {
  name: string;
  value: number;
  color: string;
  percentage: number;
};

function AirlineDistributionCard({ flights }: { flights: FlightData[] }) {
  const [airlineData, setAirlineData] = useState<AirlineCount[]>([]);
  const [totalFlights, setTotalFlights] = useState(0);
  
  // Color palette for airlines
  const colors = [
    '#3b82f6', // blue-500
    '#ef4444', // red-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
    '#6366f1', // indigo-500
    '#84cc16', // lime-500
  ];

  useEffect(() => {
    if (!flights || flights.length === 0) return;

    // Count flights by airline
    const airlineCounts: Record<string, number> = {};
    flights.forEach(flight => {
      const airline = flight.KompanijaNaziv || 'Unknown';
      airlineCounts[airline] = (airlineCounts[airline] || 0) + 1;
    });

    // Convert to array and sort by count
    const sortedAirlines = Object.entries(airlineCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Create data for the chart
    const chartData: AirlineCount[] = sortedAirlines.map((airline, index) => ({
      name: airline.name,
      value: airline.count,
      color: colors[index % colors.length],
      percentage: Math.round((airline.count / flights.length) * 100)
    }));

    setAirlineData(chartData);
    setTotalFlights(flights.length);
  }, [flights]);

  const maxValue = Math.max(...airlineData.map(airline => airline.value));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Airlines Distribution</h3>
        <PlaneTakeoff className="w-5 h-5 text-blue-500 dark:text-blue-400" />
      </div>
      
      {airlineData.length > 0 ? (
        <div className="mt-6 space-y-4">
          {airlineData.map((airline, index) => {
            const barWidth = (airline.value / maxValue) * 100;
            const truncatedName = airline.name.length > 25 ? airline.name.substring(0, 22) + '...' : airline.name;
            
            return (
              <div key={index} className="group hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded-md transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300" title={airline.name}>
                    {truncatedName}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {airline.value} flights ({airline.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-700 ease-out shadow-sm"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: airline.color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500 dark:text-slate-400">No flight data available</p>
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-600">
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
          Total: {totalFlights} flight{totalFlights !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AirlinesPage() {
  const { user } = useUser();
  const router = useRouter();
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetchedTime, setLastFetchedTime] = useState<string | null>(null);
  const [showLoginMessage, setShowLoginMessage] = useState(false);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!user) {
      setShowLoginMessage(true);
      const redirectTimer = setTimeout(() => {
        router.push('/sign-in');
      }, 10000);
      return () => clearTimeout(redirectTimer);
    }
  }, [user, router]);

  // Fetch flights data
  useEffect(() => {
    if (!user) return;

    const fetchFlights = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/fetchFlights');
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setFlights(data);
          setLastFetchedTime(new Date().toLocaleString());
        } else {
          console.error('Unexpected data format:', data);
        }
      } catch (error) {
        console.error('Error fetching flight data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
    const intervalId = setInterval(fetchFlights, 300000); // 5 minutes
    return () => clearInterval(intervalId);
  }, [user]);

  // Login prompt
  if (!user && showLoginMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8 max-w-md w-full text-center">
          <Lock className="mx-auto mb-4 text-gray-500" size={48} />
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Login Required
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            To view airline statistics, you must log in to your account.
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

  if (!user) return null;

  // Calculate stats
  const uniqueAirlines = Array.from(new Set(flights.map(flight => flight.KompanijaNaziv))).length;
  const totalFlights = flights.length;
  const topAirline = flights.length > 0 ? 
    Object.entries(flights.reduce((acc, flight) => {
      const airline = flight.KompanijaNaziv || 'Unknown';
      acc[airline] = (acc[airline] || 0) + 1;
      return acc;
    }, {} as Record<string, number>))
    .sort(([,a], [,b]) => b - a)[0] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Airlines Statistics
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                View distribution and analytics of airline operations
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Airlines"
            value={uniqueAirlines}
            icon={<Users className="w-6 h-6 text-white" />}
            color="bg-blue-500"
          />
          <StatsCard
            title="Total Flights"
            value={totalFlights}
            icon={<BarChart3 className="w-6 h-6 text-white" />}
            color="bg-green-500"
          />
          <StatsCard
            title="Top Airline"
            value={topAirline ? `${topAirline[1]} flights` : 'N/A'}
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            color="bg-purple-500"
          />
        </div>

        {/* Main Distribution Chart */}
        <div className="mb-8">
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <AirlineDistributionCard flights={flights} />
          )}
        </div>

        {/* Footer */}
        {lastFetchedTime && (
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {lastFetchedTime}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}