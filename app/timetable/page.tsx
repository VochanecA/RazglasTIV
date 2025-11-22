'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FlightAnnouncementsProvider } from '@/components/ui/FlightAnnouncementsProvider';
import { useFlightAnnouncements } from '@/lib/flightTTS';
import FlightCard from '@/components/ui/FlightCard';
import AirlineDistributionCard from '@/components/ui/AirlineDistributionCard';
import Skeleton from '@/components/ui/skeleton';
import { PlaneTakeoff, PlaneLanding, Lock, ListFilter, List, Volume2, VolumeX, Volume1, Volume } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';
import { 
  setupBackgroundMusicForKiosk, 
  playBackgroundMusicForKiosk, 
  startKioskAudioWithRetry,
  cleanupAudioResources, 
  pauseBackgroundMusic, 
  setBackgroundMusicVolume, 
  getBackgroundMusicVolume 
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
    className={`flex items-center py-2 px-4 font-semibold ${isActive ? 'border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
    onClick={onClick}
  >
    {icon}
    <span className="ml-2">{label}</span>
  </button>
);

// Volume Control Card Component
const VolumeControlCard = ({ 
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
  <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Volume2 className="text-blue-500" size={20} />
        Background Music Control
      </h3>
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 py-2 px-4 rounded-full font-semibold transition-colors duration-200 ease-in-out ${
          isPlaying 
            ? 'bg-green-600 text-white hover:bg-green-700' 
            : 'bg-red-600 text-white hover:bg-red-700'
        }`}
      >
        {isPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
        <span>{isPlaying ? 'Music On' : 'Music Off'}</span>
      </button>
    </div>
    
    <div className="flex items-center gap-4">
      <VolumeX className="text-gray-500" size={20} />
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
      />
      <Volume className="text-gray-500" size={20} />
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300 w-12">
        {Math.round(volume * 100)}%
      </span>
    </div>
    
    <style jsx>{`
      .slider::-webkit-slider-thumb {
        appearance: none;
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
      .slider::-moz-range-thumb {
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
    `}</style>
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
  const [isAudioPlaying, setIsAudioPlaying] = useState(true); // Default to true for kiosk
  const [volume, setVolume] = useState<number>(0.2); // Default volume

  // Debounce the search query to reduce re-renders during typing
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Always call the hook unconditionally
  const flightData = useFlightAnnouncements() as FlightData | null | undefined;

  // Conditionally handle flights based on user
  const flights = user ? flightData : null;

  // Global error handler for audio and wake lock errors
  useEffect(() => {
    const handleAudioError = (event: ErrorEvent) => {
      if (event.error && event.error.message && 
          (event.error.message.includes('play()') || 
           event.error.message.includes('WakeLock') ||
           event.error.message.includes('wake lock'))) {
        event.preventDefault();
        console.log('Audio/WakeLock error handled silently:', event.error.message);
        return false;
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message && 
          (event.reason.message.includes('play()') || 
           event.reason.message.includes('WakeLock') ||
           event.reason.message.includes('wake lock'))) {
        event.preventDefault();
        console.log('Audio/WakeLock promise rejection handled silently:', event.reason.message);
        return false;
      }
    };

    window.addEventListener('error', handleAudioError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleAudioError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Effect for setting up and auto-playing background music for kiosk
  useEffect(() => {
    if (user && !audioInitialized) {
      console.log('Kiosk mode: Setting up background music');
      
      const initializeKioskAudio = async () => {
        try {
          // Use kiosk audio setup - this won't throw errors to UI
          const setupSuccess = await setupBackgroundMusicForKiosk();
          
          if (setupSuccess) {
            setAudioInitialized(true);
            
            // Set initial volume
            setBackgroundMusicVolume(volume);
            
            // Try to start audio with silent retry logic
            const audioStarted = await startKioskAudioWithRetry(2);
            
            if (audioStarted) {
              setIsAudioPlaying(true);
              console.log('Kiosk mode: Background music started');
            } else {
              // This is normal - audio will start on first user interaction
              console.log('Kiosk mode: Audio ready - will start on user interaction');
            }
          }
        } catch (error) {
          // SILENT CATCH - don't set any state that would cause re-render with error
          console.log('Audio initialization completed (ready for user interaction)');
        }
      };

      initializeKioskAudio();
    }
  }, [user, audioInitialized, volume]);

  // Effect to sync volume with audio manager
  useEffect(() => {
    if (audioInitialized) {
      setBackgroundMusicVolume(volume);
    }
  }, [volume, audioInitialized]);

  // Effect to handle user interaction as fallback
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (audioInitialized && !isAudioPlaying) {
        console.log('User interaction detected, starting audio silently...');
        playBackgroundMusicForKiosk().then(success => {
          if (success) {
            setIsAudioPlaying(true);
          }
          // Don't show errors - this is silent
        }).catch(() => {
          // Silent catch - no UI updates
          console.log('Audio start on interaction completed silently');
        });
      }
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, [audioInitialized, isAudioPlaying]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      cleanupAudioResources();
    };
  }, []);

  // Function to handle audio play/pause
  const handleAudioToggle = useCallback(async () => {
    if (!audioInitialized) {
      console.log('Initializing audio silently');
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
        // Don't show error if failed - it will start on next user interaction
      }
    } catch (error) {
      // SILENT CATCH - no UI error state
      console.log('Audio toggle completed silently');
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
    <div className="container mx-auto p-4 bg-white dark:bg-gray-800">
      {/* Silent screen wake manager - no UI, just functionality */}
      <ScreenWakeManager enabled={true} autoStart={true} retryDelay={3000} />
      
      <FlightAnnouncementsProvider />

      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Flight Information
      </h1>
      
      {/* Volume Control Card */}
      <VolumeControlCard
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isPlaying={isAudioPlaying}
        onToggle={handleAudioToggle}
      />
      
      {/* Airline Distribution Card */}
      <div className="mb-6">
        <AirlineDistributionCard flights={allFlights} />
      </div>

      {/* Search Input Field */}
      <input
        type="text"
        placeholder="Search Flights, airlines, destination, IATA code of origin/destination..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4 p-2 border rounded-full bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-300 w-full"
      />

      {/* Tabs and Show All Flights Toggle */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
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

        {/* Show All Flights Toggle Button */}
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
              <span>Hide</span>
            </>
          ) : (
            <>
              <List size={18} />
              <span>All</span>
            </>
          )}
        </button>
      </div>

      {/* Show skeletons while loading flights */}
      {flights ? (
        <div className="flex flex-col gap-4">
          {filteredFlights.length > 0 ? (
            filteredFlights.map((flight) => {
              // KREIRAJTE JEDINSTVENI KLJUČ KOMBINACIJOM VIŠE POLJA
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
            <p className="text-gray-500">No flights found</p>
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
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          Last fetched at: {lastFetchedTime}
        </div>
      )}
    </div>
  );
}