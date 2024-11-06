"use client";
import React, { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { fetchFlightData } from '@/app/api/flightData';
import BaggageAnnouncement from '@/components/ui/BaggageAnnouncement';

interface Flight {
  ident: string;
  scheduled_out: string;
  scheduled_on: string;
  gate: string;
  origin: {
    code: string;
    name: string;
  };
  destination: {
    code: string;
    name: string;
  };
  status: string;
}

interface Departure {
  ident: string;
  scheduled_out: string;
  actual_out: string;
  gate: string;
  origin: {
    code: string;
    name: string;
  };
  destination: {
    code: string;
    name: string;
  };
  status: string;
}

interface AnnouncementRecord {
  flightId: string;
  callType: string;
  playedAt: string;
}

interface QueuedAnnouncement {
  audioPath: string;
  flight: Flight | Departure;
  callType: string;
  scheduledTime: string;
}

const ANNOUNCEMENT_SCHEDULE = {
  '1st': -60,
  '2nd': -40,
  'Boarding': -30,
  'LastCall': -15
};

const FlightInfo = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<string>('');
  const [ledState, setLedState] = useState<{ [key: string]: number }>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [playedAnnouncements, setPlayedAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const audioQueue = useRef<QueuedAnnouncement[]>([]);
  const scheduledTimers = useRef<NodeJS.Timeout[]>([]);
  const fetchInterval = useRef<NodeJS.Timeout | null>(null);

 
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await fetchFlightData();
      setFlights(data.flights);
      setDepartures(data.departures);
      setLastFetchTimestamp(data.timestamp);
      setError(null);
    } catch (err) {
      setError('Failed to fetch flight data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFlights = flights.filter(flight =>
    flight.ident.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flight.origin.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flight.destination.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDepartures = departures.filter(departure =>
    departure.ident.toLowerCase().includes(searchQuery.toLowerCase()) ||
    departure.origin.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    departure.destination.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAudioFilePath = (flight: Flight | Departure, callType: string) => {
    const flightNumber = flight.ident;
    const airlineCode = flightNumber.slice(0, 2);
    const destinationCode = flight.destination.code;
    const gateNumber = flight.gate;
    return `/mp3/DEP/${airlineCode}/${flightNumber}/${flightNumber}${destinationCode}DEP_${callType}_Gate${gateNumber}_sr_en.mp3`;
  };

  const hasAnnouncementBeenPlayed = (flightId: string, callType: string): boolean => {
    return playedAnnouncements.some(
      record => record.flightId === flightId && record.callType === callType
    );
  };

  const recordAnnouncementPlayed = (flightId: string, callType: string) => {
    const newRecord = { 
      flightId, 
      callType, 
      playedAt: new Date().toISOString() 
    };
    setPlayedAnnouncements(prev => [...prev, newRecord]);
    console.log(`Recorded announcement: ${flightId} - ${callType}`);
  };

  const playAudio = async (audioPath: string) => {
    try {
      const audio = new Audio(audioPath);
      setIsPlaying(true);
      console.log(`Playing audio: ${audioPath}`);
      
      await audio.play();
      
      return new Promise((resolve) => {
        audio.onended = () => {
          setIsPlaying(false);
          console.log(`Finished playing: ${audioPath}`);
          resolve(null);
        };
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const processAudioQueue = async () => {
    if (audioQueue.current.length === 0 || isPlaying) return;

    const announcement = audioQueue.current[0];
    console.log(`Processing announcement: ${announcement.flight.ident} - ${announcement.callType}`);
    
    if (!hasAnnouncementBeenPlayed(announcement.flight.ident, announcement.callType)) {
      await playAudio(announcement.audioPath);
      recordAnnouncementPlayed(announcement.flight.ident, announcement.callType);
    }
    
    audioQueue.current.shift();
    if (audioQueue.current.length > 0) {
      processAudioQueue();
    }
  };

  const scheduleAnnouncement = (flight: Flight | Departure, callType: string) => {
    const departureTime = new Date(flight.scheduled_out);
    const minutesOffset = ANNOUNCEMENT_SCHEDULE[callType as keyof typeof ANNOUNCEMENT_SCHEDULE];
    const scheduledTime = new Date(departureTime.getTime() + minutesOffset * 60000);
    
    if (scheduledTime > new Date()) {
      const timeUntilAnnouncement = scheduledTime.getTime() - new Date().getTime();
      console.log(`Scheduling ${callType} announcement for ${flight.ident} in ${Math.round(timeUntilAnnouncement / 60000)} minutes`);
      
      const timer = setTimeout(() => {
        if (!hasAnnouncementBeenPlayed(flight.ident, callType)) {
          const audioPath = getAudioFilePath(flight, callType);
          audioQueue.current.push({
            audioPath,
            flight,
            callType,
            scheduledTime: scheduledTime.toISOString()
          });
          processAudioQueue();
        }
      }, timeUntilAnnouncement);

      scheduledTimers.current.push(timer);
    }
  };

  useEffect(() => {
    const scheduleAllAnnouncements = () => {
      scheduledTimers.current.forEach(timer => clearTimeout(timer));
      scheduledTimers.current = [];

      [...flights, ...departures].forEach(flight => {
        Object.keys(ANNOUNCEMENT_SCHEDULE).forEach(callType => {
          if (!hasAnnouncementBeenPlayed(flight.ident, callType)) {
            scheduleAnnouncement(flight, callType);
          }
        });
      });
    };

    scheduleAllAnnouncements();
    return () => scheduledTimers.current.forEach(timer => clearTimeout(timer));
  }, [flights, departures]);

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(() => {
      if (!isPlaying) {
        fetchData();
      }
    }, 60000);
    
    fetchInterval.current = interval;
    return () => clearInterval(interval);
  }, [isPlaying]);
/* 
  const handleManualAnnouncementClick = (flight: Flight | Departure, callType: string) => {
    if (!hasAnnouncementBeenPlayed(flight.ident, callType)) {
      const audioPath = getAudioFilePath(flight, callType);
      audioQueue.current.push({
        audioPath,
        flight,
        callType,
        scheduledTime: new Date().toISOString()
      });
      if (!isPlaying) processAudioQueue();
    }
  }; */

  const handleManualAnnouncementClick = (flight: Flight | Departure, callType: string) => {
    // Check conditions for playing announcements
    const canPlayFirstOrSecondCall = (callType === "1st" || callType === "2nd") && 
    (flight.status === "Check In" || flight.status === "Check-In" || flight.status === "Processing");

    const canPlayBoardingCall = callType === "Boarding" && flight.status === "Boarding";

    if (canPlayFirstOrSecondCall || canPlayBoardingCall) {
        if (!hasAnnouncementBeenPlayed(flight.ident, callType)) {
            const audioPath = getAudioFilePath(flight, callType);
            audioQueue.current.push({
                audioPath,
                flight,
                callType,
                scheduledTime: new Date().toISOString()
            });
            if (!isPlaying) processAudioQueue();
        }
    } else {
        console.log(`Announcement for ${flight.ident} - ${callType} not played due to status: ${flight.status}`);
    }
};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
    {/* Status Bar */}
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center">
      <div>
        <p className="text-gray-700 dark:text-gray-300">
          Last Updated: {lastFetchTimestamp ? new Date(lastFetchTimestamp).toLocaleString() : 'Never'}
        </p>
      
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
      <BaggageAnnouncement isFlightPlaying={isPlaying} />
      </div>
    </div>

      {/* Search Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <Input
          type="text"
          placeholder="Search flights by flight number or airport code..."
          className="pl-10 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading && <p className="text-center text-gray-500 dark:text-gray-400">Loading flight data...</p>}
      {error && <p className="text-center text-red-500 dark:text-red-400">{error}</p>}
      
      {/* Arrivals Section */}
      {!loading && filteredFlights.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Arrivals</h2>
          <div className="grid grid-cols-1 gap-4">
            {filteredFlights.map((flight) => (
              <div key={flight.ident} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-4 space-y-4">
                  {/* Flight Header */}
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{flight.ident}</span>
                    <span className="px-2 py-1 text-sm font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                      {flight.status}
                    </span>
                  </div>
                  
                  {/* Flight Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Departure</div>
                      <div className="font-medium dark:text-gray-200">{new Date(flight.scheduled_out).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Arrival</div>
                      <div className="font-medium dark:text-gray-200">{new Date(flight.scheduled_on).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Origin</div>
                      <div className="font-medium dark:text-gray-200">{flight.origin.code}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Destination</div>
                      <div className="font-medium dark:text-gray-200">{flight.destination.code}</div>
                    </div>
                  </div>
                  
                  {/* LED Status */}
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 dark:text-gray-400">LED:</span>
                    <span className={`font-bold ${ledState[flight.ident] === 1 ? 'text-green-500 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {ledState[flight.ident] === 1 ? 'On' : 'Off'}
                    </span>
                  </div>
                  
                  {/* Announcement Buttons - using shadcn Button component which should already handle dark mode */}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handleManualAnnouncementClick(flight, "1st")} 
                            className="bg-blue-500 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800">1st</Button>
                    <Button onClick={() => handleManualAnnouncementClick(flight, "2nd")} 
                            className="bg-green-500 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-800">2nd</Button>
                    <Button onClick={() => handleManualAnnouncementClick(flight, "Boarding")} 
                            className="bg-yellow-500 text-white hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-800">Boarding</Button>
                    <Button onClick={() => handleManualAnnouncementClick(flight, "LastCall")} 
                            className="bg-red-500 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-800">Last Call</Button>
                  </div>
                  
                  {/* Schedule */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Object.keys(ANNOUNCEMENT_SCHEDULE).map(callType => {
                      const minutesOffset = ANNOUNCEMENT_SCHEDULE[callType as keyof typeof ANNOUNCEMENT_SCHEDULE];
                      const scheduledTime = new Date(new Date(flight.scheduled_out).getTime() + minutesOffset * 60000);
                      const hasBeenPlayed = hasAnnouncementBeenPlayed(flight.ident, callType);

                      return (
                        <div key={callType} className="flex items-center space-x-2">
                          <span className="text-gray-500 dark:text-gray-400">{callType}:</span>
                          <span className={`${hasBeenPlayed ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                            {scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {hasBeenPlayed && ' ✔️'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Departures Section */}
      {!loading && filteredDepartures.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Departures</h2>
          <div className="grid grid-cols-1 gap-4">
            {filteredDepartures.map((departure) => (
              <div key={departure.ident} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-4 space-y-4">
                  {/* Flight Header */}
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-yellow-300">{departure.ident}</span>
                    <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                      departure.status === 'Delayed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                      departure.status === 'Boarding' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                      departure.status === 'Departed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                      departure.status === 'Check In' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                    }`}>
                      {departure.status}
                    </span>
                  </div>
                  
                  {/* Flight Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Scheduled</div>
                      <div className="font-medium dark:text-gray-200">{new Date(departure.scheduled_out).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Actual</div>
                      <div className="font-medium dark:text-gray-200">{departure.actual_out ? new Date(departure.actual_out).toLocaleString() : '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Origin</div>
                      <div className="font-medium text-yellow-500 dark:text-yellow-400">{departure.origin.code}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Destination</div>
                      <div className="font-medium text-red-100 dark:text-red-200">{departure.destination.code}</div>
                    </div>
                  </div>
                  
                  {/* LED Status */}
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 dark:text-gray-400">LED:</span>
                    <span className={`font-bold ${ledState[departure.ident] === 1 ? 'text-green-500 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {ledState[departure.ident] === 1 ? 'On' : 'Off'}
                    </span>
                  </div>
                  
                  {/* Announcement Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handleManualAnnouncementClick(departure, "1st")} 
                            className="bg-blue-500 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800" size="sm">1st</Button>
                    <Button onClick={() => handleManualAnnouncementClick(departure, "2nd")} 
                            className="bg-green-500 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-800" size="sm">2nd</Button>
                    <Button onClick={() => handleManualAnnouncementClick(departure, "Boarding")} 
                            className="bg-yellow-500 text-white hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-800" size="sm">Boarding</Button>
                    <Button onClick={() => handleManualAnnouncementClick(departure, "LastCall")} 
                            className="bg-red-500 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-800" size="sm">Last Call</Button>
                  </div>
                  
                  {/* Schedule */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Object.keys(ANNOUNCEMENT_SCHEDULE).map(callType => {
                      const minutesOffset = ANNOUNCEMENT_SCHEDULE[callType as keyof typeof ANNOUNCEMENT_SCHEDULE];
                      const scheduledTime = new Date(new Date(departure.scheduled_out).getTime() + minutesOffset * 60000);
                      const hasBeenPlayed = hasAnnouncementBeenPlayed(departure.ident, callType);

                      return (
                        <div key={callType} className="flex items-center space-x-2">
                          <span className="text-gray-500 dark:text-gray-400">{callType}:</span>
                          <span className={`${hasBeenPlayed ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                            {scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {hasBeenPlayed && ' ✔️'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && filteredFlights.length === 0 && filteredDepartures.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No flights found matching your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default FlightInfo;