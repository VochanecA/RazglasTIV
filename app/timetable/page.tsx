'use client';

import { useEffect, useState } from 'react';

interface Flight {
  ident: string;
  status: string;
  scheduled_out: string;
  estimated_out: string;
  actual_out: string | null;
  origin: { code: string };
  destination: { code: string };
  Kompanija: string; // Airline IATA code
  KompanijaNaziv: string; // Airline name
  checkIn: string; // CheckIn data
  gate: string; // Gate data
}

// Helper function to format time from HHMM to HH:MM format
const formatTime = (time: string) => {
  if (!time || time.length !== 4) return '-'; // Return '-' if time is invalid or empty
  const hours = time.substring(0, 2);
  const minutes = time.substring(2, 4);
  return `${hours}:${minutes}`;
};

const Departures = () => {
  const [departures, setDepartures] = useState<Flight[]>([]); // Initialize as empty array
  const [arrivals, setArrivals] = useState<Flight[]>([]); // Initialize as empty array
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>(''); // To store the last updated time
  const [activeTab, setActiveTab] = useState<'departures' | 'arrivals'>('departures'); // Active tab state

  const fetchFlights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fetchFlights');
      if (!response.ok) throw new Error('Failed to fetch flights data');

      const data = await response.json();
      // Only update flight data if the new data is different from the current data
      setDepartures(data.departures || []); // Ensure we set an empty array if data.departures is undefined
      setArrivals(data.arrivals || []); // Ensure we set an empty array if data.arrivals is undefined
      setLastUpdated(new Date().toLocaleTimeString()); // Update the last updated time
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights(); // Fetch data initially

    // Set up periodic fetching every 60 seconds
    const intervalId = setInterval(fetchFlights, 60000);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {/* Tabs */}
      <div className="flex mb-4">
        <button
          className={`w-1/2 px-4 py-2 rounded-l-lg text-lg font-semibold ${
            activeTab === 'departures'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
          }`}
          onClick={() => setActiveTab('departures')}
        >
          Departures
        </button>
        <button
          className={`w-1/2 px-4 py-2 rounded-r-lg text-lg font-semibold ${
            activeTab === 'arrivals'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
          }`}
          onClick={() => setActiveTab('arrivals')}
        >
          Arrivals
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'departures' && (
        <>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Departures</h2>
          <div className="grid grid-cols-1 gap-4">
            {departures.length > 0 ? (
              departures.map((departure) => (
                <div key={departure.ident} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-yellow-300">
                        {departure.Kompanija} {departure.ident}
                      </span>
                      <span
                        className={`px-2 py-1 text-sm font-semibold rounded-full ${
                          departure.status === 'Departed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                            : departure.status === 'Delayed'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                        }`}
                      >
                        {departure.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Scheduled</div>
                        <div className="font-medium dark:text-gray-200">{formatTime(departure.scheduled_out)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Estimated</div>
                        <div className="font-medium dark:text-gray-200">{formatTime(departure.estimated_out)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Actual</div>
                        <div className="font-medium dark:text-gray-200">
                          {departure.actual_out ? formatTime(departure.actual_out) : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Origin</div>
                        <div className="font-medium text-yellow-500 dark:text-yellow-400">{departure.origin.code}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Destination</div>
                        <div className="font-medium text-red-500 dark:text-red-500 text-lg">{departure.destination.code}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Airline</div>
                        <div className="font-medium text-blue-500 dark:text-blue-400">{departure.KompanijaNaziv}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No departures available.</p>
            )}
          </div>
        </>
      )}

      {activeTab === 'arrivals' && (
        <>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-8">Arrivals</h2>
          <div className="grid grid-cols-1 gap-4">
            {arrivals.length > 0 ? (
              arrivals.map((arrival) => (
                <div key={arrival.ident} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-yellow-300">
                        {arrival.Kompanija} {arrival.ident}
                      </span>
                      <span
                        className={`px-2 py-1 text-sm font-semibold rounded-full ${
                          arrival.status === 'Arrived'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                            : arrival.status === 'Delayed'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                        }`}
                      >
                        {arrival.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Scheduled</div>
                        <div className="font-medium dark:text-gray-200">{formatTime(arrival.scheduled_out)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Actual</div>
                        <div className="font-medium dark:text-gray-200">
                          {arrival.actual_out ? formatTime(arrival.actual_out) : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Origin</div>
                        <div className="font-medium text-yellow-500 dark:text-yellow-400">{arrival.origin.code}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Destination</div>
                        <div className="font-medium text-red-900 dark:text-yellow-500 text-lg">{arrival.destination.code}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Airline</div>
                        <div className="font-medium text-blue-500 dark:text-blue-400">{arrival.KompanijaNaziv}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No arrivals available.</p>
            )}
          </div>
        </>
      )}

      <div className="text-sm text-gray-600 dark:text-gray-300 mt-8">
        Last updated: {lastUpdated}
      </div>
    </div>
  );
};

export default Departures;
