import React from 'react';
import { Flight } from '@/types/flight';
import { PlaneTakeoff, PlaneLanding, Clock, MapPin, Users, AlertTriangle, CheckCircle } from 'lucide-react';

interface FlightTableProps {
  flights: Flight[];
  type: 'departures' | 'arrivals';
}

const FlightTable: React.FC<FlightTableProps> = ({ flights, type }) => {
  const limitedFlights = flights.slice(0, 11);

  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; icon?: any; blink?: boolean }> = {
      'Processing': { bg: 'bg-amber-500', text: 'text-black', blink: true },
      'processing': { bg: 'bg-amber-500', text: 'text-black', blink: true },
      'Scheduled': { bg: 'bg-emerald-500', text: 'text-white' },
      'Arrived': { bg: 'bg-blue-500', text: 'text-white' },
      'Delay': { bg: 'bg-red-500', text: 'text-white', blink: true },
      'Delayed': { bg: 'bg-red-500', text: 'text-white', blink: true },
      'Boarding': { bg: 'bg-purple-500', text: 'text-white', blink: true },
      'Landed': { bg: 'bg-cyan-500', text: 'text-white' },
    };
    return statusMap[status] || { bg: 'bg-gray-500', text: 'text-white' };
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-black/50 border-b border-white/10">
        <div className="col-span-2 text-lg font-bold text-gray-300 uppercase tracking-wider">Airline</div>
        <div className="col-span-2 text-lg font-bold text-gray-300 uppercase tracking-wider">Flight</div>
        <div className="col-span-2 text-lg font-bold text-gray-300 uppercase tracking-wider">
          {type === 'departures' ? 'Destination' : 'Origin'}
        </div>
        <div className="text-lg font-bold text-gray-300 uppercase tracking-wider">Scheduled</div>
        <div className="text-lg font-bold text-gray-300 uppercase tracking-wider">Estimated</div>
        <div className="text-lg font-bold text-gray-300 uppercase tracking-wider">Actual</div>
        {type === 'departures' && (
          <>
            <div className="text-lg font-bold text-gray-300 uppercase tracking-wider">Check-In</div>
            <div className="text-lg font-bold text-gray-300 uppercase tracking-wider">Gate</div>
          </>
        )}
        <div className="text-lg font-bold text-gray-300 uppercase tracking-wider">Status</div>
      </div>

      {/* Flight Rows */}
      <div className="divide-y divide-white/10">
        {limitedFlights.map((flight, index) => {
          const logoUrl = `https://www.flightaware.com/images/airline_logos/180px/${flight.KompanijaICAO}.png`;
          const placeholderUrl = 'https://via.placeholder.com/180x120?text=No+Logo';
          const statusConfig = getStatusConfig(flight.status);

          return (
            <div
              key={flight.ident}
              className={`grid grid-cols-12 gap-4 px-6 py-6 transition-all duration-300 hover:bg-white/5 ${
                index % 2 === 0 ? 'bg-black/20' : 'bg-black/10'
              }`}
            >
              {/* Airline Logo */}
              <div className="col-span-2 flex items-center">
                <div className="w-20 h-12 bg-white/10 rounded-xl flex items-center justify-center p-2">
                  <img
                    src={flight.KompanijaICAO ? logoUrl : placeholderUrl}
                    alt={flight.Kompanija || 'No Logo'}
                    className="h-8 w-auto object-contain"
                  />
                </div>
              </div>

              {/* Flight Number */}
              <div className="col-span-2 flex items-center">
                <span className="text-4xl font-black text-white">
                  {flight.Kompanija} {flight.ident}
                </span>
              </div>

              {/* Destination/Origin */}
              <div className="col-span-2 flex items-center">
                <span className="text-3xl font-bold text-amber-300">
                  {flight.grad}
                </span>
              </div>

              {/* Scheduled Time */}
              <div className="flex items-center">
                <span className="text-3xl font-bold text-gray-300">
                  {flight.scheduled_out}
                </span>
              </div>

              {/* Estimated Time */}
              <div className="flex items-center">
                <span className="text-2xl font-semibold text-emerald-400">
                  {flight.estimated_out || '-'}
                </span>
              </div>

              {/* Actual Time */}
              <div className="flex items-center">
                <span className="text-2xl font-semibold text-cyan-400">
                  {flight.actual_out || '-'}
                </span>
              </div>

              {/* Check-In (Departures only) */}
              {type === 'departures' && (
                <div className="flex items-center">
                  {flight.checkIn ? (
                    <div className="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-xl text-xl font-bold">
                      {flight.checkIn}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-xl">-</span>
                  )}
                </div>
              )}

              {/* Gate (Departures only) */}
              {type === 'departures' && (
                <div className="flex items-center">
                  {flight.gate ? (
                    <div className="bg-red-500 text-white w-14 h-14 rounded-full flex items-center justify-center text-xl font-black shadow-lg">
                      {flight.gate}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-xl">-</span>
                  )}
                </div>
              )}

              {/* Status */}
              <div className="flex items-center">
                <div
                  className={`px-4 py-3 rounded-xl font-bold text-lg ${
                    statusConfig.bg
                  } ${statusConfig.text} ${
                    statusConfig.blink ? 'animate-pulse' : ''
                  }`}
                >
                  {flight.status}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {limitedFlights.length > 0 && (
        <div className="px-6 py-4 bg-black/50 border-t border-white/10">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <div className="flex items-center gap-2">
              {type === 'departures' ? (
                <PlaneTakeoff className="w-4 h-4 text-amber-400" />
              ) : (
                <PlaneLanding className="w-4 h-4 text-emerald-400" />
              )}
              <span>Showing {limitedFlights.length} flights</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>On Time</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Delayed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span>Processing</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightTable;