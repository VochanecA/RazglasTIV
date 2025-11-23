'use client';
import { useEffect, useState } from 'react';
import { ClipboardCheck, Clock } from 'lucide-react';
import { Flight } from '@/types/flight';

interface CheckinCounterCardProps {
  flights: Flight[];
  refreshInterval?: number; // in milliseconds
}

type CounterStatus = {
  counter: string;
  airlines: string[];
  flights: string[];
  destinations: string[];
  isActive: boolean;
};

export function CheckinCounterCard({ flights, refreshInterval = 60000 }: CheckinCounterCardProps) {
  const [counters, setCounters] = useState<CounterStatus[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [blinkState, setBlinkState] = useState<boolean>(true);

  // Function to process flight data and extract check-in counter information
  const processFlightData = () => {
    if (!flights || flights.length === 0) return;

    // Reset counters on each update to ensure we only show currently active ones
    const counterMap = new Map<string, CounterStatus>();
    
    // Only consider flights that are in processing status (check-in)
    const processingFlights = flights.filter(flight => 
      flight.status === 'Processing' && flight.checkIn && flight.checkIn.trim() !== ''
    );
    
    console.log(`Found ${processingFlights.length} flights in processing status`);
    
    processingFlights.forEach(flight => {
      // A flight might use multiple check-in counters
      const counterNumbers = flight.checkIn.split(',').map(c => c.trim());
      
      console.log(`Flight ${flight.Kompanija}${flight.ident} using counters: ${counterNumbers.join(', ')}`);
      
      counterNumbers.forEach(counter => {
        if (!counterMap.has(counter)) {
          counterMap.set(counter, {
            counter,
            airlines: [],
            flights: [],
            destinations: [],
            isActive: true // Mark as active since it's in processing status
          });
        }
        
        const counterInfo = counterMap.get(counter)!;
        
        // Add airline if not already in the list
        if (!counterInfo.airlines.includes(flight.KompanijaNaziv)) {
          counterInfo.airlines.push(flight.KompanijaNaziv);
        }
        
        // Add flight number
        counterInfo.flights.push(`${flight.Kompanija}${flight.ident}`);
        
        // Add destination if not already in the list
        if (!counterInfo.destinations.includes(flight.grad)) {
          counterInfo.destinations.push(flight.grad);
        }
      });
    });
    
    // Convert map to array and sort by counter number
    const countersArray = Array.from(counterMap.values())
      .sort((a, b) => {
        // Handle numeric sorting properly
        const numA = parseInt(a.counter);
        const numB = parseInt(b.counter);
        return isNaN(numA) || isNaN(numB) ? a.counter.localeCompare(b.counter) : numA - numB;
      });
    
    console.log(`Displaying ${countersArray.length} active counters: ${countersArray.map(c => c.counter).join(', ')}`);
    
    setCounters(countersArray);
    setLastUpdated(new Date());
  };

  // Initial processing
  useEffect(() => {
    processFlightData();
  }, [flights]);

  // Set up refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      processFlightData();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [flights, refreshInterval]);

  // Set up blinking effect for active counters
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkState(prev => !prev);
    }, 1000); // Blink every second
    
    return () => clearInterval(blinkInterval);
  }, []);

  // Format the last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Debug function - remove in production
  const getDebugInfo = () => {
    if (!flights || flights.length === 0) return "No flights data";
    
    const processingFlights = flights.filter(flight => 
      flight.status === 'Processing' && flight.checkIn && flight.checkIn.trim() !== ''
    );
    
    return `Total flights: ${flights.length}, Processing flights: ${processingFlights.length}, Showing counters: ${counters.map(c => c.counter).join(', ')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Check-in Counters</h3>
          {lastUpdated && (
            <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">
              Updated: {formatLastUpdated()}
            </span>
          )}
        </div>
        <ClipboardCheck className="w-4 h-4 text-blue-500 dark:text-blue-400" />
      </div>
      
      {/* Debug info - remove in production */}
      <div className="text-xs text-slate-400 mb-2 hidden">
        {getDebugInfo()}
      </div>
      
      {counters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {counters.map((counter) => (
            <div 
              key={counter.counter}
              className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-3 border border-slate-100 dark:border-slate-700/50"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-2 transition-colors duration-300
                    ${blinkState 
                      ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'}`}
                  >
                    {counter.counter}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {counter.airlines.join(', ')}
                  </span>
                </div>
                <div className="flex items-center bg-green-100 dark:bg-green-900/30 py-0.5 px-1.5 rounded text-green-700 dark:text-green-400">
                  <Clock className="w-3 h-3 mr-1" />
                  <span className="text-xs">Active</span>
                </div>
              </div>
              
              <div className="text-xs">
                <div className="flex mb-1">
                  <span className="text-slate-500 dark:text-slate-400 w-16">Flights:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {counter.flights.join(', ')}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-slate-500 dark:text-slate-400 w-16">To:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {counter.destinations.join(', ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-8 text-center">
          <div>
            <ClipboardCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No active check-in counters</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Check-in information will appear here when available
            </p>
          </div>
        </div>
      )}
    </div>
  );
}