import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Tooltip from '@/components/ui/ToolTip'; // Adjust the import path as necessary
import {
  ClockArrowUp, PlaneTakeoff, TicketsPlane, Info,
  Clock, CalendarDays, Hourglass, UserCheck, MapPin,
  CheckCircle, AlertTriangle, Loader, Users, XCircle,
  CircleDotDashed // For "On Time" status button
} from 'lucide-react'; // Added more icons for various statuses and pills
import { Flight } from '@/types/flight';

const FlightCard = ({ flight, type }: { flight: Flight; type: 'departure' | 'arrival' }) => {
  const [logoError, setLogoError] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // State for toggling card visibility
  const [isDarkTheme, setIsDarkTheme] = useState(false); // Theme state
  const logoUrl = `https://www.flightaware.com/images/airline_logos/180px/${flight.KompanijaICAO}.png`;
  const placeholderUrl = 'https://placehold.co/180x120/E0E0E0/333333?text=No+Logo'; // Using placehold.co for better placeholders

  useEffect(() => {
    // Check for dark mode on component mount
    const checkDarkMode = () => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    };

    // Initial check
    checkDarkMode();

    // Observe changes to the html tag's class list for theme changes
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    // Cleanup observer on unmount
    return () => observer.disconnect();
  }, []);

  // Determine status badge styling and icon
  const getStatusBadge = (status: string) => {
    let bgColor = 'bg-gray-100 dark:bg-gray-700';
    let textColor = 'text-gray-800 dark:text-gray-100';
    let icon = <Info size={14} className="inline mr-1" />;
    let blinkClass = '';
    let displayText = status;

    switch (status) {
      case (type === 'departure' ? 'Departed' : 'Arrived'):
        bgColor = 'bg-green-100 dark:bg-green-900';
        textColor = 'text-green-800 dark:text-green-100';
        icon = <CheckCircle size={14} className="inline mr-1" />;
        break;
      case 'Delay':
        bgColor = 'bg-red-500';
        textColor = 'text-white';
        blinkClass = 'blink';
        icon = <AlertTriangle size={14} className="inline mr-1" />;
        break;
      case 'Processing':
        bgColor = 'bg-green-400'; // Light green for Processing/Check In
        textColor = 'text-black';
        blinkClass = 'blink';
        icon = <Loader size={14} className="inline mr-1 animate-spin" />; // Spinning loader
        displayText = 'Check In';
        break;
      case 'Boarding':
        bgColor = 'bg-orange-700';
        textColor = 'text-white';
        blinkClass = 'blink-red'; // Assuming blink-red is defined for attention
        icon = <Users size={14} className="inline mr-1" />;
        break;
      case 'Closed':
        bgColor = 'bg-red-700';
        textColor = 'text-white';
        blinkClass = 'blink-red';
        icon = <XCircle size={14} className="inline mr-1" />;
        break;
      case 'On time': // New case for "On Time"
        bgColor = 'bg-lime-400'; // Light green background
        textColor = 'text-black'; // Dark text
        blinkClass = 'blink'; // Blinking effect
        icon = <CircleDotDashed size={14} className="inline mr-1" />;
        break;
      case 'Scheduled': // Added "Scheduled" as a potential status if it comes from API
        bgColor = 'bg-yellow-200 dark:bg-yellow-700';
        textColor = 'text-yellow-800 dark:text-yellow-100';
        icon = <Clock size={14} className="inline mr-1" />;
        break;
      default:
        // Default styling for other statuses like "Active", etc.
        bgColor = 'bg-gray-100 dark:bg-gray-700';
        textColor = 'text-gray-800 dark:text-gray-100';
        icon = <Info size={14} className="inline mr-1" />;
        break;
    }

    return (
      <span
        className={`px-3 py-1 text-sm font-semibold rounded-full flex items-center ${bgColor} ${textColor} ${blinkClass}`}
      >
        {icon}
        {displayText}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-all duration-200 ease-in-out">
      <div className="p-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        {/* Top Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <div className="w-20 h-12 relative bg-white flex-shrink-0">
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
            <div className="flex flex-col"> {/* Changed to flex-col for better stacking on small screens */}
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
          </div>

          {/* Status Badge */}
          {getStatusBadge(flight.status)}
        </div>

        {/* Flight Timings */}
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center">
            <span className="font-medium text-gray-700 dark:text-gray-300 mr-2">Scheduled:</span>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-200 text-yellow-800 font-semibold text-sm">
              <CalendarDays size={14} />
              {flight.scheduled_out || '-'}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-700 dark:text-gray-300 mr-2">Estimated:</span>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-200 text-blue-800 font-semibold text-sm">
              <Hourglass size={14} />
              {flight.estimated_out || '-'}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-700 dark:text-gray-300 mr-2">Actual:</span>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-200 text-green-800 font-semibold text-sm">
              <PlaneTakeoff size={14} />
              {flight.actual_out || '-'}
            </span>
          </div>
        </div>

        {/* Additional Information for Departures */}
        {type === 'departure' && (
          <>
            <div className="mt-4">
              <div className="flex items-center">
                <Info color="#A0AEC0" size={16} className="mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-400">
                  Passengers should arrive at the airport at least two hours before departure. Verify your travel documents and avoid packing prohibited items.
                </span>
              </div>
              <div className="flex items-center mt-2">
                <Info color="#A0AEC0" size={16} className="mr-2 flex-shrink-0" />
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
                  {/* Scheduled is already displayed above, removing redundancy here */}
                  <div className="flex items-center">
                    <span className="font-medium text-gray-500 dark:text-gray-400 mr-2">Check In:</span>
                    <span className="flex items-center gap-1 bg-blue-500 text-white rounded-full px-3 py-1 font-bold text-sm">
                      <UserCheck size={14} />
                      {flight.checkIn || '-'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-500 dark:text-gray-400 mr-2">Gate:</span>
                    <span className="flex items-center gap-1 bg-green-800 text-white rounded-full px-3 py-1 font-bold blink text-sm">
                      <MapPin size={14} />
                      {flight.gate || '-'}
                    </span>
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
