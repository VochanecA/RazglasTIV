"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';

interface BaggageAnnouncementProps {
  isFlightPlaying: boolean;
}

const BaggageAnnouncement: React.FC<BaggageAnnouncementProps> = ({ isFlightPlaying }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isWinterSeason = useCallback(() => {
    const today = new Date();
    const month = today.getMonth();
    const lastDayOctober = new Date(today.getFullYear(), 9, 31);
    const lastDayMarch = new Date(today.getFullYear(), 2, 31);
    
    return (month >= 9 && today <= lastDayOctober) || (month <= 2 && today <= lastDayMarch);
  }, []);

  const isWithinOperatingHours = useCallback(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours + minutes / 60;

    const season = isWinterSeason() ? 'Winter' : 'Summer';
    const operatingHours = isWinterSeason() ? '07:00-16:30' : '06:00-20:00';
    console.log(`[Baggage] Current season: ${season}, Operating hours: ${operatingHours}`);
    console.log(`[Baggage] Current time: ${hours}:${minutes.toString().padStart(2, '0')}`);

    if (isWinterSeason()) {
      const isWithinHours = currentTime >= 7 && currentTime <= 16.5;
      console.log(`[Baggage] Winter schedule - Within operating hours: ${isWithinHours}`);
      return isWithinHours;
    } else {
      const isWithinHours = currentTime >= 6 && currentTime <= 20;
      console.log(`[Baggage] Summer schedule - Within operating hours: ${isWithinHours}`);
      return isWithinHours;
    }
  }, [isWinterSeason]);

  const playBaggageAnnouncement = async () => {
    console.log('[Baggage] Attempting to play baggage announcement...');
    console.log(`[Baggage] Current state - isPlaying: ${isPlaying}, isFlightPlaying: ${isFlightPlaying}`);

    if (!isPlaying && !isFlightPlaying && isWithinOperatingHours()) {
      try {
        setIsPlaying(true);
        console.log('[Baggage] Starting baggage announcement...');

        if (!audioRef.current) {
          console.log('[Baggage] Creating new audio instance');
          audioRef.current = new Audio('/mp3/baggage.mp3');
          audioRef.current.onerror = () => {
            console.error('[Baggage] Error loading baggage announcement audio');
            setIsPlaying(false);
          };
        }

        const currentTime = new Date().toLocaleTimeString();
        console.log(`[Baggage] Playing announcement at ${currentTime}`);
        
        await audioRef.current.play();
        
        audioRef.current.onended = () => {
          console.log('[Baggage] Announcement finished playing');
          setIsPlaying(false);
        };
      } catch (error) {
        console.error('[Baggage] Error playing baggage announcement:', error);
        setIsPlaying(false);
      }
    } else {
      console.log('[Baggage] Skipping announcement - Conditions not met:', {
        isCurrentlyPlaying: isPlaying,
        isFlightAnnouncementPlaying: isFlightPlaying,
        isWithinHours: isWithinOperatingHours()
      });
    }
  };

  useEffect(() => {
    const checkAndPlay = () => {
      const now = new Date();
      const minutes = now.getMinutes();
      console.log(`[Baggage] Checking schedule at ${now.toLocaleTimeString()}`);
      
      if (minutes % 30 === 0) {
        console.log('[Baggage] 30-minute mark reached, attempting to play announcement');
        playBaggageAnnouncement();
      } else {
        console.log(`[Baggage] Not yet time for announcement. Minutes: ${minutes}`);
      }
    };

    console.log('[Baggage] Setting up announcement schedule');
    checkAndPlay();
    const interval = setInterval(checkAndPlay, 60000);

    return () => {
      console.log('[Baggage] Cleaning up announcement schedule');
      clearInterval(interval);
      if (audioRef.current) {
        console.log('[Baggage] Stopping any playing announcement');
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isFlightPlaying]);

  return (
    <div className="text-sm text-gray-500 dark:text-gray-400">
      <p>Baggage Announcements:</p>
      <p>Oct-Mar: 07:00-16:30</p>
      <p>Apr-Sep: 06:00-20:00</p>
    </div>
  );
};

export default BaggageAnnouncement;