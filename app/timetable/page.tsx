'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FlightAnnouncementsProvider } from '@/components/ui/FlightAnnouncementsProvider';
import { useFlightAnnouncements } from '@/lib/flightTTS';
import FlightCard from '@/components/ui/FlightCard';
import AirlineDistributionCard from '@/components/ui/AirlineDistributionCard';
import FlightDelayCalculator from '@/components/ui/FlightDelayCalculator';
import Skeleton from '@/components/ui/skeleton';
import { 
  PlaneTakeoff, 
  PlaneLanding, 
  ListFilter, 
  List, 
  Search, 
  Settings,
  Clock,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  Headphones,
  Music
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';
import { 
  setupBackgroundMusicForKiosk, 
  playBackgroundMusicForKiosk, 
  cleanupAudioResources, 
  pauseBackgroundMusic, 
  setBackgroundMusicVolume, 
  updateFlightStatus,
  debugAudioStatus,
  // Dodaj sve auto-play funkcije ovde
  autoInitializeAudio,
  forceAudioStart,
  unlockAudioContext,
  warmupAudioSystem,
  isAudioAllowed
} from '@/lib/audioManager';
import { 
  startEmergencyAnnouncementPolling, 
  stopEmergencyAnnouncementPolling 
} from '@/lib/emergencyAnnouncementSync';
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

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

const Tab = ({ label, isActive, onClick, icon }: TabProps) => (
  <button
    type="button"
    className={`flex items-center py-3 px-6 font-semibold rounded-xl transition-all duration-300 ${
      isActive 
        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-[1.02]' 
        : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-md backdrop-blur-sm border border-white/30 dark:border-gray-700/50'
    }`}
    onClick={onClick}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  isPlaying: boolean;
  onToggle: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const VolumeControl = ({ 
  volume, 
  onVolumeChange, 
  isPlaying, 
  onToggle,
  isLoading = false,
  error = null
}: VolumeControlProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(parseFloat(e.target.value));
  };

  return (
    <div className="rounded-2xl bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white mr-3 ${
            isLoading 
              ? 'bg-gradient-to-br from-gray-500 to-gray-600 animate-pulse' 
              : error 
              ? 'bg-gradient-to-br from-red-500 to-pink-600' 
              : isPlaying 
              ? 'bg-gradient-to-br from-green-500 to-teal-600' 
              : 'bg-gradient-to-br from-blue-500 to-purple-600'
          }`}>
            {isLoading ? (
              <Music className="h-5 w-5 animate-spin" />
            ) : error ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <Headphones className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Background Music</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLoading ? 'Initializing...' : error ? 'Error detected' : 'Ambient airport sounds'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={isLoading || !!error}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
            isLoading
              ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white cursor-not-allowed'
              : error
              ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:shadow-lg'
              : isPlaying
              ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white hover:shadow-lg'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg'
          }`}
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span>{isLoading ? 'Loading...' : isPlaying ? 'Playing' : 'Play'}</span>
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">Soft</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {Math.round(volume * 100)}%
          </span>
          <span className="text-gray-500 dark:text-gray-400">Loud</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleChange}
          disabled={isLoading || !!error}
          className="w-full h-2 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-red-500/5 to-pink-600/5 border border-red-200 dark:border-red-800">
          <div className="flex items-center text-sm">
            <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 mr-2" />
            <span className="text-red-600 dark:text-red-400 flex-1">{error}</span>
            <button 
              type="button"
              onClick={onToggle}
              className="ml-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 whitespace-nowrap"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        .slider:disabled::-webkit-slider-thumb {
          background: linear-gradient(135deg, #9ca3af, #6b7280);
          cursor: not-allowed;
        }
        .slider:disabled::-moz-range-thumb {
          background: linear-gradient(135deg, #9ca3af, #6b7280);
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

interface SearchControlProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const SearchControl = ({ 
  searchQuery, 
  onSearchChange 
}: SearchControlProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-xl p-6">
      <div className="flex items-center mb-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white mr-3">
          <Search className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Search Flights</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Flight, airline, destination</p>
        </div>
      </div>
      
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search flights..."
          value={searchQuery}
          onChange={handleChange}
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300"
        />
      </div>
    </div>
  );
};

function TimetableContent({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<'departures' | 'arrivals'>('departures');
  const [lastFetchedTime, setLastFetchedTime] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllFlights, setShowAllFlights] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [volume, setVolume] = useState<number>(0.2);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  
  const audioInitializationAttempted = useRef(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const flightData = useFlightAnnouncements() as FlightData | null | undefined;
  const flights = user ? flightData : null;

  const now = useMemo(() => new Date(), []);
  const tenMinutesAgo = useMemo(() => new Date(now.getTime() - 10 * 60 * 1000), [now]);

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

  const timeFilteredDepartures = useMemo(
    () => (flights?.departures ? getFilteredFlightsByTime(flights.departures) : []),
    [flights?.departures, getFilteredFlightsByTime]
  );
  const timeFilteredArrivals = useMemo(
    () => (flights?.arrivals ? getFilteredFlightsByTime(flights.arrivals) : []),
    [flights?.arrivals, getFilteredFlightsByTime]
  );

  const filteredFlights = useMemo(() => {
    const currentFlights = activeTab === 'departures' ? timeFilteredDepartures : timeFilteredArrivals;
    if (!debouncedSearchQuery) {
      return currentFlights;
    }
    const lowerCaseSearchQuery = debouncedSearchQuery.toLowerCase();
    return currentFlights.filter(flight => {
      const flightNumberMatch = flight.ident?.toLowerCase().includes(lowerCaseSearchQuery);
      const iataCodeMatch = flight.Kompanija?.toLowerCase().includes(lowerCaseSearchQuery);
      const destinationMatch = flight.grad?.toLowerCase().includes(lowerCaseSearchQuery);
      const destinationCodeMatch = flight.destination?.code?.toLowerCase().includes(lowerCaseSearchQuery);
      return flightNumberMatch || iataCodeMatch || destinationMatch || destinationCodeMatch;
    });
  }, [activeTab, timeFilteredDepartures, timeFilteredArrivals, debouncedSearchQuery]);

  const allFlights = useMemo(
    () => [...(flights?.departures || []), ...(flights?.arrivals || [])],
    [flights?.departures, flights?.arrivals]
  );

  // Auto-initialize audio on component mount
  useEffect(() => {
    if (user && !audioInitialized) {
      console.log('Starting auto audio initialization for kiosk...');
      
      const initializeAudio = async () => {
        setIsAudioLoading(true);
        
        try {
          // Strategy 1: Direct auto-initialization
          let success = await autoInitializeAudio();
          
          // Strategy 2: If that fails, try with more aggressive approach
          if (!success) {
            console.log('Standard auto-init failed, trying aggressive approach...');
            
            // Add a longer delay for browser to settle
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Try force start
            success = await forceAudioStart();
          }
          
          if (success) {
            setAudioInitialized(true);
            setIsAudioPlaying(true);
            setAudioError(null);
            console.log('Kiosk audio started successfully!');
          } else {
            // Set a delayed retry
            console.log('Audio initialization failed, will retry in 5 seconds...');
            setAudioError('Audio initialization in progress...');
            
            setTimeout(async () => {
              const retrySuccess = await forceAudioStart();
              if (retrySuccess) {
                setAudioInitialized(true);
                setIsAudioPlaying(true);
                setAudioError(null);
                console.log('Audio started on retry!');
              } else {
                setAudioError('Audio failed to start automatically. Click play button to try manually.');
              }
              setIsAudioLoading(false);
            }, 5000);
          }
        } catch (error) {
          console.error('Auto audio initialization error:', error);
          setAudioError('Audio initialization error. Please refresh.');
        } finally {
          setIsAudioLoading(false);
        }
      };
      
      // Start with a small delay to let page render
      const timer = setTimeout(() => {
        void initializeAudio();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, audioInitialized]);

  // Improved audio toggle with better error handling
  const handleAudioToggle = useCallback(async () => {
    if (!audioInitialized) {
      console.log('Initializing audio on toggle...');
      setIsAudioLoading(true);
      
      try {
        const success = await autoInitializeAudio();
        if (success) {
          setAudioInitialized(true);
          setIsAudioPlaying(true);
          setAudioError(null);
        } else {
          setAudioError('Failed to initialize audio. Please try again.');
        }
      } catch (error) {
        setAudioError('Audio initialization error.');
      } finally {
        setIsAudioLoading(false);
      }
      return;
    }

    setIsAudioLoading(true);
    setAudioError(null);

    try {
      if (isAudioPlaying) {
        pauseBackgroundMusic();
        setIsAudioPlaying(false);
        console.log('Background music paused');
      } else {
        // Add small delay to avoid race conditions
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const success = await playBackgroundMusicForKiosk();
        if (success) {
          setIsAudioPlaying(true);
          console.log('Background music started');
        } else {
          setAudioError('Failed to start audio. Please try again.');
        }
      }
    } catch (error: any) {
      console.log('Audio toggle error:', error);
      
      // Special handling for common errors
      if (error.name === 'AbortError' || error.message?.includes('play()')) {
        setAudioError('Audio was interrupted. Trying again...');
        
        // Try to recover
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          const retrySuccess = await playBackgroundMusicForKiosk();
          if (retrySuccess) {
            setIsAudioPlaying(true);
            setAudioError(null);
            console.log('Audio started successfully on retry');
          } else {
            setAudioError('Audio still not working. Please refresh.');
          }
        } catch (retryError) {
          console.log('Audio retry failed:', retryError);
          setAudioError('Audio system error.');
        }
      } else {
        setAudioError('Audio error occurred. Please try again.');
      }
    } finally {
      setIsAudioLoading(false);
    }
  }, [audioInitialized, isAudioPlaying]);

  // Improved volume change
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    try {
      setBackgroundMusicVolume(newVolume);
    } catch (error) {
      console.log('Volume change error:', error);
    }
  }, []);

  // Continuous audio monitoring and recovery
  useEffect(() => {
    if (!user || !audioInitialized || !isAudioPlaying) return;

    let checkInterval: NodeJS.Timeout | null = null;

    const monitorAudio = () => {
      // Check if audio is still playing
      const isPlaying = window.audioManager?.isBackgroundMusicPlaying() || false;
      
      if (!isPlaying && isAudioPlaying) {
        console.log('Audio stopped unexpectedly, attempting to recover...');
        
        // Try to restart audio
        setTimeout(async () => {
          try {
            const success = await playBackgroundMusicForKiosk();
            if (success) {
              console.log('Audio recovered successfully');
            } else {
              console.log('Audio recovery failed');
            }
          } catch (error) {
            console.log('Audio recovery error:', error);
          }
        }, 1000);
      }
    };

    // Check every 10 seconds
    checkInterval = setInterval(monitorAudio, 10000);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [user, audioInitialized, isAudioPlaying]);

  // Handle page visibility changes (tab switching)
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page hidden, pausing audio...');
        pauseBackgroundMusic();
        setIsAudioPlaying(false);
      } else {
        console.log('Page visible again, resuming audio...');
        // Wait a bit before resuming
        setTimeout(async () => {
          if (audioInitialized) {
            const success = await playBackgroundMusicForKiosk();
            setIsAudioPlaying(success);
          }
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, audioInitialized]);

  // Other existing effects
  useEffect(() => {
    if (user) {
      startEmergencyAnnouncementPolling(5000);
      return () => {
        stopEmergencyAnnouncementPolling();
      };
    }
  }, [user]);

  useEffect(() => {
    if (flights) {
      const hasFlights = (flights.departures && flights.departures.length > 0) || 
                         (flights.arrivals && flights.arrivals.length > 0);
      updateFlightStatus(hasFlights);
    }
  }, [flights]);

  useEffect(() => {
    if (audioInitialized) {
      setBackgroundMusicVolume(volume);
    }
  }, [volume, audioInitialized]);

  useEffect(() => {
    return () => {
      cleanupAudioResources();
    };
  }, []);

  useEffect(() => {
    if (flights) {
      setLastFetchedTime(new Date().toLocaleString());
    }
  }, [flights]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab(prevTab => (prevTab === 'departures' ? 'arrivals' : 'departures'));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Auto-refresh flights data
  useEffect(() => {
    if (!autoRefresh) return;

    const refreshInterval = setInterval(() => {
      setLastFetchedTime(new Date().toLocaleString());
    }, 60000); // Refresh every minute

    return () => clearInterval(refreshInterval);
  }, [autoRefresh]);

  // Reset audio error after some time
  useEffect(() => {
    if (audioError) {
      const timer = setTimeout(() => {
        setAudioError(null);
      }, 10000); // Clear error after 10 seconds
      return () => clearTimeout(timer);
    }
  }, [audioError]);

  return (
    <div className="min-h-screen">
      <FlightAnnouncementsProvider />
      <ScreenWakeManager enabled={true} autoStart={true} retryDelay={3000} />
      
      {/* Audio Error Notification */}
      {audioError && (
        <div className="fixed top-4 right-4 z-50 max-w-sm animate-in slide-in-from-right-8">
          <div className="rounded-xl bg-gradient-to-r from-red-500/10 to-pink-600/10 backdrop-blur-xl border border-red-200 dark:border-red-800 shadow-2xl p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
              <span className="text-red-700 dark:text-red-300 text-sm flex-1">{audioError}</span>
              <button 
                type="button"
                onClick={() => setAudioError(null)}
                className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl p-6 bg-gradient-to-r from-blue-500/10 to-purple-600/10 backdrop-blur-sm border border-white/30 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Departures</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {timeFilteredDepartures.length}
              </p>
            </div>
            <PlaneTakeoff className="h-8 w-8 text-blue-500 dark:text-blue-400" />
          </div>
        </div>
        
        <div className="rounded-2xl p-6 bg-gradient-to-r from-green-500/10 to-teal-600/10 backdrop-blur-sm border border-white/30 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Arrivals</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {timeFilteredArrivals.length}
              </p>
            </div>
            <PlaneLanding className="h-8 w-8 text-green-500 dark:text-green-400" />
          </div>
        </div>
        
        <div className="rounded-2xl p-6 bg-gradient-to-r from-purple-500/10 to-pink-600/10 backdrop-blur-sm border border-white/30 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Airlines</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {new Set(allFlights.map(f => f.Kompanija)).size}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500 dark:text-purple-400" />
          </div>
        </div>
        
        <div className="rounded-2xl p-6 bg-gradient-to-r from-orange-500/10 to-red-600/10 backdrop-blur-sm border border-white/30 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Live Updates</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {autoRefresh ? 'ON' : 'OFF'}
              </p>
            </div>
            <RefreshCw className={`h-8 w-8 text-orange-500 dark:text-orange-400 ${autoRefresh ? 'animate-spin' : ''}`} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
          {/* Header Controls */}
          <div className="rounded-2xl bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex space-x-3">
                <Tab
                  label="Departures"
                  isActive={activeTab === 'departures'}
                  onClick={() => setActiveTab('departures')}
                  icon={<PlaneTakeoff size={20} />}
                />
                <Tab
                  label="Arrivals"
                  isActive={activeTab === 'arrivals'}
                  onClick={() => setActiveTab('arrivals')}
                  icon={<PlaneLanding size={20} />}
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShowAllFlights(!showAllFlights)}
                  className={`flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    showAllFlights
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/50'
                  }`}
                >
                  {showAllFlights ? <ListFilter size={16} /> : <List size={16} />}
                  {showAllFlights ? 'Hide Past' : 'Show All'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    autoRefresh
                      ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg'
                      : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/50'
                  }`}
                >
                  <RefreshCw size={16} className={autoRefresh ? 'animate-spin' : ''} />
                  {autoRefresh ? 'Auto ON' : 'Auto OFF'}
                </button>
              </div>
            </div>

            {/* Mobile Search */}
            <div className="mt-4 lg:hidden">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search flights..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="lg:hidden space-y-4">
            <VolumeControl
              volume={volume}
              onVolumeChange={handleVolumeChange}
              isPlaying={isAudioPlaying}
              onToggle={handleAudioToggle}
              isLoading={isAudioLoading}
              error={audioError}
            />
            
            <div className="rounded-2xl bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-xl p-6">
              <AirlineDistributionCard flights={allFlights} />
            </div>
          </div>

          {/* Flight Cards */}
          <div className="space-y-4">
            {flights ? (
              filteredFlights.length > 0 ? (
                filteredFlights.map((flight) => {
                  const uniqueKey = `${flight.ident}-${flight.TipLeta}-${flight.scheduled_out}-${flight.destination?.code || 'UNK'}-${flight.origin?.code || 'UNK'}`;
                  return (
                    <div key={uniqueKey} className="group">
                      <FlightCard 
                        flight={flight}
                        type={activeTab === 'departures' ? 'departure' : 'arrival'}
                      />
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-xl p-8 text-center">
                  <PlaneTakeoff className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No flights found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Try adjusting your search or filter settings
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="rounded-2xl bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-xl p-6">
                    <Skeleton className="h-24 mb-3 rounded-xl" />
                    <Skeleton className="h-6 w-full mb-2 rounded-lg" />
                    <Skeleton className="h-6 w-3/4 rounded-lg" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Last Updated */}
          {lastFetchedTime && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Last updated: {lastFetchedTime}</span>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Desktop Search */}
          <div className="hidden lg:block">
            <SearchControl 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Desktop Controls */}
          <div className="hidden lg:block space-y-6">
            <VolumeControl
              volume={volume}
              onVolumeChange={handleVolumeChange}
              isPlaying={isAudioPlaying}
              onToggle={handleAudioToggle}
              isLoading={isAudioLoading}
              error={audioError}
            />

            <div className="rounded-2xl bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-xl p-6">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white mr-3">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">View Options</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Adjust flight display</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowAllFlights(!showAllFlights)}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl w-full text-sm font-semibold transition-all duration-300 ${
                    showAllFlights
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/50'
                  }`}
                >
                  {showAllFlights ? <ListFilter size={16} /> : <List size={16} />}
                  {showAllFlights ? 'Hide Past Flights' : 'Show All Flights'}
                </button>

                <button
                  type="button"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl w-full text-sm font-semibold transition-all duration-300 ${
                    autoRefresh
                      ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg'
                      : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 backdrop-blur-sm border border-white/30 dark:border-gray-700/50'
                  }`}
                >
                  <RefreshCw size={16} className={autoRefresh ? 'animate-spin' : ''} />
                  {autoRefresh ? 'Auto Refresh: ON' : 'Auto Refresh: OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* Airline Distribution - Desktop */}
          <div className="hidden lg:block">
            <div className="rounded-2xl bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-xl overflow-hidden">
              <div className="p-6">
                <AirlineDistributionCard flights={allFlights} compact={true} />
              </div>
            </div>
          </div>

          {/* Flight Delay Calculator */}
          <div className="rounded-2xl bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-xl overflow-hidden">
            <FlightDelayCalculator />
          </div>

          {/* Debug Audio Button and Recovery */}
          <div className="text-center space-y-2">
            <button 
              type="button"
              onClick={() => {
                debugAudioStatus();
                setAudioError('Debug info logged to console');
              }}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Debug Audio Status
            </button>
            
            {audioError && (
              <button
                type="button"
                onClick={async () => {
                  setIsAudioLoading(true);
                  setAudioError(null);
                  try {
                    const success = await forceAudioStart();
                    if (success) {
                      setAudioInitialized(true);
                      setIsAudioPlaying(true);
                    } else {
                      setAudioError('Still unable to start audio. Try refreshing.');
                    }
                  } catch (error) {
                    setAudioError('Recovery failed.');
                  } finally {
                    setIsAudioLoading(false);
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow text-sm"
              >
                Recover Audio
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="rounded-2xl bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-2xl p-8 max-w-md w-full text-center">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-6 animate-pulse flex items-center justify-center">
            <PlaneTakeoff className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
          Loading Timetable
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Fetching live flight data from Tivat Airport...
        </p>
        <div className="h-1 w-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 animate-[pulse_2s_ease-in-out_infinite]"></div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const { user } = useUser();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (user) {
      setAuthChecked(true);
      return;
    }

    const timer = setTimeout(() => {
      if (!user) {
        router.push('/sign-in');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [user, router]);

  if (!authChecked && !user) {
    return <LoadingScreen />;
  }

  return <TimetableContent user={user} />;
}