import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Tooltip from '@/components/ui/ToolTip';
import {
  ClockArrowUp, PlaneTakeoff, TicketsPlane, Info,
  Clock, CalendarDays, Hourglass, UserCheck, MapPin,
  CheckCircle, AlertTriangle, Loader, Users, XCircle,
  CircleDotDashed, ChevronDown, ChevronUp, PlaneLanding,
  Building, DoorOpen, CalendarClock
} from 'lucide-react';
import { Flight } from '@/types/flight';

const FlightCard = ({ flight, type }: { flight: Flight; type: 'departure' | 'arrival' }) => {
  const [logoError, setLogoError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  
  const logoUrl = `https://www.flightaware.com/images/airline_logos/180px/${flight.KompanijaICAO}.png`;
  const placeholderUrl = 'https://placehold.co/180x120/E0E0E0/333333?text=No+Logo';

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Status badge configuration
  const getStatusConfig = (status: string) => {
    const configs: Record<string, any> = {
      'Departed': { bg: 'bg-emerald-500', text: 'text-white', icon: CheckCircle, blink: false },
      'Arrived': { bg: 'bg-emerald-500', text: 'text-white', icon: CheckCircle, blink: false },
      'Delay': { bg: 'bg-rose-500', text: 'text-white', icon: AlertTriangle, blink: true },
      'Delayed': { bg: 'bg-rose-500', text: 'text-white', icon: AlertTriangle, blink: true },
      'Processing': { bg: 'bg-blue-500', text: 'text-white', icon: Loader, blink: true, displayText: 'Check In' },
      'Boarding': { bg: 'bg-amber-500', text: 'text-white', icon: Users, blink: true },
      'Closed': { bg: 'bg-gray-600', text: 'text-white', icon: XCircle, blink: false },
      'On time': { bg: 'bg-lime-500', text: 'text-gray-900', icon: CircleDotDashed, blink: true },
      'On Time': { bg: 'bg-lime-500', text: 'text-gray-900', icon: CircleDotDashed, blink: true },
      'Scheduled': { bg: 'bg-indigo-500', text: 'text-white', icon: Clock, blink: false },
    };

    return configs[status] || { bg: 'bg-gray-500', text: 'text-white', icon: Info, blink: false };
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = getStatusConfig(status);
    const IconComponent = config.icon;
    
    return (
      <div className={`px-3 py-2 rounded-full ${config.bg} ${config.text} ${config.blink ? 'animate-pulse' : ''} flex items-center gap-1.5 font-semibold text-sm`}>
        <IconComponent size={14} />
        <span>{config.displayText || status}</span>
      </div>
    );
  };

  // Time pill component
  const TimePill = ({ icon: Icon, time, label, variant }: { icon: any, time: string, label: string, variant: 'scheduled' | 'estimated' | 'actual' }) => {
    const variantStyles = {
      scheduled: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
      estimated: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
      actual: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
    };

    return (
      <div className={`flex flex-col items-center text-center p-3 rounded-xl ${variantStyles[variant]} shadow-sm`}>
        <div className="flex items-center gap-2 mb-1">
          <Icon size={16} className={`${
            variant === 'scheduled' ? 'text-purple-500' : 
            variant === 'estimated' ? 'text-orange-500' : 
            'text-emerald-500'
          }`} />
          <span className="text-xs font-medium uppercase tracking-wide">
            {label}
          </span>
        </div>
        <span className="text-lg font-bold">
          {time || '-'}
        </span>
      </div>
    );
  };

  // Info pill component for gate and check-in
  const InfoPill = ({ icon: Icon, value, label, highlight = false, blink = false }: { icon: any, value: string, label: string, highlight?: boolean, blink?: boolean }) => {
    if (!value) return null;
    
    return (
      <div className={`flex items-center gap-3 p-4 rounded-xl ${highlight ? 'bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-600' : 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700'} shadow-sm ${blink ? 'animate-pulse' : ''}`}>
        <div className={`p-2 rounded-lg ${highlight ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'}`}>
          <Icon size={20} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
          <span className={`text-lg font-bold ${highlight ? 'text-amber-700 dark:text-amber-300' : 'text-blue-700 dark:text-blue-300'}`}>
            {value}
          </span>
        </div>
      </div>
    );
  };

  // Check if flight is in check-in status
  const isCheckInStatus = flight.status === 'Processing' || flight.status === 'Check In';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-4">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Airline Logo - UVIJEK BIJELA POZADINA */}
            <div className="w-16 h-12 relative bg-white rounded-lg border border-gray-300 flex-shrink-0 overflow-hidden">
              <Image
                src={logoError ? placeholderUrl : logoUrl}
                alt={`${flight.KompanijaNaziv} logo`}
                fill
                className="object-contain p-1"
                onError={() => setLogoError(true)}
                loading="eager"
                priority={true}
              />
            </div>

            {/* Flight Info */}
            <div className="flex-1 min-w-0">
              <a
                href={`https://www.flightaware.com/live/flight/${flight.KompanijaICAO}${flight.ident}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-80 transition-opacity"
              >
                <Tooltip text={`Track ${flight.KompanijaICAO} ${flight.ident} on FlightAware`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold text-gray-900 dark:text-white truncate">
                      {flight.Kompanija} {flight.ident}
                    </span>
                    <PlaneTakeoff size={16} className="text-blue-500 flex-shrink-0" />
                  </div>
                </Tooltip>
              </a>
              
              <div className="flex items-center gap-2">
                <Building size={14} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400 truncate">
                  {flight.grad}
                </span>
              </div>

              {/* Gate and Check-in - Always visible on mobile */}
              {type === 'departure' && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {flight.gate && (
                    <div className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-bold ${
                      isCheckInStatus 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 animate-pulse' 
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`}>
                      <MapPin size={14} />
                      Gate {flight.gate}
                    </div>
                  )}
                  {flight.checkIn && (
                    <div className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-bold ${
                      isCheckInStatus 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 animate-pulse' 
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    }`}>
                      <UserCheck size={14} />
                      Check-in {flight.checkIn}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex-shrink-0 ml-2">
            <StatusBadge status={flight.status} />
          </div>
        </div>

        {/* Time Information Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <TimePill 
            icon={CalendarDays} 
            time={flight.scheduled_out || '-'} 
            label="Scheduled" 
            variant="scheduled"
          />
          <TimePill 
            icon={Hourglass} 
            time={flight.estimated_out || '-'} 
            label="Estimated" 
            variant="estimated"
          />
          <TimePill 
            icon={type === 'departure' ? PlaneTakeoff : PlaneLanding} 
            time={flight.actual_out || '-'} 
            label="Actual" 
            variant="actual"
          />
        </div>

        {/* Expandable Section Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center gap-2 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors border-t border-gray-100 dark:border-gray-700"
        >
          <span className="text-sm font-medium">Details</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Expandable Content */}
        {isOpen && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3 animate-in fade-in duration-200">
            {/* Gate and Check-in Details - VEĆI I ISTAKNUTIJI */}
            {type === 'departure' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoPill 
                  icon={MapPin} 
                  value={flight.gate} 
                  label="Departure Gate" 
                  highlight={true}
                  blink={isCheckInStatus}
                />
                <InfoPill 
                  icon={UserCheck} 
                  value={flight.checkIn} 
                  label="Check-in Counters"
                  blink={isCheckInStatus}
                />
              </div>
            )}

            {/* Flight Information */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Info size={16} />
                Flight Information
              </h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>Passengers should arrive at the airport at least two hours before departure.</p>
                <p>
                  For dangerous goods regulations, visit{' '}
                  <a
                    href="https://www.iata.org/en/programs/cargo/dgr/dgr-guidance-passengers/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                  >
                    IATA Guidance
                  </a>
                </p>
              </div>
            </div>

            {/* Additional Flight Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                <span className="font-medium text-gray-500 dark:text-gray-400">Airline:</span>
                <span className="text-gray-900 dark:text-white">{flight.KompanijaNaziv}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                <span className="font-medium text-gray-500 dark:text-gray-400">Type:</span>
                <span className="text-gray-900 dark:text-white">{type}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightCard;