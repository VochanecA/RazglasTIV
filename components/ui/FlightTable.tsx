import React from 'react';
import { Flight } from '@/types/flight';


interface FlightTableProps {
  flights: Flight[];
  type: 'departures' | 'arrivals';
  darkMode: boolean;
}

const FlightTable: React.FC<FlightTableProps> = ({ flights, type, darkMode }) => {
   // Limit to a maximum of 11 flights
   const limitedFlights = flights.slice(0, 11);
  return (
    <div className={`w-full overflow-x-auto ${darkMode ? 'text-white' : 'text-black'} text-base`}>
      <table className={`w-full border-none ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <thead>
          <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <th className="py-3 px-4 border-b border-l-0 border-r-0 border-t-0">Airline Logo</th>
            <th className="py-3 px-4 border-b border-l-0 border-r-0 border-t-0">Flight Number</th>
            <th className="py-3 px-4 border-b border-l-0 border-r-0 border-t-0">Destination</th>
            <th className="py-3 px-4 border-b border-l-0 border-r-0 border-t-0">Scheduled Time</th>
            <th className="py-3 px-4 border-b border-l-0 border-r-0 border-t-0">Estimated Time</th>
            <th className="py-3 px-4 border-b border-l-0 border-r-0 border-t-0">Actual Time</th>
   {/* Conditionally render Check-In and Gate columns */}
   {type === 'departures' && (
              <>
                <th className="py-3 px-4 border-b border-l-0 border-r-0 border-t-0">Check-In</th>
                <th className="py-3 px-4 border-b border-l-0 border-r-0 border-t-0">Gate</th>
              </>
            )}
            <th className="py-3 px-4 border-b border-l-0 border-r-0 border-t-0">Status</th>
          </tr>
        </thead>
        <tbody>
          {limitedFlights.map((flight, index) => {
            const logoUrl = `https://www.flightaware.com/images/airline_logos/180px/${flight.KompanijaICAO}.png`;
            const placeholderUrl = 'https://via.placeholder.com/180x120?text=No+Logo';

            return (
   
<tr
  key={flight.ident}
  className={`
    ${darkMode 
      ? (index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-800') 
      : (index % 2 === 0 ? 'bg-gray-100' : 'bg-white')
    }
    hover:${darkMode ? 'bg-gray-600' : 'bg-gray-200'}
    transition-colors duration-200
  `}
>
 {/* Airline Logo */}
                <td className="py-3 px-4 border-b border-l-0 border-r-0 border-t-0 flex items-center  justify-center">
                <div
  className={`w-20 h-12 flex items-center justify-center rounded-lg overflow-hidden ${
    darkMode ? 'bg-gray-700' : 'bg-gray-100'
  }`}
>
  <img
    src={flight.KompanijaICAO ? logoUrl : placeholderUrl}
    alt={flight.Kompanija || 'No Logo'}
    className="h-10 w-auto rounded-lg" // Added rounded-lg for rounded corners
  />
  
</div>
                </td>
                {/* Flight Number */}
                <td className="py-3 px-4 border-b border-l-0 border-r-0 border-t-0 text-orange-500 text-5xl text-center font-extrabold ">{flight.Kompanija} {flight.ident}</td>
                {/* Grad */}
                <td className="py-3 px-4 border-b border-l-0 border-r-0 border-t-0 text-sky-500 text-5xl text-center font-extrabold">{flight.grad}</td>
                {/* Scheduled Out */}
                <td className="py-3 px-4 border-b border-l-0 border-r-0 border-t-0 text-orange-500 text-5xl text-center font-extrabold">{flight.scheduled_out}</td>
                {/* Estimated Out */}
                <td className="py-3 px-4 border-b border-l-0 border-r-0 border-t-0 text-4xl text-center font-extrabold">{flight.estimated_out}</td>
                {/* Actual Out */}
                <td className="py-3 px-4 border-b border-l-0 border-r-0 border-t-0 text-4xl text-center font-extrabold">{flight.actual_out}</td>
 {/* Conditionally render Check-In and Gate data */}
 {type === 'departures' && (
                  <>
                    <td className="py-3 px-4 border-b border-l-0 border-r-0 border-t-0 text-2xl text-center font-extrabold">{flight.checkIn}</td>
                    <td className="py-3 px-4 border-b border-l-0 border-r-0 border-t-0 text-center">
  {flight.gate ? (
    <div className="w-12 h-12 bg-red-500 text-white flex items-center justify-center rounded-full mx-auto font-extrabold text-2xl">
      {flight.gate}
    </div>
  ) : null}
</td>

                  </>
                )}
 {/* Status */}
 <td className="py-3 px-4 border-b text-center font-extrabold border-l-0">
                  {flight.status === "Processing" || flight.status === "processing" ? (
                    <span className="inline-block bg-yellow-500 text-black rounded-full py-2 px-4 animate-blink">
                      {flight.status}
                    </span>
                  ) : flight.status === "Scheduled" ? (
                    <span className="inline-block bg-green-500 text-white rounded-full py-2 px-4">
                      {flight.status}
                    </span>
                  ) : flight.status === "Arrived" ? (
                    <span className="inline-block bg-orange-500 text-black  rounded-full py-2 px-4">
                      {flight.status}
                    </span>
                  ) : flight.status === "Delay" || flight.status === "Delayed" ? (
                    <span className="inline-block bg-red-500 text-white rounded-full py-2 px-4 animate-blink">
                      {flight.status}
                    </span>
                  ) : (
                    flight.status
                  )}
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
  {/* Add the blinking animation style */}
 {/* Add the blinking animation style */}
 <style jsx>{`
        @keyframes blink {
          50% {
            opacity: 0;
          }
        }
        .animate-blink {
          animation: blink 0.5s linear infinite;
        }
      `}</style>
    </div>
  );
};


export default FlightTable;
