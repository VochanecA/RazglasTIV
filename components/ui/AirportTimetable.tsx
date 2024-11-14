'use client';

import React, { useEffect, useRef } from 'react';

interface AudioQueueItem {
  audioPath: string;
  priority: number;
}

interface Flight {
  ident: string;
  status: string;
  scheduled_out: string;
  actual_out: string | null;
  origin: { code: string };
  destination: { code: string };
  Kompanija: string;
  KompanijaICAO: string;
  KompanijaNaziv: string;
  checkIn?: string;
  gate?: string;
}

const usePASystem = () => {
  const audioQueue = useRef<AudioQueueItem[]>([]);
  const isPlaying = useRef(false);
  const audioElement = useRef<HTMLAudioElement | null>(null);

  const playNextInQueue = () => {
    if (audioQueue.current.length === 0 || isPlaying.current) return;

    isPlaying.current = true;
    const item = audioQueue.current.shift();
    if (!item) return;

    if (!audioElement.current) {
      audioElement.current = new Audio();
    }

    audioElement.current.src = item.audioPath;
    audioElement.current.play()
      .then(() => {
        audioElement.current!.onended = () => {
          isPlaying.current = false;
          playNextInQueue();
        };
      })
      .catch((error) => {
        console.error('Error playing audio:', error);
        isPlaying.current = false;
        playNextInQueue();
      });
  };

  const addToQueue = (audioPath: string, priority: number = 1) => {
    audioQueue.current.push({ audioPath, priority });
    audioQueue.current.sort((a, b) => b.priority - a.priority);
    
    if (!isPlaying.current) {
      playNextInQueue();
    }
  };

  const generateAnnouncementPath = (flight: Flight, callType: '1st' | '2nd' | 'Boarding' | 'LastCall') => {
    // Extract flight number and airline code from ident
    const flightNumber = flight.ident.replace(/[^0-9]/g, '');
    const airlineCode = flight.Kompanija;
    
    return `/mp3/DEP/${airlineCode}/${flightNumber}/${flightNumber}${flight.destination.code}DEP_${callType}_Gate${flight.gate}_sr_en.mp3`;
  };

  const scheduleAnnouncements = (flight: Flight) => {
    if (flight.status === 'Processing') {
      // First boarding call
      addToQueue(generateAnnouncementPath(flight, '1st'), 1);
      
      // Schedule second call after 5 minutes
      setTimeout(() => {
        if (flight.status === 'Processing') {
          addToQueue(generateAnnouncementPath(flight, '2nd'), 2);
        }
      }, 5 * 60 * 1000);
    }
    
    if (flight.status === 'Boarding') {
      addToQueue(generateAnnouncementPath(flight, 'Boarding'), 3);
    }
    
    if (flight.status === 'Last Call') {
      addToQueue(generateAnnouncementPath(flight, 'LastCall'), 4);
    }
  };

  const scheduleArrivalAnnouncement = (flight: Flight) => {
    if (flight.status === 'Arrived') {
      const flightNumber = flight.ident.replace(/[^0-9]/g, '');
      const airlineCode = flight.Kompanija;
      const audioPath = `/mp3/ARR/${airlineCode}/${flightNumber}/${flightNumber}${flight.origin.code}ARR_sr_en.mp3`;
      addToQueue(audioPath, 5);
    }
  };

  return {
    scheduleAnnouncements,
    scheduleArrivalAnnouncement
  };
};

const AirportTimetable = ({ departures, arrivals }: { departures: Flight[], arrivals: Flight[] }) => {
  const { scheduleAnnouncements, scheduleArrivalAnnouncement } = usePASystem();

  useEffect(() => {
    // Process departures
    departures.forEach(flight => {
      scheduleAnnouncements(flight);
    });

    // Process arrivals
    arrivals.forEach(flight => {
      scheduleArrivalAnnouncement(flight);
    });
  }, [departures, arrivals]);

  return <audio className="hidden" />;
};

export default AirportTimetable;