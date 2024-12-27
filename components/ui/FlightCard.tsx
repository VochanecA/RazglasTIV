import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Tooltip from '@/components/ui/ToolTip'; // Adjust the import path as necessary
import { ClockArrowUp, PlaneTakeoff, TicketsPlane, Info } from 'lucide-react';
import { Flight } from '@/types/flight';

const FlightCard = ({ flight, type }: { flight: Flight; type: 'departure' | 'arrival' }) => {
  const [logoError, setLogoError] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // State for toggling card visibility
  const [isDarkTheme, setIsDarkTheme] = useState(false); // Theme state
  const logoUrl = `https://www.flightaware.com/images/airline_logos/180px/${flight.KompanijaICAO}.png`;
  const placeholderUrl = 'https://via.placeholder.com/180x120?text=No+Logo';

  useEffect(() => {
    const darkModeEnabled = document.documentElement.classList.contains("dark");
    setIsDarkTheme(darkModeEnabled);
  }, []);

  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-all duration-200 ease-in-out">
      <div className="p-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        {/* Top Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Logo */}
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

            {/* Flight Details */}
            <div className="flex items-center mt-2">
              <div className="flex items-center space-x-4"> {/* This will place both items side by side with some space */}
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
                  <div className="text-light-blue-500 dark:text-blue-300 font-bold text-lg">
                    {flight.grad}
                  </div>
                </div>

                {/* Add the FlightAware image link here */}
                <a
                  href={`https://www.flightaware.com/live/flight/${flight.KompanijaICAO}${flight.ident}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-500 dark:text-blue-300"
                >
                  <span className="mr-2 text-sm font-medium">Watch flight on FlightAware</span>
                  <img
                    src={isDarkTheme ? "https://www.flightaware.com/images/og_default_image.png" : "https://flightaware.store/cdn/shop/files/FA_Logo_RGB-Hex_1_300x300.png?v=1623247331"}
                    alt="FlightAware Logo"
                    className="w-[55px] h-[30px]"
                  />
                </a>
              </div>
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

        {/* Flight Timings */}
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center">
            <ClockArrowUp color="gray" size={16} className="mr-2" />
            <span className="font-medium">Scheduled:</span>
            <span className="ml-2">{flight.scheduled_out || '-'}</span>
          </div>
          <div className="flex items-center">
            <TicketsPlane color="gray" size={16} className="mr-2" />
            <span className="font-medium">Estimated:</span>
            <span className="ml-2">{flight.estimated_out || '-'}</span>
          </div>
          <div className="flex items-center">
            <PlaneTakeoff color="gray" size={16} className="mr-2" />
            <span className="font-medium">Actual:</span>
            <span className="ml-2">{flight.actual_out || '-'}</span>
          </div>
        </div>

        {/* Additional Information for Departures */}
        {type === 'departure' && (
          <>
            <div className="mt-4">
              <div className="flex items-center">
                <Info color="#A0AEC0" size={16} className="mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-400">
                  Passengers should arrive at the airport at least two hours before departure. Verify your travel documents and avoid packing prohibited items.
                </span>
              </div>
              <div className="flex items-center mt-2">
                <Info color="#A0AEC0" size={16} className="mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-400">
                  For more information on dangerous goods regulations, visit{' '}
                  <a
                    href="https://www.iata.org/en/programs/cargo/dgr/dgr-guidance-passengers/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    IATA Guidance
                  </a>.
                </span>
              </div>
            </div>

            {/* Collapsible Content for Departures */}
            {isOpen && (
              <div className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Scheduled</div>
                    <div className="font-bold">{flight.scheduled_out || '-'}</div>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-blue-500 text-white rounded-full px-3 py-1 mr-2">
                      Check In
                    </div>
                    <div className="bg-blue-200 text-blue-800 rounded-full px-3 py-1">
                      {flight.checkIn || '-'}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-green-500 text-white rounded-full px-3 py-1 mr-2">
                      Gate
                    </div>
                    <div className="bg-green-200 text-green-800 rounded-full px-3 py-1">
                      {flight.gate || '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Collapsible Content for Arrivals */}
        {type === 'arrival' && isOpen && (
          // You can add any specific information for arrivals here if needed.
          // For now, we will leave it empty or you can customize it.
          <>
            {/* You can add additional arrival-specific information here if necessary */}
          </>
        )}
      </div>
    </div>
  );
};

export default FlightCard;
