import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FlightData } from './FlightScheduleOverview';
import { PlaneTakeoff } from 'lucide-react';

interface AirlineDistributionCardProps {
  flights: FlightData[];
}

type AirlineCount = {
  name: string;
  value: number;
  color: string;
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
      color: colors[index % colors.length]
    }));

    setAirlineData(chartData);
    setTotalFlights(flights.length);
  }, [flights]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-2 shadow-md rounded-md border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {data.value} flight{data.value !== 1 ? 's' : ''} ({Math.round((data.value / totalFlights) * 100)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegendText = (value: string) => {
    // Truncate long airline names
    return value.length > 18 ? value.substring(0, 15) + '...' : value;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors duration-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Airlines Distribution</h3>
        <PlaneTakeoff className="w-4 h-4 text-blue-500 dark:text-blue-400" />
      </div>
      
      {airlineData.length > 0 ? (
        <div className="mt-4" style={{ height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={airlineData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {airlineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="vertical" 
                align="right"
                verticalAlign="middle"
                formatter={renderLegendText}
                iconSize={8}
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', paddingLeft: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-slate-500 dark:text-slate-400">No flight data available</p>
        </div>
      )}
      
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
        Total: {totalFlights} flight{totalFlights !== 1 ? 's' : ''}
      </p>
    </div>
  );
}