import { useEffect, useState } from 'react';
import { Clock, Plane, ArrowRight, FilterX } from 'lucide-react';

// Define the flight data type based on your JSON
export type FlightData = {
  Updateovano: string;
  Datum: string;
  Dan: string;
  TipLeta: string;
  KompanijaNaziv: string;
  Logo: string;
  Kompanija: string;
  KompanijaICAO: string;
  BrojLeta: string;
  CodeShare: string;
  IATA: string;
  Grad: string;
  Planirano: string;
  Predvidjeno: string;
  Aktuelno: string;
  Terminal: string;
  Karusel: string;
  CheckIn: string;
  Gate: string;
  Aerodrom: string;
  Status: string;
  Via: string;
  StatusEN: string;
  StatusMN: string;
};

// Props for the component
interface FlightScheduleCardProps {
  flights: FlightData[];
  maxFlights?: number;
  showFilter?: boolean;
}

export function FlightScheduleCard({ flights, maxFlights = 5, showFilter = true }: FlightScheduleCardProps) {
  const [filteredFlights, setFilteredFlights] = useState<FlightData[]>([]);
  const [filter, setFilter] = useState<string>('all'); // 'all', 'departed', 'processing'

  useEffect(() => {
    // Apply filter
    let result = [...flights];
    
    if (filter === 'departed') {
      result = result.filter(flight => flight.StatusEN === 'Departed');
    } else if (filter === 'processing') {
      result = result.filter(flight => flight.StatusEN === 'Processing');
    }
    
    // Sort by planned departure time
    result.sort((a, b) => {
      const timeA = parseInt(a.Planirano.replace(':', ''));
      const timeB = parseInt(b.Planirano.replace(':', ''));
      return timeA - timeB;
    });
    
    // Limit the number of flights
    setFilteredFlights(result.slice(0, maxFlights));
  }, [flights, filter, maxFlights]);

  // Helper function to format time
  const formatTime = (time: string) => {
    if (!time || time === " ") return "—";
    return `${time.substring(0, 2)}:${time.substring(2, 4)}`;
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Departed':
        return 'text-green-600 dark:text-green-500';
      case 'Processing':
        return 'text-amber-600 dark:text-amber-500';
      default:
        return 'text-blue-600 dark:text-blue-500';
    }
  };

  // Helper function to get a shortened airline name
  const getShortenedAirlineName = (name: string) => {
    if (name.length > 15) {
      return name.substring(0, 15) + '...';
    }
    return name;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Flight Schedule</h3>
        <Plane className="w-4 h-4 text-blue-500 dark:text-blue-400" />
      </div>
      
      {showFilter && (
        <div className="flex gap-2 mb-3">
          <button 
            onClick={() => setFilter('all')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              filter === 'all' 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('departed')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              filter === 'departed' 
                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            Departed
          </button>
          <button 
            onClick={() => setFilter('processing')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              filter === 'processing' 
                ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            Check-in
          </button>
        </div>
      )}
      
      {filteredFlights.length > 0 ? (
        <div className="space-y-3">
          {filteredFlights.map((flight, index) => (
            <div 
              key={`${flight.Kompanija}-${flight.BrojLeta}`}
              className={`p-2 rounded-md ${
                index % 2 === 0 
                  ? 'bg-slate-50 dark:bg-slate-800/50' 
                  : 'bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-16">
                    {formatTime(flight.Planirano)}
                  </span>
                  <span className="font-medium text-sm text-slate-800 dark:text-white">
                    {flight.IATA}
                  </span>
                  <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                    ({flight.Grad})
                  </span>
                </div>
                <span className={`text-xs font-medium ${getStatusColor(flight.StatusEN)}`}>
                  {flight.StatusEN}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 w-16">
                    {flight.Kompanija} {flight.BrojLeta}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-32">
                    {getShortenedAirlineName(flight.KompanijaNaziv)}
                  </span>
                </div>
                
                <div className="flex items-center text-xs">
                  {flight.Gate && (
                    <span className="text-slate-600 dark:text-slate-400">
                      Gate {flight.Gate}
                    </span>
                  )}
                  {flight.CheckIn && flight.StatusEN === 'Processing' && (
                    <span className="ml-2 text-slate-600 dark:text-slate-400">
                      Check-in {flight.CheckIn}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <FilterX className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No flights match the selected filter</p>
          <button 
            onClick={() => setFilter('all')}
            className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Show all flights
          </button>
        </div>
      )}
    </div>
  );
}