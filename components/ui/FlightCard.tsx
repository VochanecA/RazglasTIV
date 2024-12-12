import React, { useState } from 'react';
import Image from 'next/image';
import { formatTime } from '@/lib/utils/formatTime'; // Adjust the import path as necessary
import { Flight } from '@/types/flight';
import Tooltip from '@/components/ui/ToolTip'; // Adjust the import path as necessary
import { ClockArrowUp, PlaneTakeoff, TicketsPlane, Info } from 'lucide-react'; // Importing required icons

const FlightCard = ({ flight, type }: { flight: Flight; type: 'departure' | 'arrival' }) => {
  const [logoError, setLogoError] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // State for toggling card visibility
  const logoUrl = `https://www.flightaware.com/images/airline_logos/180px/${flight.KompanijaICAO}.png`;
  const placeholderUrl = 'https://via.placeholder.com/180x120?text=No+Logo';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-all duration-200 ease-in-out">
      <div className="p-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center justify-between mb-4">
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
            <div>
              <a 
                href={`https://www.flightaware.com/live/flight/${flight.KompanijaICAO}${flight.ident}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Tooltip text={`Watch ${flight.KompanijaICAO} ${flight.ident} on flightaware.com`}>
                  <span className="text-xl font-bold text-blue-600 dark:text-yellow-400">
                    {flight.Kompanija} {flight.ident}
                  </span>
                </Tooltip>
              </a>

              <span className="text-light-blue-500 dark:text-blue-300 font-bold text-xl ml-2">
                {flight.grad} {/* Updated styling */}
              </span>

              {/* Text before FlightAware Logo */}
              <span className="ml-2 text-gray-700 dark:text-gray-500 text-sm">Watch flight on</span>

              {/* FlightAware Logo with Link */}
              <a 
                href={`https://www.flightaware.com/live/flight/${flight.KompanijaICAO}${flight.ident}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block ml-2"
              >
                <Image
                  src="https://www.flightaware.com/images/nav/flightaware-logo.png"
                  alt="FlightAware Logo"
                  width={50} // Adjust width as needed
                  height={20} // Adjust height as needed
                  className="object-contain"
                />
              </a>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`px-2 py-1 text-sm font-semibold rounded-full ${
              flight.status === (type === 'departure' ? 'Departed' : 'Arrived')
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                : flight.status === 'Delayed'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                : flight.status === 'Processing'
                ? 'bg-yellow-400 text-black font-bold blink'
                : flight.status === 'Boarding'
                ? 'bg-red-600 text-white font-bold blink-red'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100 font-bold'
            }`}
          >
            {flight.status === 'Processing' ? 'Check In Open' : flight.status}
          </span>
        </div>

        {/* Scheduled Information with Red Rounded Pill */}
        <div className="flex flex-col md:flex-row md:space-x-4 justify-center mt-2"> {/* Center and stack pills vertically on mobile, horizontally on desktop */}
          <div className="inline-flex items-center px-3 py-1 text-sm font-bold text-white bg-red-600 rounded-full w-full max-w-xs justify-center mb-2 md:mb-0"> {/* Added margin-bottom for spacing */}
            <ClockArrowUp color="white" size={16} className="mr-1" /> {/* Clock icon */}
            Scheduled: <span className="font-medium ml-1">{flight.scheduled_out}</span>
          </div>

          {/* Conditional rendering for Check-In and Gate pills */}
          {type === 'arrival' && flight.status !== 'Departed' && (
            <>
              {/* Check-In Information with Orange Rounded Pill (Estimated Time) */}
              <div className="inline-flex items-center px-3 py-1 text-sm font-bold text-white bg-orange-600 rounded-full w-full max-w-xs justify-center mb-2 md:mb-0"> {/* Added margin-bottom for spacing */}
              <TicketsPlane color="black" size={16} className="mr=1" /> {/* Tickets icon */}
                Estimated Time: <span className="font-medium ml=1">{flight.estimated_out}</span> {/* Display estimated time for arrivals */}
              </div>

              {/* Gate Information with Plane Takeoff Icon (Actual Time) */}
              <div className="inline-flex items-center px-3 py-1 text-sm font-bold text-white bg-blue-600 rounded-full w-full max-w-xs justify-center mb-2 md:mb-0"> {/* Added margin-bottom for spacing */}
              <PlaneTakeoff color="white" size={16} className="mr=1" /> {/* Plane Takeoff icon */}
                Actual Time: <span className="font-medium ml=1">{flight.actual_out || '-'}</span> {/* Display actual time or a placeholder */}
              </div>
            </>
          )}

          {type === 'departure' && (
            <>
              {/* Check-In Information with Orange Rounded Pill (Check-In Time) */}
              <div className="inline-flex items-center px-3 py-1 text-sm font-bold text-white bg-orange-600 rounded-full w-full max-w-xs justify-center mb-2 md:mb-0"> {/* Added margin-bottom for spacing */}
              <TicketsPlane color="black" size={16} className="mr=1" /> {/* Tickets icon */}
                Check-In: <span className="font-medium ml=1">{flight.checkIn}</span> {/* Display check-in time for departures */}
              </div>

              {/* Gate Information with Plane Takeoff Icon (Gate Time) */}
              <div className="inline-flex items-center px-3 py-1 text-sm font-bold text-white bg-blue-600 rounded-full w-full max-w-xs justify-center mb-2 md:mb-0"> {/* Added margin-bottom for spacing */}
              <PlaneTakeoff color="white" size={16} className="mr=1" /> {/* Plane Takeoff icon */}
                Gate: <span className="font-medium ml=1">{flight.gate}</span> {/* Display gate information for departures */}
              </div>
            </>
          )}
        </div>

        {/* Info Text Below Scheduled Pill - Only for Departures */}
        {type === 'departure' && (
          <>
          <div className="flex flex-col space-y-1 text-gray-500 dark:text-gray-400">
  <div className="flex items-center">
    <Info color="#A0AEC0" size={16} className="mr-1" />
    <span className="text-sm">Passengers should arrive at the airport at least two hours before departure. Verify your travel documents and avoid packing prohibited items.</span>
  </div>
  
  <div className="flex items-center">
    <Info color="#A0AEC0" size={16} className="mr-1" />
    <span className="text-sm">
        
      For more information on dangerous goods regulations, visit{' '}
      <a href="https://www.iata.org/en/programs/cargo/dgr/dgr-guidance-passengers/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
        IATA Guidance
      </a>.
    </span>
  </div>
</div>



          </>
        )}

        {/* Collapsible content */}
        {isOpen && (
          <div className="mt=4 space-y=4">
            <div className="grid grid-cols=2 gap=4 text-sm">
              <div>
                <div className="text-gray500 dark:text-gray400 text-lg font-semibold">Scheduled</div>
                <div className="dark:text-gray200 text-lg font-bold">{flight.scheduled_out}</div>
              </div>
              <div>
                <div className="text-gray500 dark:text-gray400 text-lg font-semibold">Estimated</div>
                <div className="text-lg font-medium dark:text-gray200">{flight.estimated_out}</div>
              </div>
              <div>
                <div className="text-gray500 dark:text-gray400 text-lg font-semibold">Actual</div>
                <div className="text-lg font-medium dark:text-gray200">
                  {flight.actual_out ? flight.actual_out : '-'}
                </div>
              </div>
            </div>

            {/* Additional flight information */}
            <div>
              <div className="text-gray500 dark:text-gray400">IATA code:</div>
              <div className="font-medium text-yellow500 dark:text-yellow400">{flight.destination.code}</div>
            </div>
            <div>
              <div className="text-gray500 dark:text-gray400">Destination</div>
              <div className="text-light-blue500 dark:text-blue300 font-bold text-xl">{flight.grad}</div> {/* Updated styling */}
            </div>

            {/* Departure-specific info */}
            {type === 'departure' && (
              <>
                {/* Additional departure-specific info can go here if needed */}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightCard;
