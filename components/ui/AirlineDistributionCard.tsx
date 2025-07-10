import { useEffect, useState } from 'react';
import { FlightData } from './FlightScheduleOverview';
import { PlaneTakeoff } from 'lucide-react';

interface AirlineDistributionCardProps {
  flights: FlightData[];
}

type AirlineCount = {
  name: string;
  value: number;
  color: string;
  percentage: number;
};

export default function AirlineDistributionCard({ flights }: AirlineDistributionCardProps) {
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
      const airline = flight.KompanijaNaziv;
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors duration-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Airlines Distribution</h3>
        <PlaneTakeoff className="w-4 h-4 text-blue-500 dark:text-blue-400" />
      </div>
      
      {airlineData.length > 0 ? (
        <div className="mt-4 space-y-3">
          {airlineData.map((airline, index) => {
            const barWidth = (airline.value / maxValue) * 100;
            const truncatedName = airline.name.length > 20 ? airline.name.substring(0, 17) + '...' : airline.name;
            
            return (
              <div key={index} className="group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300" title={airline.name}>
                    {truncatedName}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {airline.value} ({airline.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500 ease-out"
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
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-slate-500 dark:text-slate-400">No flight data available</p>
        </div>
      )}
      
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
        Total: {totalFlights} flight{totalFlights !== 1 ? 's' : ''}
      </p>
    </div>
  );
}