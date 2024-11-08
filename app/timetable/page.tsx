'use client';
import { PlaneTakeoff, PlaneLanding } from 'lucide-react';
import { useEffect, useState } from 'react';
import '../globals.css'; // Adjust path if your file is in a different folder


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
  if (!time || time.length !== 4) return '-';
  const hours = time.substring(0, 2);
  const minutes = time.substring(2, 4);
  return `${hours}:${minutes}`;
};

const Departures = () => {
  const [departures, setDepartures] = useState<Flight[]>([]);
  const [arrivals, setArrivals] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'departures' | 'arrivals'>('departures');

  const fetchFlights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fetchFlights');
      if (!response.ok) throw new Error('Failed to fetch flights data');

      const data = await response.json();
      setDepartures(data.departures || []);
      setArrivals(data.arrivals || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();

    const intervalId = setInterval(fetchFlights, 60000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {/* Tabs */}
      <div className="flex mb-4">
        <button
          className={`w-1/2 px-4 py-2 rounded-l-lg text-lg font-semibold flex items-center justify-center space-x-2 ${
            activeTab === 'departures'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
          }`}
          onClick={() => setActiveTab('departures')}
        >
          <PlaneTakeoff size={20} />
          <span>Departures</span>
        </button>
        <button
          className={`w-1/2 px-4 py-2 rounded-r-lg text-lg font-semibold flex items-center justify-center space-x-2 ${
            activeTab === 'arrivals'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
          }`}
          onClick={() => setActiveTab('arrivals')}
        >
          <PlaneLanding size={20} />
          <span>Arrivals</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'departures' && (
        <>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center space-x-2 mt-8">
            <PlaneTakeoff size={24} />
            <span>Departures</span>
          </h2>
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
      : departure.status === 'Processing'
      ? 'bg-yellow-400 text-black font-bold blink'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100 font-bold'
  }`}
  
          
                      >
                        {departure.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 dark:text-gray-400 text-xl font-bold">Scheduled</div>
                        <div className="dark:text-gray-200 text-xl font-bold">{formatTime(departure.scheduled_out)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Estimated</div>
                        <div className="font-xl font-bold dark:text-gray-200">{formatTime(departure.estimated_out)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Actual</div>
                        <div className="font-medium dark:text-gray-200">
                          {departure.actual_out ? formatTime(departure.actual_out) : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">IATA code:</div>
                        <div className="font-medium text-yellow-500 dark:text-yellow-400">{departure.origin.code}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Destination</div>
                        <div className="text-red-500 dark:text-red-600 font-bold" style={{ fontSize: '24px' }}>
  {departure.destination.code}
</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Airline</div>
                        <div className="font-medium text-blue-500 dark:text-blue-400">{departure.KompanijaNaziv}</div>
                      </div>

                      {/* CheckIn pill */}
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">CheckIn</div>
                        <div className="mt-2 inline-flex items-center px-4 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full dark:text-green-100 dark:bg-green-900">
                          {departure.checkIn}
                        </div>
                      </div>

                      {/* Gate pill */}
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Gate</div>
                        <div className="mt-2 inline-flex items-center px-4 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full dark:text-green-100 dark:bg-green-900">
                          {departure.gate}
                        </div>
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
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center space-x-2 mt-8">
            <PlaneLanding size={24} />
            <span>Arrivals</span>
          </h2>
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
      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 blink'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
  }`}
  
                      >
                        {arrival.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 dark:text-gray-400 text-xl font-bold">Scheduled</div>
                        <div className="text-xl font-bold dark:text-gray-200">{formatTime(arrival.scheduled_out)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Estimated</div>
                        <div className="font-medium dark:text-gray-200">{formatTime(arrival.estimated_out)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Actual</div>
                        <div className="font-medium dark:text-gray-200">
                          {arrival.actual_out ? formatTime(arrival.actual_out) : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">IATA Code:</div>
                        <div className="font-medium text-yellow-500 dark:text-yellow-400">{arrival.origin.code}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Destination</div>
                        <div className="text-red-500 dark:text-red-600 font-bold" style={{ fontSize: '24px' }}>
  {arrival.destination.code}
</div>
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
      {/* Display Last Update Time */}
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Last data fetched at: <span>{lastUpdated}</span>
      </div>
    </div>
  );
};

export default Departures;
