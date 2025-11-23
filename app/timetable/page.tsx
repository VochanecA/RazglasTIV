'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FlightAnnouncementsProvider } from '@/components/ui/FlightAnnouncementsProvider';
import { useFlightAnnouncements } from '@/lib/flightTTS';
import FlightCard from '@/components/ui/FlightCard';
import AirlineDistributionCard from '@/components/ui/AirlineDistributionCard';
import FlightDelayCalculator from '@/components/ui/FlightDelayCalculator';
import Skeleton from '@/components/ui/skeleton';
import { PlaneTakeoff, PlaneLanding, Lock, ListFilter, List, Volume2, VolumeX, Volume1, Volume, Search, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';
import { 
  setupBackgroundMusicForKiosk, 
  playBackgroundMusicForKiosk, 
  startKioskAudioWithRetry,
  autoStartKioskAudio,
  cleanupAudioResources, 
  pauseBackgroundMusic, 
  setBackgroundMusicVolume, 
  getBackgroundMusicVolume,
  updateFlightStatus,
  debugAudioStatus
} from '@/lib/audioManager';
import { FlightData, Flight } from '@/types/flight';
import { ScreenWakeManager } from '@/components/ScreenWakeManager';

// Custom hook for debouncing a value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const Tab = ({ label, isActive, onClick, icon }: { label: string; isActive: boolean; onClick: () => void; icon: React.ReactNode }) => (
  <button
    className={`flex items-center py-2 px-4 font-semibold transition-colors duration-200 ${
      isActive 
        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' 
        : 'text-gray-500 hover:text-blue-600 dark:hover:text-blue-400'
    }`}
    onClick={onClick}
  >
    {icon}
    <span className="ml-2">{label}</span>
  </button>
);

// Volume Control Component za sidebar
const VolumeControl = ({ 
  volume, 
  onVolumeChange, 
  isPlaying, 
  onToggle 
}: { 
  volume: number;
  onVolumeChange: (volume: number) => void;
  isPlaying: boolean;
  onToggle: () => void;
}) => (
  <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Volume2 className="text-blue-500" size={16} />
        Background Music
      </h3>
      <button
        onClick={onToggle}
        className={`flex items-center gap-1 py-1 px-3 rounded-full text-xs font-semibold transition-colors duration-200 ease-in-out ${
          isPlaying 
            ? 'bg-green-600 text-white hover:bg-green-700' 
            : 'bg-red-600 text-white hover:bg-red-700'
        }`}
      >
        {isPlaying ? <Volume2 size={14} /> : <VolumeX size={14} />}
        <span>{isPlaying ? 'On' : 'Off'}</span>
      </button>
    </div>
    
    <div className="flex items-center gap-3">
      <VolumeX className="text-gray-500 flex-shrink-0" size={16} />
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
      />
      <Volume className="text-gray-500 flex-shrink-0" size={16} />
      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-8 text-right">
        {Math.round(volume * 100)}%
      </span>
    </div>
    
    <style jsx>{`
      .slider::-webkit-slider-thumb {
        appearance: none;
        height: 16px;
        width: 16px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: 2px solid #ffffff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }
      .slider::-moz-range-thumb {
        height: 16px;
        width: 16px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: 2px solid #ffffff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }
    `}</style>
  </div>
);

// Search Component za sidebar
const SearchControl = ({ 
  searchQuery, 
  onSearchChange 
}: { 
  searchQuery: string;
  onSearchChange: (value: string) => void;
}) => (
  <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-2 mb-2">
      <Search className="text-blue-500" size={16} />
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
        Search Flights
      </h3>
    </div>
    
    <input
      type="text"
      placeholder="Flight, airline, destination..."
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
      className="w-full p-2 text-sm border rounded-lg bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600"
    />
  </div>
);

export default function Page() {
  const { user } = useUser();
  const router = useRouter();
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<'departures' | 'arrivals'>('departures');
  const [lastFetchedTime, setLastFetchedTime] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllFlights, setShowAllFlights] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [volume, setVolume] = useState<number>(0.2);

  // Debounce the search query to reduce re-renders during typing
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Always call the hook unconditionally
  const flightData = useFlightAnnouncements() as FlightData | null | undefined;

  // Conditionally handle flights based on user
  const flights = user ? flightData : null;

  // KIOSK MODE: Auto-start background music without user interaction
  useEffect(() => {
    if (user && !audioInitialized) {
      console.log('Kiosk mode: Starting automatic audio setup...');
      
      const initializeKioskAudio = async () => {
        try {
          // Use the new auto-start function that handles everything
          await autoStartKioskAudio();
          
          setAudioInitialized(true);
          
          // Set initial volume
          setBackgroundMusicVolume(volume);
          
          // Check if audio is playing
          setIsAudioPlaying(true);
          
          console.log('Kiosk mode: Audio initialization completed');
        } catch (error) {
          // Silent catch - don't show errors in UI
          console.log('Kiosk audio initialization completed');
          setAudioInitialized(true);
        }
      };

      initializeKioskAudio();
    }
  }, [user, audioInitialized, volume]);

  // Update flight status when flights are loaded
  useEffect(() => {
    if (flights) {
      const hasFlights = (flights.departures && flights.departures.length > 0) || 
                         (flights.arrivals && flights.arrivals.length > 0);
      updateFlightStatus(hasFlights);
    }
  }, [flights]);

  // Effect to sync volume with audio manager
  useEffect(() => {
    if (audioInitialized) {
      setBackgroundMusicVolume(volume);
    }
  }, [volume, audioInitialized]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      cleanupAudioResources();
    };
  }, []);

  // Function to handle audio play/pause
  const handleAudioToggle = useCallback(async () => {
    if (!audioInitialized) {
      console.log('Initializing audio for kiosk mode');
      const setupSuccess = await setupBackgroundMusicForKiosk();
      if (setupSuccess) {
        setAudioInitialized(true);
      }
    }

    try {
      if (isAudioPlaying) {
        pauseBackgroundMusic();
        setIsAudioPlaying(false);
        console.log('Background music paused');
      } else {
        const success = await playBackgroundMusicForKiosk();
        if (success) {
          setIsAudioPlaying(true);
          console.log('Background music started');
        }
      }
    } catch (error) {
      console.log('Audio toggle completed');
    }
  }, [audioInitialized, isAudioPlaying]);

  // Function to handle volume change
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (audioInitialized) {
      setBackgroundMusicVolume(newVolume);
    }
  }, [audioInitialized]);

  // Redirect to sign-in after showing message
  useEffect(() => {
    if (!user) {
      setShowLoginMessage(true);

      const redirectTimer = setTimeout(() => {
        router.push('/sign-in');
      }, 10000);

      return () => clearTimeout(redirectTimer);
    }
  }, [user, router]);

  // Effect to update last fetched time when flights are fetched
  useEffect(() => {
    if (flights) {
      setLastFetchedTime(new Date().toLocaleString());
    }
  }, [flights]);

  // Effect to switch tabs every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab(prevTab => (prevTab === 'departures' ? 'arrivals' : 'departures'));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // If no user, show login prompt
  if (!user && showLoginMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8 max-w-md w-full text-center">
          <Lock className="mx-auto mb-4 text-gray-500" size={48} />
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Login Required
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            To view this page, you must log in to your account.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You will be redirected to the login page in 10 seconds...
          </p>
          <button
            onClick={() => router.push('/sign-in')}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login Now
          </button>
        </div>
      </div>
    );
  }

  // Render nothing if still loading or no user
  if (!user) return null;

  // Define a grace period for filtering out departed/arrived flights
  const now = useMemo(() => new Date(), []);
  const tenMinutesAgo = useMemo(() => new Date(now.getTime() - 10 * 60 * 1000), [now]);

  // Memoize the time-based filtering function
  const getFilteredFlightsByTime = useCallback((flightsArray: Flight[]) => {
    if (showAllFlights) {
      return flightsArray;
    }
    return flightsArray.filter(flight => {
      if (!flight.scheduled_out) return false;
      const [hours, minutes] = flight.scheduled_out.split(':').map(Number);
      const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      return scheduledTime > tenMinutesAgo;
    });
  }, [showAllFlights, now, tenMinutesAgo]);

  // Memoize time-filtered departures and arrivals
  const timeFilteredDepartures = useMemo(
    () => (flights?.departures ? getFilteredFlightsByTime(flights.departures) : []),
    [flights?.departures, getFilteredFlightsByTime]
  );
  const timeFilteredArrivals = useMemo(
    () => (flights?.arrivals ? getFilteredFlightsByTime(flights.arrivals) : []),
    [flights?.arrivals, getFilteredFlightsByTime]
  );

  // Memoize the final filtered flights based on search query and active tab
  const filteredFlights = useMemo(() => {
    const currentFlights = activeTab === 'departures' ? timeFilteredDepartures : timeFilteredArrivals;
    if (!debouncedSearchQuery) {
      return currentFlights;
    }
    const lowerCaseSearchQuery = debouncedSearchQuery.toLowerCase();
    return currentFlights.filter(flight => {
      const flightNumberMatch = flight.ident.toLowerCase().includes(lowerCaseSearchQuery);
      const iataCodeMatch = flight.Kompanija?.toLowerCase().includes(lowerCaseSearchQuery);
      const destinationMatch = flight.grad?.toLowerCase().includes(lowerCaseSearchQuery);
      const destinationCodeMatch = flight.destination.code?.toLowerCase().includes(lowerCaseSearchQuery);
      return flightNumberMatch || iataCodeMatch || destinationMatch || destinationCodeMatch;
    });
  }, [activeTab, timeFilteredDepartures, timeFilteredArrivals, debouncedSearchQuery]);

  // Memoize all flights for airline distribution
  const allFlights = useMemo(
    () => [...(flights?.departures || []), ...(flights?.arrivals || [])],
    [flights?.departures, flights?.arrivals]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Silent screen wake manager - no UI, just functionality */}
      <ScreenWakeManager enabled={true} autoStart={true} retryDelay={3000} />
      
      <FlightAnnouncementsProvider />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 max-w-8xl mx-auto">
        
        {/* Main content area (center) - zauzima 2/3 ili 3/4 širine */}
        <div className="lg:col-span-2 xl:col-span-3">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Flight Information
            </h1>
            
            {/* Flight View Tabs - MAIN CONTENT AREA */}
            <div className="flex space-x-4 mb-4">
              <Tab
                label="Departures"
                isActive={activeTab === 'departures'}
                onClick={() => setActiveTab('departures')}
                icon={<PlaneTakeoff color="lightblue" size={20} />}
              />
              <Tab
                label="Arrivals"
                isActive={activeTab === 'arrivals'}
                onClick={() => setActiveTab('arrivals')}
                icon={<PlaneLanding color="lightblue" size={20} />}
              />
            </div>

            {/* Show All Flights Toggle Button - MAIN CONTENT AREA */}
            <div className="mb-4">
              <button
                onClick={() => setShowAllFlights(!showAllFlights)}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-full font-semibold transition-colors duration-200 ease-in-out
                  ${showAllFlights
                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                    : 'bg-blue-200 text-blue-800 shadow-md hover:bg-blue-300 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700'
                  }`}
              >
                {showAllFlights ? (
                  <>
                    <ListFilter size={18} />
                    <span>Hide Past Flights</span>
                  </>
                ) : (
                  <>
                    <List size={18} />
                    <span>Show All Flights</span>
                  </>
                )}
              </button>
            </div>

            {/* Search Input Field - MOBILE VIEW */}
            <div className="lg:hidden mb-4">
              <input
                type="text"
                placeholder="Search Flights, airlines, destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 border rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600"
              />
            </div>

            {/* Volume Control - MOBILE VIEW */}
            <div className="lg:hidden mb-6">
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Volume2 className="text-blue-500" size={16} />
                    Background Music
                  </h3>
                  <button
                    onClick={handleAudioToggle}
                    className={`flex items-center gap-1 py-1 px-3 rounded-full text-xs font-semibold transition-colors duration-200 ease-in-out ${
                      isAudioPlaying 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isAudioPlaying ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    <span>{isAudioPlaying ? 'On' : 'Off'}</span>
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <VolumeX className="text-gray-500 flex-shrink-0" size={16} />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                  />
                  <Volume className="text-gray-500 flex-shrink-0" size={16} />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-8 text-right">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Airline Distribution Card - MOBILE VIEW */}
          <div className="lg:hidden mb-6">
            <AirlineDistributionCard flights={allFlights} />
          </div>

          {/* Flight Cards */}
          {flights ? (
            <div className="flex flex-col gap-4">
              {filteredFlights.length > 0 ? (
                filteredFlights.map((flight) => {
                  const uniqueKey = `${flight.ident}-${flight.TipLeta}-${flight.scheduled_out}-${flight.destination?.code || 'UNK'}-${flight.origin?.code || 'UNK'}`;
                  return (
                    <FlightCard 
                      key={uniqueKey}
                      flight={flight}
                      type={activeTab === 'departures' ? 'departure' : 'arrival'}
                    />
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No flights found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Try adjusting your search or filter settings
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Display skeletons while loading
            <div className="flex flex-col gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index}>
                  <Skeleton className="h-24 mb-2" />
                  <Skeleton className="h-6 w-full mb-1" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Last Fetched Time */}
          {lastFetchedTime && (
            <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
              Last updated: {lastFetchedTime}
            </div>
          )}
        </div>

        {/* Right sidebar - DESKTOP VIEW - zauzima 1/3 ili 1/4 širine */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Controls Section */}
          <div className="space-y-6">
            {/* Search Control - DESKTOP */}
            <SearchControl 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {/* Show All Flights Toggle - DESKTOP */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Settings className="text-blue-500" size={16} />
                View Options
              </h3>
              <button
                onClick={() => setShowAllFlights(!showAllFlights)}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-full w-full text-sm font-semibold transition-colors duration-200 ease-in-out
                  ${showAllFlights
                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                    : 'bg-blue-200 text-blue-800 shadow-md hover:bg-blue-300 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700'
                  }`}
              >
                {showAllFlights ? (
                  <>
                    <ListFilter size={16} />
                    <span>Hide Past Flights</span>
                  </>
                ) : (
                  <>
                    <List size={16} />
                    <span>Show All Flights</span>
                  </>
                )}
              </button>
            </div>

            {/* Volume Control - DESKTOP */}
            <VolumeControl
              volume={volume}
              onVolumeChange={handleVolumeChange}
              isPlaying={isAudioPlaying}
              onToggle={handleAudioToggle}
            />

            {/* Airline Distribution Card - DESKTOP */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
              <AirlineDistributionCard flights={allFlights} compact={true} />
            </div>
          </div>

          {/* Flight Delay Calculator - DESKTOP */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <FlightDelayCalculator />
          </div>

          {/* Debug button */}
          <div className="text-center">
            <button 
              onClick={debugAudioStatus}
              className="bg-gray-800 text-white p-2 rounded text-xs hover:bg-gray-700 transition-colors"
            >
              Debug Audio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}