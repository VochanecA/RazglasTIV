'use client';
import { PlaneTakeoff, PlaneLanding } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useNotification } from '@/components/ui/NotificationCenter';
import AirportTimetable from '@/components/ui/AirportTimetable';

// Custom Skeleton Component
const Skeleton = ({ className = '' }: { className?: string }) => {
  const baseClasses = "bg-gray-200 dark:bg-gray-700 animate-pulse rounded";
  return <div className={`${baseClasses} ${className}`} />;
};

interface Flight {
  ident: string;
  status: string;
  scheduled_out: string;
  estimated_out: string;
  actual_out: string | null;
  origin: { code: string };
  destination: { code: string };
  Kompanija: string;
  KompanijaICAO: string;
  KompanijaNaziv: string;
  checkIn: string;
  gate: string;
}

interface FlightData {
  departures: Flight[];
  arrivals: Flight[];
}

const formatTime = (time: string) => {
  if (!time || time.length !== 4) return '-';
  const hours = time.substring(0, 2);
  const minutes = time.substring(2, 4);
  return `${hours}:${minutes}`;
};

// Loading skeleton component for flight cards
const FlightCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden animate-pulse">
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Skeleton className="w-20 h-12" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-32" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const FlightCard = ({ flight, type }: { flight: Flight; type: 'departure' | 'arrival' }) => {
  const [logoError, setLogoError] = useState(false);
  const logoUrl = `https://www.flightaware.com/images/airline_logos/180px/${flight.KompanijaICAO}.png`;
  const placeholderUrl = 'https://via.placeholder.com/180x120?text=No+Logo';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-all duration-200 ease-in-out">
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-12 relative bg-white">
              <Image
                src={logoError ? placeholderUrl : logoUrl}
                alt={`${flight.KompanijaNaziv} logo`}
                fill
                className="object-contain"
                onError={() => setLogoError(true)}
                loading="eager"
                priority={true}
              />
            </div>
            <span className="text-2xl font-bold text-blue-600 dark:text-yellow-400">
              {flight.Kompanija} {flight.ident}
            </span>
          </div>
          <span
            className={`px-2 py-1 text-sm font-semibold rounded-full ${
              flight.status === (type === 'departure' ? 'Departed' : 'Arrived')
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                : flight.status === 'Delayed'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                : flight.status === 'Processing'
                ? 'bg-yellow-400 text-black font-bold blink'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100 font-bold'
            }`}
          >
            {flight.status === 'Processing' ? 'Check In Open' : flight.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500 dark:text-gray-400 text-xl font-bold">Scheduled</div>
            <div className="dark:text-gray-200 text-xl font-bold">{formatTime(flight.scheduled_out)}</div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">Estimated</div>
            <div className="font-xl font-bold dark:text-gray-200">{formatTime(flight.estimated_out)}</div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">Actual</div>
            <div className="font-medium dark:text-gray-200">
              {flight.actual_out ? formatTime(flight.actual_out) : '-'}
            </div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">IATA code:</div>
            <div className="font-medium text-yellow-500 dark:text-yellow-400">{flight.origin.code}</div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">Destination</div>
            <div className="text-red-500 dark:text-blue-300 font-bold text-2xl">
              {flight.destination.code}
            </div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400">Airline</div>
            <div className="font-medium text-blue-500 dark:text-blue-400">{flight.KompanijaNaziv}</div>
          </div>

          {type === 'departure' && (
            <>
              <div>
                <div className="text-gray-500 dark:text-gray-400">CheckIn</div>
                <div className="mt-2 inline-flex items-center px-4 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full dark:text-green-100 dark:bg-green-900">
                  {flight.checkIn}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Gate</div>
                <div className="mt-2 inline-flex items-center px-4 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full dark:text-green-100 dark:bg-green-900">
                  {flight.gate}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Departures = () => {
  const [activeTab, setActiveTab] = useState<'departures' | 'arrivals'>('departures');
  const [data, setData] = useState<FlightData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const { showNotification } = useNotification();
  const [notifiedFlights] = useState(new Set<string>());

  const fetchFlightData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/fetchFlights');
      if (!res.ok) throw new Error('Failed to fetch flights data');
      const newData = await res.json();
      
      // Check for notifications
      newData.arrivals.forEach((flight: Flight) => {
        if (flight.status === 'Delay' && !notifiedFlights.has(flight.ident)) {
          showNotification(
            'Delayed Arrival',
            `Flight ${flight.Kompanija} ${flight.ident} from ${flight.origin.code} is delayed in arrival compared to the scheduled time.`,
            'info'
          );
          notifiedFlights.add(flight.ident);
        }
        if (flight.status === 'Earlier' && !notifiedFlights.has(flight.ident)) {
          showNotification(
            'Earlier Arrival',
            `Flight ${flight.Kompanija} ${flight.ident} from ${flight.origin.code} is arriving earlier than scheduled.`,
            'info'
          );
          notifiedFlights.add(flight.ident);
        }
      });

      setData(newData);
      setError(null);
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flights data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlightData();
    const interval = setInterval(fetchFlightData, 90000);
    return () => clearInterval(interval);
  }, []);

  const departures = data?.departures || [];
  const arrivals = data?.arrivals || [];

  return (
    <div className="min-h-screen">
      {/* Add AirportTimetable component */}
      {data && (
        <AirportTimetable
          departures={data.departures}
          arrivals={data.arrivals}
        />
      )}

      <div className="flex mb-4">
        <button
          className={`w-1/2 px-4 py-2 rounded-l-lg text-lg font-semibold flex items-center justify-center space-x-2 transition-colors duration-200 ${
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
          className={`w-1/2 px-4 py-2 rounded-r-lg text-lg font-semibold flex items-center justify-center space-x-2 transition-colors duration-200 ${
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

      {error && (
        <div className="text-red-500 dark:text-red-400 p-4 rounded-lg bg-red-100 dark:bg-red-900 mb-4">
          Error loading flight data. Please try again later.
        </div>
      )}

      {activeTab === 'departures' && (
        <>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center space-x-2 mt-8">
            <PlaneTakeoff size={24} />
            <span>Departures</span>
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              [...Array(3)].map((_, index) => <FlightCardSkeleton key={index} />)
            ) : departures.length > 0 ? (
              departures.map((departure: Flight) => (
                <FlightCard key={departure.ident} flight={departure} type="departure" />
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
            {isLoading ? (
              [...Array(3)].map((_, index) => <FlightCardSkeleton key={index} />)
            ) : arrivals.length > 0 ? (
              arrivals.map((arrival: Flight) => (
                <FlightCard key={arrival.ident} flight={arrival} type="arrival" />
              ))
            ) : (
              <p>No arrivals available.</p>
            )}
          </div>
        </>
      )}

      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Last fetched at: <span>{lastUpdated}</span>
      </div>
    </div>
  );
};

export default Departures;