// components/ui/FlightDelayCalculator.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import WeatherCard from './WeatherCard';

import { 
  Clock, 
  CalendarClock, 
  ArrowUp, 
  ArrowDown, 
  Plane, 
  AlertCircle, 
  CheckCircle2, 
  Clock3, 
  ChevronRight,
  Award,
  AlertTriangle,
  BarChart3,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon
} from 'lucide-react';

interface Flight {
  Planirano: string;
  Aktuelno: string;
  KompanijaNaziv: string;
  BrojLeta: string;
  Grad: string;
  StatusEN: string;
}

interface FlightDelayStats {
  averageDelay: number;
  totalFlights: number;
  delayedFlights: number;
  onTimeFlights: number;
  earlyFlights: number;
  maxDelay: number;
  maxDelayFlight?: Flight;
}



const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

const FlightDelayCalculator = () => {
  const [flightData, setFlightData] = useState<Flight[]>([]);
  const [stats, setStats] = useState<FlightDelayStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize theme based on user's preference
  useEffect(() => {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    setDarkMode(savedTheme === 'dark' || (!savedTheme && prefersDark));
    
    // Apply theme to document
    document.documentElement.classList.toggle('dark', savedTheme === 'dark' || (!savedTheme && prefersDark));
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Save preference to localStorage
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    
    // Apply theme to document
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  // Calculate delay in minutes between scheduled and actual time
  const calculateDelayMinutes = (scheduled: string, actual: string): number => {
    if (!scheduled || !actual) return 0;
    
    const scheduledHours = parseInt(scheduled.substring(0, 2));
    const scheduledMinutes = parseInt(scheduled.substring(2));
    const actualHours = parseInt(actual.substring(0, 2));
    const actualMinutes = parseInt(actual.substring(2));
    
    const scheduledTotalMinutes = scheduledHours * 60 + scheduledMinutes;
    const actualTotalMinutes = actualHours * 60 + actualMinutes;
    
    return actualTotalMinutes - scheduledTotalMinutes;
  };

  // Format minutes as hours and minutes
  const formatDelay = (minutes: number): string => {
    if (minutes === 0) return '0m';
    
    const sign = minutes < 0 ? '-' : '+';
    const absMinutes = Math.abs(minutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;
    
    let result = sign;
    if (hours > 0) {
      result += `${hours}h`;
      if (mins > 0) {
        result += ` ${mins}m`;
      }
    } else {
      result += `${mins}m`;
    }
    
    return result;
  };

  // Format time from HHMM to HH:MM
  const formatTime = (time: string): string => {
    if (!time || time.length !== 4) return '';
    return `${time.substring(0, 2)}:${time.substring(2)}`;
  };

  // Format the last refreshed time
  const formatLastRefreshed = (date: Date | null): string => {
    if (!date) return 'Never';
    
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Calculate all statistics from flight data
  const calculateStats = (flights: Flight[]): FlightDelayStats => {
    let totalDelay = 0;
    let maxDelay = 0;
    let maxDelayFlight: Flight | undefined;
    let delayedCount = 0;
    let onTimeCount = 0;
    let earlyCount = 0;

    flights.forEach(flight => {
      const delay = calculateDelayMinutes(flight.Planirano, flight.Aktuelno);
      
      if (delay > 0) {
        delayedCount++;
      } else if (delay < 0) {
        earlyCount++;
      } else {
        onTimeCount++;
      }
      
      totalDelay += delay;
      
      if (delay > maxDelay) {
        maxDelay = delay;
        maxDelayFlight = flight;
      }
    });

    const averageDelay = flights.length ? totalDelay / flights.length : 0;

    return {
      averageDelay,
      totalFlights: flights.length,
      delayedFlights: delayedCount,
      onTimeFlights: onTimeCount,
      earlyFlights: earlyCount,
      maxDelay,
      maxDelayFlight
    };
  };

  // Toggle table expansion
  const toggleTable = () => {
    setIsTableExpanded(!isTableExpanded);
  };

  // Manual refresh function
  const refreshData = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    await fetchFlights();
    setIsRefreshing(false);
    setLastRefreshed(new Date());
  };

  // Setup auto-refresh
  const setupAutoRefresh = () => {
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
    }
    
    autoRefreshTimerRef.current = setInterval(() => {
      refreshData();
    }, AUTO_REFRESH_INTERVAL);
    
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  };

  const fetchFlights = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/fetchFlights');
      
      if (!response.ok) {
        throw new Error('Failed to fetch flight data');
      }
      
      const data = await response.json();
      
      // Combine arrivals and departures
      const allFlights = [...data.departures, ...data.arrivals];
      
      // Convert from processed format back to original format
      const convertedFlights = allFlights.map(flight => ({
        Planirano: flight.scheduled_out.replace(':', ''),
        Aktuelno: flight.actual_out.replace(':', ''),
        KompanijaNaziv: flight.KompanijaNaziv,
        BrojLeta: flight.ident,
        Grad: flight.grad,
        StatusEN: flight.status
      })).filter(flight => flight.Planirano && flight.Aktuelno);
      
      // Sort flights by scheduled time
      const sortedFlights = convertedFlights.sort((a, b) => 
        parseInt(a.Planirano) - parseInt(b.Planirano)
      );
      
      setFlightData(sortedFlights);
      setStats(calculateStats(sortedFlights));
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
    
    // Setup auto-refresh when component mounts
    const cleanup = setupAutoRefresh();
    
    // Clean up auto-refresh on unmount
    return cleanup;
  }, []);

  if (isLoading && !flightData.length) {
    return (
      <div className="flex items-center justify-center min-h-64 p-6 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 dark:border-blue-400 mb-3"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading flight data...</p>
        </div>
      </div>
    );
  }

  if (error && !flightData.length) {
    return (
      <div className="p-4 dark:bg-gray-900">
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            <h3 className="font-semibold text-sm">Error Loading Flight Data</h3>
          </div>
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 dark:bg-gray-900 rounded-lg transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            <h1 className="text-lg font-semibold text-slate-800 dark:text-white">Flight Delay Analysis</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Last updated: {formatLastRefreshed(lastRefreshed)}
            </span>
            <button 
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center px-3 py-1.5 rounded bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400 text-xs font-medium transition-colors duration-150"
            >
              <RefreshCcw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-150"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {stats && (
  <div className="grid grid-cols-1 gap-4 mb-4">
      <WeatherCard />
    {/* Average Delay Card */}
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors duration-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">Average Delay</h3>
        <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
      </div>
      <p className={`text-2xl font-semibold ${stats.averageDelay > 0 ? 'text-amber-600 dark:text-amber-500' : stats.averageDelay < 0 ? 'text-green-600 dark:text-green-500' : 'text-blue-600 dark:text-blue-500'}`}>
        {formatDelay(Math.round(stats.averageDelay))}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across {stats.totalFlights} flights</p>
    </div>
    
    {/* Flight Status Card */}
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors duration-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">Flight Status</h3>
        <Plane className="w-4 h-4 text-blue-500 dark:text-blue-400" />
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="flex flex-col">
          <div className="flex items-center mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></div>
            <span className="text-xs text-slate-600 dark:text-slate-300">Delayed</span>
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{stats.delayedFlights} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({Math.round(stats.delayedFlights / stats.totalFlights * 100)}%)</span></p>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
            <span className="text-xs text-slate-600 dark:text-slate-300">Early</span>
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{stats.earlyFlights} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({Math.round(stats.earlyFlights / stats.totalFlights * 100)}%)</span></p>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></div>
            <span className="text-xs text-slate-600 dark:text-slate-300">On-Time</span>
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{stats.onTimeFlights} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({Math.round(stats.onTimeFlights / stats.totalFlights * 100)}%)</span></p>
        </div>
      </div>
    </div>
    
    {/* Most Delayed Flight Card */}
    {stats.maxDelayFlight && (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors duration-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">Most Delayed Flight</h3>
          <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
        </div>
        <div className="flex items-center mb-1">
          <Award className="w-4 h-4 mr-1 text-amber-500 dark:text-amber-400" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{stats.maxDelayFlight.KompanijaNaziv} {stats.maxDelayFlight.BrojLeta}</p>
        </div>
        <div className="flex items-center text-xs text-slate-600 dark:text-slate-300 mb-1">
          <ChevronRight className="w-3 h-3 mr-1" />
          <span>{stats.maxDelayFlight.Grad}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 dark:text-slate-400">Scheduled</span>
            <span className="text-sm font-medium text-slate-800 dark:text-white">{formatTime(stats.maxDelayFlight.Planirano)}</span>
          </div>
          <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 dark:text-slate-400">Actual</span>
            <span className="text-sm font-medium text-slate-800 dark:text-white">{formatTime(stats.maxDelayFlight.Aktuelno)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-500 dark:text-slate-400">Delay</span>
            <span className="text-sm font-medium text-amber-600 dark:text-amber-500">{formatDelay(stats.maxDelay)}</span>
          </div>
        </div>
      </div>
    )}
  </div>
)}

        {/* Manual refresh button below cards */}
        <div className="mb-4 flex justify-center">
          <button 
            onClick={refreshData}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 rounded-full bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-medium transition-colors duration-150 shadow-sm"
          >
            <RefreshCcw className={`w-3.5 h-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing Data...' : 'Refresh Flight Data'}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-4 transition-colors duration-200">
          <div 
            className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
            onClick={toggleTable}
          >
            <div className="flex items-center">
              <CalendarClock className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
                Flight Delay Details 
                <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                  ({flightData.length} flights sorted by scheduled time)
                </span>
              </h2>
            </div>
            <div>
              {isTableExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              )}
            </div>
          </div>
          
          {isTableExpanded && flightData.length > 0 && (
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70">
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Airline</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Flight</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Destination</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scheduled</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actual</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Delay</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-gray-800">
                  {flightData.map((flight, index) => {
                    const delay = calculateDelayMinutes(flight.Planirano, flight.Aktuelno);
                    let statusIcon;
                    let delayClass;
                    
                    if (delay > 0) {
                      statusIcon = <ArrowUp className="w-3 h-3 text-amber-500 dark:text-amber-400" />;
                      delayClass = 'text-amber-600 dark:text-amber-500';
                    } else if (delay < 0) {
                      statusIcon = <ArrowDown className="w-3 h-3 text-green-500 dark:text-green-400" />;
                      delayClass = 'text-green-600 dark:text-green-500';
                    } else {
                      statusIcon = <Clock3 className="w-3 h-3 text-blue-500 dark:text-blue-400" />;
                      delayClass = 'text-blue-600 dark:text-blue-500';
                    }
                    
                    return (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors duration-150">
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">{flight.KompanijaNaziv}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-slate-800 dark:text-white">{flight.BrojLeta}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">{flight.Grad}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">{formatTime(flight.Planirano)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">{formatTime(flight.Aktuelno)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <div className="flex items-center">
                            {statusIcon}
                            <span className={`ml-1 ${delayClass}`}>{formatDelay(delay)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium 
                            ${flight.StatusEN === 'Departed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 
                              flight.StatusEN === 'Arrived' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                              flight.StatusEN === 'Boarding' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 
                              flight.StatusEN === 'Delayed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                              'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>
                            <StatusIcon status={flight.StatusEN} className="w-3 h-3 mr-1" />
                            {flight.StatusEN}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {isTableExpanded && flightData.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center">
              <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No flight data available</p>
            </div>
          )}
          
          {!isTableExpanded && (
            <div className="py-6 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 bg-opacity-50">
              <ChevronDown className="w-6 h-6 animate-bounce" />
              <p className="text-xs">Click to expand flight details</p>
            </div>
          )}
        </div>

        {/* Auto-refresh indicator */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 mb-4">
          <div className="flex items-center justify-center">
            <RefreshCcw className="w-3 h-3 mr-1.5 text-slate-400 dark:text-slate-500" />
            <span>Data auto-refreshes every 5 minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper components
const ArrowRight = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
);

const StatusIcon = ({ status, className }: { status: string, className?: string }) => {
  switch (status) {
    case 'Departed':
      return <Plane className={className} />;
    case 'Arrived':
      return <CheckCircle2 className={className} />;
    case 'Boarding':
      return <Clock className={className} />;
    case 'Delayed':
      return <AlertCircle className={className} />;
    default:
      return <Clock3 className={className} />;
  }
};

export default FlightDelayCalculator;