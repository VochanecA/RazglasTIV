// components/ui/AirlineDistributionCard.tsx
import { useEffect, useState } from 'react';
import { Flight } from '@/types/flight';
import { PlaneTakeoff, ChevronDown } from 'lucide-react';

interface AirlineDistributionCardProps {
  flights: Flight[];
  compact?: boolean;
}

type AirlineCount = {
  name: string;
  value: number;
  color: string;
  percentage: number;
};

export default function AirlineDistributionCard({ flights, compact = false }: AirlineDistributionCardProps) {
  const [airlineData, setAirlineData] = useState<AirlineCount[]>([]);
  const [totalFlights, setTotalFlights] = useState(0);
  const [isOpen, setIsOpen] = useState(!compact);

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#84cc16',
  ];

  useEffect(() => {
    if (!flights || flights.length === 0) return;

    const airlineCounts: Record<string, number> = {};
    flights.forEach(flight => {
      const airline = flight.Kompanija || 'Unknown';
      airlineCounts[airline] = (airlineCounts[airline] || 0) + 1;
    });

    const sortedAirlines = Object.entries(airlineCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // U compact modu prikaži samo top 5, inače sve
    const limitedAirlines = compact ? sortedAirlines.slice(0, 5) : sortedAirlines;

    const chartData: AirlineCount[] = limitedAirlines.map((airline, index) => ({
      name: airline.name,
      value: airline.count,
      color: colors[index % colors.length],
      percentage: Math.round((airline.count / flights.length) * 100)
    }));

    setAirlineData(chartData);
    setTotalFlights(flights.length);
  }, [flights, compact]);

  const maxValue = Math.max(...airlineData.map(a => a.value));

  // Stilovi za compact mode
  const containerClass = compact 
    ? "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-3 transition-colors duration-200"
    : "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors duration-200";

  const titleClass = compact 
    ? "text-xs font-medium text-slate-700 dark:text-slate-300"
    : "text-sm font-medium text-slate-700 dark:text-slate-300";

  const textClass = compact ? "text-xs" : "text-sm";
  const barHeight = compact ? "h-1.5" : "h-2";
  const iconSize = compact ? "w-3 h-3" : "w-4 h-4";

  return (
    <div className={containerClass}>
      <div 
        className={`flex items-center justify-between ${compact ? 'mb-1' : 'mb-2'} cursor-pointer select-none`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="airline-distribution-content"
      >
        <h3 className={titleClass}>Airlines Distribution</h3>
        <div className="flex items-center space-x-1">
          <PlaneTakeoff className={`${iconSize} text-blue-500 dark:text-blue-400`} />
          <ChevronDown
            className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-slate-500 dark:text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Collapsible content */}
      <div
        id="airline-distribution-content"
        className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${
          isOpen 
            ? compact 
              ? 'max-h-[300px] mt-2' 
              : 'max-h-[1000px] mt-4' 
            : 'max-h-0'
        }`}
      >
        {airlineData.length > 0 ? (
          <div className={compact ? "space-y-2" : "space-y-3"}>
            {airlineData.map((airline, index) => {
              const barWidth = (airline.value / maxValue) * 100;
              // Kraći nazivi u compact modu
              const nameLength = compact ? 15 : 20;
              const truncatedName = airline.name.length > nameLength 
                ? airline.name.substring(0, nameLength - 3) + '...' 
                : airline.name;
              
              return (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span 
                      className={`${textClass} font-medium text-slate-700 dark:text-slate-300`} 
                      title={airline.name}
                    >
                      {truncatedName}
                    </span>
                    <span className={`${textClass} text-slate-500 dark:text-slate-400`}>
                      {airline.value} ({airline.percentage}%)
                    </span>
                  </div>
                  <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full ${barHeight}`}>
                    <div
                      className={`${barHeight} rounded-full transition-all duration-500 ease-out`}
                      style={{ width: `${barWidth}%`, backgroundColor: airline.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`flex items-center justify-center ${compact ? 'h-24' : 'h-48'}`}>
            <p className={`${textClass} text-slate-500 dark:text-slate-400`}>No flight data available</p>
          </div>
        )}
        <p className={`${textClass} text-slate-500 dark:text-slate-400 mt-3 text-center`}>
          Total: {totalFlights} flight{totalFlights !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}