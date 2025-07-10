// FlightDistributionBoard.tsx
import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Plane, Info, ChevronRight, ChevronDown } from 'lucide-react';
import { Flight, FlightData } from '@/types/flight';

const FlightDashboard = () => {
  const [data, setData] = useState<FlightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'arrivals' | 'departures'>('departures');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [expandedView, setExpandedView] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setIsDarkMode(initialTheme === 'dark');
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fetchFlights');
      if (!response.ok) {
        throw new Error('Failed to fetch flight data');
      }
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Could not load flight data. Please try again later.');
      console.error('Error fetching flights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const getStatusCounts = (flights: Flight[] = []) => {
    return flights.reduce((acc, flight) => {
      acc[flight.status] = (acc[flight.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const getAirlineCounts = (flights: Flight[] = []) => {
    const counts = flights.reduce((acc, flight) => {
      acc[flight.KompanijaNaziv] = (acc[flight.KompanijaNaziv] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const getCheckInCounters = (flights: Flight[] = []) => {
    return flights
      .filter(f => f.checkIn && f.checkIn !== '')
      .map(f => ({
        flight: f.ident,
        counter: f.checkIn,
        status: f.status
      }));
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading flight information...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500 dark:text-red-400">
        <Info className="w-8 h-8 mb-2" />
        <p>{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 mt-4 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  const flights = data?.[activeTab] || [];
  const statusCounts = getStatusCounts(flights);
  const airlineCounts = getAirlineCounts(flights);
  const checkInCounters = getCheckInCounters(flights);

  // Blinking CheckInCounter component with faster blinking (400ms)
  const CheckInCounter = ({ counter, isInUse, status }: { counter: number, isInUse: boolean, status?: string }) => {
    const [isBlinking, setIsBlinking] = useState(false);

    useEffect(() => {
      if (status === 'Processing') {
        const interval = setInterval(() => {
          setIsBlinking(prev => !prev);
        }, 400); // Blink every 400ms
        return () => clearInterval(interval);
      }
    }, [status]);

    return (
      <div
        className={`flex items-center justify-center p-3 rounded-lg transition-all ${
          isInUse
            ? status === 'Processing'
              ? `bg-red-500 text-white ${isBlinking ? 'opacity-40' : 'opacity-100'}`
              : 'bg-red-500 text-white'
            : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-400'
        } shadow-sm hover:shadow-md`}
      >
        <span className="text-sm font-medium">{counter}</span>
      </div>
    );
  };

  // Text colors based on theme
  const textColor = isDarkMode ? 'text-gray-200' : 'text-gray-900';
  const secondaryTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const bgColor = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const hoverBgColor = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

  return (
    <div className={`container mx-auto p-4 max-w-7xl ${isDarkMode ? 'dark' : ''}`}>
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${textColor}`}>Tivat Airport Flight Dashboard</h1>
          <p className={`text-sm ${secondaryTextColor} mt-1`}>Real-time flight information</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm ${secondaryTextColor} whitespace-nowrap`}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchData}
            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            disabled={loading}
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${secondaryTextColor} ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`flex border-b ${borderColor} mb-6`}>
        <button
          className={`px-4 py-3 font-medium text-sm flex items-center gap-2 transition-colors ${
            activeTab === 'departures'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400'
              : `${secondaryTextColor} hover:text-gray-700 dark:hover:text-gray-300`
          }`}
          onClick={() => setActiveTab('departures')}
        >
          <Plane className="w-4 h-4 transform rotate-45" />
          Departures
          {activeTab === 'departures' && (
            <span className="ml-1 text-xs font-normal bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full">
              {flights.length}
            </span>
          )}
        </button>
        <button
          className={`px-4 py-3 font-medium text-sm flex items-center gap-2 transition-colors ${
            activeTab === 'arrivals'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400'
              : `${secondaryTextColor} hover:text-gray-700 dark:hover:text-gray-300`
          }`}
          onClick={() => setActiveTab('arrivals')}
        >
          <Plane className="w-4 h-4 transform -rotate-45" />
          Arrivals
          {activeTab === 'arrivals' && (
            <span className="ml-1 text-xs font-normal bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full">
              {flights.length}
            </span>
          )}
        </button>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flight Schedule Overview Card */}
        <div className={`${bgColor} p-6 rounded-xl shadow-sm border ${borderColor} col-span-1 lg:col-span-2`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg font-semibold ${textColor}`}>
              Flight Schedule Overview
            </h2>
            <div className={`text-sm font-medium ${secondaryTextColor} flex items-center gap-2`}>
              {flights.length} Flights
              <button
                onClick={() => setExpandedView(!expandedView)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs flex items-center"
              >
                {expandedView ? (
                  <>
                    <ChevronDown className="w-4 h-4" /> Collapse
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4" /> View All
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${borderColor}`}>
                  <th className={`px-3 py-3 text-left text-xs font-medium ${secondaryTextColor} uppercase tracking-wider`}>Flight</th>
                  <th className={`px-3 py-3 text-left text-xs font-medium ${secondaryTextColor} uppercase tracking-wider`}>Time</th>
                  <th className={`px-3 py-3 text-left text-xs font-medium ${secondaryTextColor} uppercase tracking-wider`}>
                    {activeTab === 'departures' ? 'To' : 'From'}
                  </th>
                  <th className={`px-3 py-3 text-left text-xs font-medium ${secondaryTextColor} uppercase tracking-wider`}>Status</th>
                  <th className={`px-3 py-3 text-left text-xs font-medium ${secondaryTextColor} uppercase tracking-wider`}>Check-in</th>
                  <th className={`px-3 py-3 text-left text-xs font-medium ${secondaryTextColor} uppercase tracking-wider`}>Gate</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${borderColor}`}>
                {flights.length > 0 ? (
                  (expandedView ? flights : flights.slice(0, 8)).map((flight) => (
                    <tr key={flight.ident} className={`${hoverBgColor} transition-colors`}>
                      <td className={`px-3 py-4 text-sm font-medium ${textColor}`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full flex items-center justify-center text-xs ${secondaryTextColor}`}>
                            {flight.KompanijaICAO?.substring(0, 2) || '??'}
                          </span>
                          <span className="font-medium">{flight.ident}</span>
                        </div>
                      </td>
                      <td className={`px-3 py-4 text-sm ${secondaryTextColor} whitespace-nowrap`}>
                        <div className="flex flex-col">
                          <span>{activeTab === 'departures' ? flight.scheduled_out : flight.scheduled_in}</span>
                          {(activeTab === 'departures' && flight.estimated_out && flight.estimated_out !== flight.scheduled_out) && (
                            <span className="text-xs text-amber-600 dark:text-amber-400">Est: {flight.estimated_out}</span>
                          )}
                          {(activeTab === 'arrivals' && flight.estimated_in && flight.estimated_in !== flight.scheduled_in) && (
                            <span className="text-xs text-amber-600 dark:text-amber-400">Est: {flight.estimated_in}</span>
                          )}
                        </div>
                      </td>
                      <td className={`px-3 py-4 text-sm ${secondaryTextColor}`}>
                        <div className="flex flex-col">
                          <span className="font-medium">{activeTab === 'departures' ? flight.destination.code : flight.origin.code}</span>
                          <span className="text-xs truncate max-w-[120px]">{flight.grad}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm">
                        <StatusBadge status={flight.status} isDarkMode={isDarkMode} />
                      </td>
                      <td className="px-3 py-4 text-sm">
                        {flight.checkIn && (
                          <div className="flex gap-1 flex-wrap">
                            {flight.checkIn.split(',').map(counter => (
                              <span
                                key={counter}
                                className={`px-2 py-1 rounded text-xs ${
                                  flight.status === 'Processing'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                }`}
                              >
                                {counter.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className={`px-3 py-4 text-sm ${secondaryTextColor}`}>
                        {flight.gate || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={`px-3 py-4 text-sm text-center ${secondaryTextColor}`}>
                      No flights scheduled
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Status Distribution Card */}
          <div className={`${bgColor} p-6 rounded-xl shadow-sm border ${borderColor}`}>
            <h2 className={`text-lg font-semibold ${textColor} mb-4`}>
              Flight Status Distribution
            </h2>
            <div className="space-y-4">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={status} isDarkMode={isDarkMode} />
                    <span className={`text-sm ${secondaryTextColor}`}>{status}</span>
                  </div>
                  <span className={`font-medium ${textColor}`}>{count}</span>
                </div>
              ))}
              {Object.keys(statusCounts).length === 0 && (
                <div className={`text-sm ${secondaryTextColor} text-center py-6`}>
                  No status data available
                </div>
              )}
            </div>
          </div>

          {/* Airline Distribution Card */}
          <div className={`${bgColor} p-6 rounded-xl shadow-sm border ${borderColor}`}>
            <h2 className={`text-lg font-semibold ${textColor} mb-4`}>
              Top Airlines
            </h2>
            <div className="space-y-3">
              {airlineCounts.map(([airline, count]) => (
                <div key={airline} className="flex items-center justify-between">
                  <span className={`text-sm ${secondaryTextColor} truncate flex-1`}>{airline}</span>
                  <div className="flex items-center gap-3 w-32">
                    <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2.5`}>
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${(count / flights.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${textColor} min-w-[20px] text-right`}>{count}</span>
                  </div>
                </div>
              ))}
              {airlineCounts.length === 0 && (
                <div className={`text-sm ${secondaryTextColor} text-center py-6`}>
                  No airline data available
                </div>
              )}
            </div>
          </div>

          {/* Check-in Counter Status Card */}
          <div className={`${bgColor} p-6 rounded-xl shadow-sm border ${borderColor}`}>
            <h2 className={`text-lg font-semibold ${textColor} mb-4`}>
              Check-in Counters
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((counter) => {
                const counterStr = counter < 10 ? `0${counter}` : counter.toString();
                const counterData = checkInCounters.find(c =>
                  c.counter.split(',').map(c => c.trim()).includes(counterStr)
                );

                return (
                  <CheckInCounter
                    key={counter}
                    counter={counter}
                    isInUse={!!counterData}
                    status={counterData?.status}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Status Badge Component with dark mode support
const StatusBadge = ({ status, isDarkMode = false }: { status: string, isDarkMode?: boolean }) => {
  const statusMap: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
    'scheduled': { bg: 'bg-gray-100', text: 'text-gray-800', darkBg: 'bg-gray-700', darkText: 'text-gray-200' },
    'boarding': { bg: 'bg-blue-100', text: 'text-blue-800', darkBg: 'bg-blue-900', darkText: 'text-blue-200' },
    'final call': { bg: 'bg-orange-100', text: 'text-orange-800', darkBg: 'bg-orange-900', darkText: 'text-orange-200' },
    'departed': { bg: 'bg-green-100', text: 'text-green-800', darkBg: 'bg-green-900', darkText: 'text-green-200' },
    'arrived': { bg: 'bg-green-100', text: 'text-green-800', darkBg: 'bg-green-900', darkText: 'text-green-200' },
    'delayed': { bg: 'bg-amber-100', text: 'text-amber-800', darkBg: 'bg-amber-900', darkText: 'text-amber-200' },
    'cancelled': { bg: 'bg-red-100', text: 'text-red-800', darkBg: 'bg-red-900', darkText: 'text-red-200' },
    'processing': { bg: 'bg-purple-100', text: 'text-purple-800', darkBg: 'bg-purple-900', darkText: 'text-purple-200' },
    'closed': { bg: 'bg-gray-100', text: 'text-gray-500', darkBg: 'bg-gray-700', darkText: 'text-gray-400' },
  };

  const { bg, text, darkBg, darkText } = statusMap[status.toLowerCase()] || {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    darkBg: 'bg-gray-700',
    darkText: 'text-gray-200'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
      isDarkMode ? `${darkBg} ${darkText}` : `${bg} ${text}`
    }`}>
      {status}
    </span>
  );
};

export default FlightDashboard;
