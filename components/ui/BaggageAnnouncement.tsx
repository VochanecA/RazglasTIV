"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';

interface BaggageAnnouncementProps {
  isFlightPlaying: boolean;
}


const BaggageAnnouncement: React.FC<BaggageAnnouncementProps> = ({ isFlightPlaying }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
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
        setAudioError(null);
        console.log('[Baggage] Starting baggage announcement...');

        if (!audioRef.current) {
          console.log('[Baggage] Creating new audio instance');
          // Use absolute path from public directory
          const audio = new Audio();
          audio.src = '/mp3/baggage.mp3';
          audio.preload = 'auto';
          
          audio.onerror = (e) => {
            console.error('[Baggage] Error loading baggage announcement audio:', e);
            setAudioError('Failed to load audio file');
            setIsPlaying(false);
          };

          audio.oncanplaythrough = () => {
            console.log('[Baggage] Audio loaded and ready to play');
          };

          audioRef.current = audio;
        }

        const currentTime = new Date().toLocaleTimeString();
        setLastPlayed(currentTime);
        console.log(`[Baggage] Playing announcement at ${currentTime}`);
        
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('[Baggage] Playback error:', error);
            setAudioError('Failed to play audio');
            setIsPlaying(false);
          });
        }
        
        audioRef.current.onended = () => {
          console.log('[Baggage] Announcement finished playing');
          setIsPlaying(false);
        };
      } catch (error) {
        console.error('[Baggage] Error playing baggage announcement:', error);
        setAudioError('An error occurred while playing the announcement');
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
    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-4">
      <div>
        <p>Baggage Announcements:</p>
        <p>Oct-Mar: 07:00-16:30</p>
        <p>Apr-Sep: 06:00-20:00</p>
        {lastPlayed && (
          <p className="mt-1">Last played: {lastPlayed}</p>
        )}
        {audioError && (
          <p className="mt-1 text-red-500">{audioError}</p>
        )}
      </div>
      {isPlaying && (
        <div className="relative flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="ml-2">Playing announcement</span>
        </div>
      )}
    </div>
  );
};

export default BaggageAnnouncement;