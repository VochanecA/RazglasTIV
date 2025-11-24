'use client';

interface FlightMP3Info {
  type: 'ARR' | 'DEP' | 'I' | 'O' | 'General';
  airline: string;
  flightNumber: string;
  announcement: string;
  originCODE: string;
}

interface CancelledFlightInfo {
  text: string;
  flightInfo?: FlightMP3Info;
  startTime: Date;
  endTime: Date;
}

// Global variables
let backgroundAudio: HTMLAudioElement | null = null;
let gongAudio: HTMLAudioElement | null = null;
let musicControlInterval: NodeJS.Timeout | null = null;
let cancelledFlightInterval: NodeJS.Timeout | null = null;
let dailyMusicInterval: NodeJS.Timeout | null = null;

// Queue management
let isProcessingQueue = false;
let announcementQueue: Array<{ text: string; flightInfo?: FlightMP3Info }> = [];
let cancelledFlights: CancelledFlightInfo[] = [];

// Flight status tracking
let hasActiveFlightsToday = false;
let lastFlightCheckTime: Date | null = null;

// Kiosk mode tracking
let isKioskMode = false;
let audioContextUnlocked = false;

// Debug function to check audio status
export const debugAudioStatus = (): void => {
  console.log('=== AUDIO DEBUG INFO ===');
  console.log('Background audio instance:', backgroundAudio);
  console.log('Is background audio playing:', isBackgroundMusicPlaying());
  console.log('Has active flights today:', hasActiveFlightsToday);
  console.log('Should play background music:', shouldPlayBackgroundMusic());
  console.log('Current time:', new Date().toLocaleTimeString());
  console.log('Current hour:', new Date().getHours());
  console.log('Is after start time (7:00):', isAfterStartTime());
  console.log('Is before end time (21:00):', isBeforeEndTime());
  console.log('Last flight check time:', lastFlightCheckTime);
  console.log('Audio context unlocked:', audioContextUnlocked);
  console.log('Kiosk mode:', isKioskMode);
  console.log('========================');
};

// Helper function to check if MP3 file exists
const checkMP3Exists = async (path: string): Promise<boolean> => {
  try {
    console.log('Checking MP3 existence:', path);
    const response = await fetch(path, { method: 'HEAD' });
    const exists = response.ok;
    console.log('MP3 exists:', exists);
    return exists;
  } catch (error) {
    console.error('Error checking MP3 existence:', error);
    return false;
  }
};

// Helper function to get MP3 path for a flight announcement
const getMP3Path = (flightInfo: FlightMP3Info): string => {
  const { type, airline, flightNumber, announcement, originCODE } = flightInfo;
  console.log('Flight info:', flightInfo);

  // For arrival flights
  if (type === 'ARR') {
    const path = `/sounds/ARR/${airline}/${flightNumber}/${airline}${flightNumber}${originCODE}ARR_sr_en.mp3`;
    console.log('Generated MP3 path for arrival flight:', path);
    return path;
  }

  // For departure flights with multiple gates
  if (announcement.includes('Gate') && announcement.includes(',')) {
    const gatePart = announcement.split('Gate')[1];
    if (gatePart) {
      const individualGates = gatePart.split(',');

      const paths = individualGates.map(gate => {
        const baseAnnouncement = announcement.split('Gate')[0];
        return `/sounds/DEP/${airline}/${flightNumber}/${originCODE}${type}_${baseAnnouncement}Gate${gate.trim()}_sr_en.mp3`;
      }).join('|');

      console.log('Generated MP3 paths for multiple gates:', paths);
      return paths;
    }
  }

  // For single gate departures or other announcements
  const path = `/sounds/${type}/${airline}/${flightNumber}/${originCODE}${type}_${announcement}_sr_en.mp3`;
  console.log('Generated MP3 path:', path);
  return path;
};

// Pre-load the gong sound to eliminate delay
const preloadGongSound = (): void => {
  if (typeof window !== 'undefined' && !gongAudio) {
    gongAudio = new Audio('/mp3/Gong_pojacan.mp3');
    gongAudio.load();
    gongAudio.onerror = (error) => {
      console.error('Failed to preload gong sound:', error);
    };
  }
};

if (typeof window !== 'undefined') {
  preloadGongSound();
}

// Function to check if current time is before 21:00
const isBeforeEndTime = (): boolean => {
  const now = new Date();
  const endTime = new Date();
  endTime.setHours(21, 0, 0, 0);
  return now < endTime;
};

// Function to check if current time is after 07:00
const isAfterStartTime = (): boolean => {
  const now = new Date();
  const startTime = new Date();
  startTime.setHours(7, 0, 0, 0);
  return now >= startTime;
};

// Function to check if we should play background music based on time and flight status
const shouldPlayBackgroundMusic = (): boolean => {
  const now = new Date();
  const currentHour = now.getHours();
  
  console.log(`Background music check - Hour: ${currentHour}, Has flights: ${hasActiveFlightsToday}`);
  
  if (currentHour < 6 || (currentHour === 6 && now.getMinutes() < 30) || currentHour >= 21) {
    console.log('Background music: Outside allowed hours (6:30-21:00)');
    return false;
  }
  
  if (!hasActiveFlightsToday) {
    console.log('Background music: No active flights today');
    return false;
  }
  
  console.log('Background music: Conditions met - should play');
  return true;
};

// Function to update flight status
export const updateFlightStatus = (hasFlights: boolean): void => {
  hasActiveFlightsToday = hasFlights;
  lastFlightCheckTime = new Date();
  
  console.log(`Flight status updated: ${hasFlights ? 'Active flights today' : 'No active flights today'}`);
  
  manageBackgroundMusicBasedOnFlights();
};

// Function to auto-manage background music based on flight status
const manageBackgroundMusicBasedOnFlights = (): void => {
  if (!backgroundAudio) return;
  
  const shouldPlay = shouldPlayBackgroundMusic();
  const isPlaying = !backgroundAudio.paused;
  
  if (shouldPlay && !isPlaying) {
    console.log('Auto-starting background music (active flights + correct time)');
    playBackgroundMusic();
  } else if (!shouldPlay && isPlaying) {
    console.log('Auto-stopping background music (no active flights or outside hours)');
    stopBackgroundMusic();
  }
};

// Function to check if we should play gong (only if there are active flights)
const shouldPlayGong = (): boolean => {
  return hasActiveFlightsToday;
};

// Function to play cancelled flight announcements
const playCancelledFlightAnnouncements = async (): Promise<void> => {
  if (!isBeforeEndTime() || !hasActiveFlightsToday) {
    console.log('Past 21:00 or no active flights, stopping cancelled flight announcements');
    stopCancelledFlightAnnouncements();
    return;
  }

  const currentTime = new Date();
  const activeCancelledFlights = cancelledFlights.filter(flight =>
    currentTime >= flight.startTime && currentTime < flight.endTime
  );

  if (activeCancelledFlights.length === 0) {
    console.log('No active cancelled flights to announce');
    return;
  }

  console.log(`Playing ${activeCancelledFlights.length} cancelled flight announcements`);

  const cancelledAnnouncements = activeCancelledFlights.map(flight => ({
    text: flight.text,
    flightInfo: flight.flightInfo
  }));

  await addAnnouncements(cancelledAnnouncements);
};

// Function to start cancelled flight announcement schedule
const startCancelledFlightAnnouncements = (): void => {
  if (cancelledFlightInterval) {
    clearInterval(cancelledFlightInterval);
  }

  if (cancelledFlights.length > 0 && isBeforeEndTime() && hasActiveFlightsToday) {
    void playCancelledFlightAnnouncements();
  }

  cancelledFlightInterval = setInterval(() => {
    void playCancelledFlightAnnouncements();
  }, 30 * 60 * 1000);

  console.log('Started cancelled flight announcements (every 30 minutes until 21:00)');
};

// Function to stop cancelled flight announcement schedule
const stopCancelledFlightAnnouncements = (): void => {
  if (cancelledFlightInterval) {
    clearInterval(cancelledFlightInterval);
    cancelledFlightInterval = null;
    console.log('Stopped cancelled flight announcements');
  }
};

// Function to add a cancelled flight
export const addCancelledFlight = (text: string, flightInfo?: FlightMP3Info): void => {
  const now = new Date();
  const endTime = new Date();
  endTime.setHours(21, 0, 0, 0);

  if (now > endTime) {
    endTime.setDate(endTime.getDate() + 1);
  }

  const cancelledFlight: CancelledFlightInfo = {
    text,
    flightInfo,
    startTime: now,
    endTime
  };

  cancelledFlights.push(cancelledFlight);
  console.log('Added cancelled flight:', text);

  if (!cancelledFlightInterval && hasActiveFlightsToday) {
    startCancelledFlightAnnouncements();
  }
};

// Function to remove a cancelled flight
export const removeCancelledFlight = (text: string): void => {
  const initialLength = cancelledFlights.length;
  cancelledFlights = cancelledFlights.filter(flight => flight.text !== text);

  if (cancelledFlights.length < initialLength) {
    console.log('Removed cancelled flight:', text);
  }

  if (cancelledFlights.length === 0) {
    stopCancelledFlightAnnouncements();
  }
};

// Function to get all cancelled flights
export const getCancelledFlights = (): CancelledFlightInfo[] => {
  return [...cancelledFlights];
};

// Function to clear all cancelled flights
export const clearCancelledFlights = (): void => {
  cancelledFlights = [];
  stopCancelledFlightAnnouncements();
  console.log('Cleared all cancelled flights');
};

// Play pre-recorded MP3 announcement
const playMP3Announcement = async (mp3Path: string): Promise<void> => {
  const paths = mp3Path.split('|');

  for (const path of paths) {
    await new Promise<void>((resolve, reject) => {
      console.log('Starting MP3 playback:', path);
      if (typeof window === 'undefined') {
        console.error('Audio object not available, cannot play MP3.');
        reject(new Error('Audio object not available'));
        return;
      }
      const audio = new Audio(path);

      audio.load();

      const cleanup = (): void => {
        audio.onloadeddata = null;
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
        audio.src = '';
      };

      audio.onloadeddata = () => {
        console.log('MP3 loaded successfully');
      };

      audio.onended = () => {
        console.log('MP3 playback completed');
        cleanup();
        resolve();
      };

      audio.onerror = (error) => {
        console.error('MP3 playback error:', error);
        cleanup();
        reject(error);
      };

      const timeoutId = setTimeout(() => {
        console.error('MP3 playback timeout');
        cleanup();
        reject(new Error('MP3 playback timeout'));
      }, 30000);

      audio.onended = () => {
        clearTimeout(timeoutId);
        console.log('MP3 playback completed');
        cleanup();
        resolve();
      };

      audio.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error('MP3 playback error:', error);
        cleanup();
        reject(error);
      };

      audio.play().catch((error) => {
        clearTimeout(timeoutId);
        console.error('MP3 play() error:', error);
        cleanup();
        reject(error);
      });
    });
  }
};

const playTTSAnnouncementWithoutGong = async (text: string): Promise<void> => {
  return new Promise<void>((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech synthesis not supported or not in browser environment');
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;

    const timeoutId = setTimeout(() => {
      console.warn('TTS timeout, resolving anyway');
      resolve();
    }, 30000);

    utterance.onend = () => {
      clearTimeout(timeoutId);
      resolve();
    };

    utterance.onerror = () => {
      clearTimeout(timeoutId);
      console.log('Speech synthesis completed with issues');
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
};

// Function that combines playing gong and TTS without delay
const playGongAndTTS = async (text: string): Promise<void> => {
  if (typeof window === 'undefined') {
    console.error('Not in browser environment, cannot play gong and TTS.');
    return Promise.resolve();
  }

  if (!shouldPlayGong()) {
    console.log('No active flights today, skipping gong and playing TTS only');
    return playTTSAnnouncementWithoutGong(text);
  }

  if (backgroundAudio) {
    backgroundAudio.pause();
    console.log('Background music paused for TTS.');
  }

  if (!gongAudio) {
    preloadGongSound();
  }

  if (!gongAudio) {
    console.error('Gong audio not initialized.');
    return playTTSAnnouncementWithoutGong(text);
  }

  return new Promise<void>((resolve) => {
    gongAudio!.currentTime = 0;

    const timeoutId = setTimeout(() => {
      console.warn('Gong and TTS timeout, resolving anyway');
      resolve();
    }, 35000);

    gongAudio!.onended = async () => {
      try {
        await playTTSAnnouncementWithoutGong(text);
      } catch (error) {
        console.error('Error playing TTS after gong:', error);
      } finally {
        clearTimeout(timeoutId);
        resolve();
      }
    };

    gongAudio!.onerror = () => {
      console.error('Gong playback error');
      clearTimeout(timeoutId);
      void playTTSAnnouncementWithoutGong(text).then(resolve);
    };

    gongAudio!.play().catch(error => {
      console.error('Failed to play gong sound:', error);
      clearTimeout(timeoutId);
      void playTTSAnnouncementWithoutGong(text).then(resolve);
    });
  });
};

// Function that combines playing gong and MP3 without delay
const playGongAndMP3 = async (mp3Path: string): Promise<void> => {
  if (typeof window === 'undefined') {
    console.error('Not in browser environment, cannot play gong and MP3.');
    return Promise.resolve();
  }

  if (!shouldPlayGong()) {
    console.log('No active flights today, skipping gong and playing MP3 only');
    return playMP3Announcement(mp3Path);
  }

  if (backgroundAudio) {
    backgroundAudio.pause();
    console.log('Background music paused for MP3.');
  }

  if (!gongAudio) {
    preloadGongSound();
  }

  if (!gongAudio) {
    console.error('Gong audio not initialized.');
    return playMP3Announcement(mp3Path);
  }

  return new Promise<void>((resolve) => {
    gongAudio!.currentTime = 0;

    const timeoutId = setTimeout(() => {
      console.warn('Gong and MP3 timeout, resolving anyway');
      resolve();
    }, 35000);

    gongAudio!.onended = async () => {
      try {
        await playMP3Announcement(mp3Path);
      } catch (error) {
        console.error('Error playing MP3 after gong:', error);
      } finally {
        clearTimeout(timeoutId);
        resolve();
      }
    };

    gongAudio!.onerror = () => {
      console.error('Gong playback error');
      clearTimeout(timeoutId);
      void playMP3Announcement(mp3Path).then(resolve);
    };

    gongAudio!.play().catch(error => {
      console.error('Failed to play gong sound:', error);
      clearTimeout(timeoutId);
      void playMP3Announcement(mp3Path).then(resolve);
    });
  });
};

const processAnnouncementQueue = async (): Promise<void> => {
  if (isProcessingQueue || announcementQueue.length === 0) return;

  isProcessingQueue = true;

  try {
    await fadeOutBackgroundMusic();

    while (announcementQueue.length > 0) {
      try {
        const announcement = announcementQueue[0];

        if (announcement.flightInfo) {
          const mp3Path = getMP3Path(announcement.flightInfo);
          console.log('Processing announcement with path:', mp3Path);

          try {
            const paths = mp3Path.split('|');
            let mp3Exists = false;

            for (const path of paths) {
              if (await checkMP3Exists(path)) {
                mp3Exists = true;
                break;
              }
            }

            if (mp3Exists) {
              console.log('MP3 file found, attempting playback');
              await playGongAndMP3(mp3Path);
              console.log('MP3 playback successful');
            } else {
              console.log('MP3 file not found, falling back to TTS');
              await playGongAndTTS(announcement.text);
            }
          } catch (error) {
            console.error('Error during MP3 handling:', error);
            await playGongAndTTS(announcement.text);
          }
        } else {
          await playGongAndTTS(announcement.text);
        }

        announcementQueue.shift();

        if (announcementQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error('Error processing single announcement:', error);
        if (announcementQueue.length > 0) {
          announcementQueue.shift();
        }
      }
    }

    await fadeInBackgroundMusic();
  } catch (error) {
    console.error('Error in queue processing:', error);
  } finally {
    isProcessingQueue = false;

    if (announcementQueue.length > 0) {
      setTimeout(processAnnouncementQueue, 1000);
    }
  }
};

export const addAnnouncement = async (text: string, flightInfo?: FlightMP3Info): Promise<void> => {
  if (!hasActiveFlightsToday) {
    console.log('No active flights today, skipping announcement:', text);
    return;
  }
  
  announcementQueue.push({ text, flightInfo });
  void processAnnouncementQueue();
};

export const addAnnouncements = async (announcements: Array<{ text: string; flightInfo?: FlightMP3Info }>): Promise<void> => {
  const filteredAnnouncements = hasActiveFlightsToday 
    ? announcements 
    : [];
  
  if (filteredAnnouncements.length === 0) {
    console.log('No active flights today, skipping all announcements');
    return;
  }
  
  announcementQueue.push(...filteredAnnouncements);
  void processAnnouncementQueue();
};

// Export to get the current announcement queue
export const getAnnouncementQueue = (): Array<{ text: string; flightInfo?: FlightMP3Info }> => {
  return [...announcementQueue];
};

// Export to check if the announcement queue is empty
export const isAnnouncementQueueEmpty = (): boolean => {
  return announcementQueue.length === 0;
};

// Function to start daily music schedule
const startDailyMusicSchedule = (): void => {
  if (dailyMusicInterval) {
    clearInterval(dailyMusicInterval);
  }

  dailyMusicInterval = setInterval(() => {
    manageBackgroundMusicBasedOnFlights();
  }, 60 * 1000);

  console.log('Started daily music schedule');
};

// KIOSK MODE FUNCTIONS

// Function to unlock audio context for kiosk mode
const unlockAudioContextForKiosk = async (): Promise<boolean> => {
  if (audioContextUnlocked) return true;

  try {
    // Strategy 1: Create and play silent audio
    const silentAudio = new Audio();
    silentAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgYZrXp8sVvIAUfZqzh57trFgUZX6fb5rVlEAUYWqTZ5bNjDgUXVqHX5LBhDAUWVZ/Y465fCgUVVJ7X4q1dCAUUU53W4axbCAUTUpzW4KtaCAUSUZvV36pZCAURUJrU3qlYCAUQUJnT3ahXCAUPUJjS3KdWCAUOUJfR26ZVCAUNUJbQ2qVUCAUMUJXP2aRTCAULUJTO2KNSCAUKUJPN16JRCAUJUJLM1qFQCAUIUJHL1aBPCAAFAgEEAAIBAQIB';
    silentAudio.volume = 0.001;
    
    await silentAudio.play();
    await new Promise(resolve => setTimeout(resolve, 100));
    silentAudio.pause();
    silentAudio.remove();
    
    audioContextUnlocked = true;
    console.log('Kiosk audio context unlocked successfully');
    return true;
  } catch (error) {
    console.log('Kiosk audio context unlock failed:', error);
    return false;
  }
};

// Enhanced kiosk audio setup
export const setupBackgroundMusicForKiosk = async (): Promise<boolean> => {
  if (typeof window === 'undefined') {
    console.log('Cannot setup kiosk audio: not in browser environment');
    return false;
  }

  if (window.location.pathname !== '/timetable') {
    console.log('Not on timetable page, skipping kiosk audio setup');
    return false;
  }

  if (backgroundAudio) {
    console.log('Background audio already setup');
    return true;
  }

  try {
    console.log('Setting up kiosk audio...');
    isKioskMode = true;
    
    const streamUrl = process.env.NEXT_PUBLIC_STREAM_URL || 'https://jking.cdnstream1.com/b22139_128mp3';
    console.log('Kiosk stream URL:', streamUrl);
    
    backgroundAudio = new Audio(streamUrl);
    backgroundAudio.loop = true;
    backgroundAudio.volume = 0.2;
    backgroundAudio.preload = 'auto';

    // Try to unlock audio context
    await unlockAudioContextForKiosk();

    // Start daily music schedule
    startDailyMusicSchedule();

    // Setup interval to check if we're still on timetable page
    musicControlInterval = setInterval(() => {
      if (window.location.pathname !== '/timetable' && backgroundAudio) {
        stopBackgroundMusic();
      }
    }, 1000);

    // Preload gong sound
    preloadGongSound();

    // Initialize the audio manager interface
    initializeAudioManagerInterface();

    console.log('Kiosk audio setup completed');
    return true;

  } catch (error) {
    console.log('Kiosk audio setup failed:', error);
    return false;
  }
};

// Enhanced kiosk play function with multiple strategies
export const playBackgroundMusicForKiosk = async (): Promise<boolean> => {
  if (!backgroundAudio) {
    console.log('No background audio, setting up kiosk audio first');
    return await setupBackgroundMusicForKiosk();
  }

  if (!backgroundAudio.paused) {
    console.log('Background music already playing');
    return true;
  }

  if (!shouldPlayBackgroundMusic()) {
    console.log('Background music conditions not met (time or flight status)');
    return false;
  }

  try {
    // Strategy 1: Direct play
    console.log('Kiosk: Attempting to play background music directly...');
    const playPromise = backgroundAudio.play();
    
    if (playPromise !== undefined) {
      await playPromise;
      console.log('Kiosk background music started successfully');
      return true;
    } else {
      // Fallback for older browsers
      backgroundAudio.play();
      console.log('Kiosk background music started (fallback)');
      return true;
    }
  } catch (error) {
    console.log('Kiosk direct play failed, trying silent unlock...');
    
    // Strategy 2: Try silent unlock and retry
    try {
      await unlockAudioContextForKiosk();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const retryPromise = backgroundAudio.play();
      if (retryPromise !== undefined) {
        await retryPromise;
        console.log('Kiosk background music started after unlock');
        return true;
      } else {
        backgroundAudio.play();
        console.log('Kiosk background music started after unlock (fallback)');
        return true;
      }
    } catch (retryError) {
      console.log('Kiosk audio start failed completely:', retryError);
      return false;
    }
  }
};

// Function to automatically start kiosk audio with progressive retry
export const startKioskAudioWithRetry = async (maxRetries = 3): Promise<boolean> => {
  console.log(`Starting kiosk audio with ${maxRetries} retries...`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Kiosk audio attempt ${attempt}/${maxRetries}`);
    
    try {
      // Increase delay between retries
      if (attempt > 1) {
        const delay = attempt * 1000; // 1s, 2s, 3s...
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const success = await playBackgroundMusicForKiosk();
      
      if (success) {
        console.log(`Kiosk audio started successfully on attempt ${attempt}`);
        return true;
      }
      
    } catch (error) {
      console.log(`Kiosk audio attempt ${attempt} failed:`, error);
    }
  }
  
  console.log(`All ${maxRetries} kiosk audio attempts failed`);
  return false;
};

// Auto-start kiosk audio when conditions are met
export const autoStartKioskAudio = async (): Promise<void> => {
  if (!shouldPlayBackgroundMusic()) {
    console.log('Auto-start: Conditions not met for background music');
    return;
  }

  console.log('Auto-start: Attempting to start kiosk audio...');
  
  // Setup first
  const setupSuccess = await setupBackgroundMusicForKiosk();
  if (!setupSuccess) {
    console.log('Auto-start: Setup failed');
    return;
  }

  // Then try to play with retry
  const playSuccess = await startKioskAudioWithRetry(3);
  
  if (playSuccess) {
    console.log('Auto-start: Kiosk audio started successfully');
  } else {
    console.log('Auto-start: Kiosk audio failed to start automatically');
  }
};

// Modified setupBackgroundMusic for kiosk mode
export const setupBackgroundMusic = async (): Promise<boolean> => {
  // For kiosk mode, use the kiosk setup
  return await setupBackgroundMusicForKiosk();
};

// Modified playBackgroundMusic for kiosk mode
export const playBackgroundMusic = async (): Promise<boolean> => {
  return await playBackgroundMusicForKiosk();
};

// Add this function to your audioManager.ts file
export const pauseBackgroundMusic = (): void => {
  if (backgroundAudio && !backgroundAudio.paused) {
    backgroundAudio.pause();
    console.log('Background music paused');
  }
};

// Optional: Add toggle function for easier control
export const toggleBackgroundMusic = async (): Promise<boolean> => {
  if (!backgroundAudio) return false;
  
  if (backgroundAudio.paused) {
    return await playBackgroundMusic();
  } else {
    pauseBackgroundMusic();
    return true;
  }
};

export const fadeOutBackgroundMusic = (): Promise<void> => {
  if (!backgroundAudio) return Promise.resolve();

  return new Promise<void>((resolve) => {
    if (backgroundAudio === null) {
      console.warn('backgroundAudio is null inside fadeOutBackgroundMusic promise.');
      resolve();
      return;
    }

    if (backgroundAudio.paused) {
      resolve();
      return;
    }

    const initialVolume = backgroundAudio.volume;

    const fadeOutInterval = setInterval(() => {
      if (backgroundAudio === null) {
        clearInterval(fadeOutInterval);
        console.warn('backgroundAudio became null during fadeOutInterval.');
        resolve();
        return;
      }

      if (backgroundAudio.volume > 0.01) {
        backgroundAudio.volume = Math.max(0, backgroundAudio.volume - 0.05);
      } else {
        clearInterval(fadeOutInterval);
        backgroundAudio.pause();
        backgroundAudio.volume = initialVolume;
        resolve();
      }
    }, 50);
  });
};

export const stopBackgroundMusic = (): void => {
  if (backgroundAudio) {
    backgroundAudio.pause();
    backgroundAudio.currentTime = 0;
    backgroundAudio.volume = 0.2;
  }

  if (musicControlInterval) {
    clearInterval(musicControlInterval);
    musicControlInterval = null;
  }

  if (dailyMusicInterval) {
    clearInterval(dailyMusicInterval);
    dailyMusicInterval = null;
  }
};

export const cleanupAudioResources = (): void => {
  stopBackgroundMusic();
  clearAnnouncementQueue();
  stopCancelledFlightAnnouncements();

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  if (gongAudio) {
    gongAudio.pause();
    gongAudio.currentTime = 0;
    gongAudio.onended = null;
    gongAudio.onerror = null;
    gongAudio.src = '';
    gongAudio = null;
  }

  isProcessingQueue = false;
  isKioskMode = false;
};

export const fadeInBackgroundMusic = (): Promise<void> => {
  if (typeof window === 'undefined' || !backgroundAudio || window.location.pathname !== '/timetable') {
    return Promise.resolve();
  }

  if (!shouldPlayBackgroundMusic()) {
    return Promise.resolve();
  }

  if (!backgroundAudio.paused && backgroundAudio.volume >= 0.2) {
      return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    if (!backgroundAudio) {
      resolve();
      return;
    }

    backgroundAudio.volume = backgroundAudio.volume > 0 ? backgroundAudio.volume : 0;
    
    if (backgroundAudio.paused) {
      backgroundAudio.play().catch(error => {
        console.error('Failed to resume background music:', error);
        resolve();
        return;
      });
    }

    const fadeInInterval = setInterval(() => {
      if (backgroundAudio && backgroundAudio.volume < 0.2) {
        backgroundAudio.volume = Math.min(0.2, backgroundAudio.volume + 0.05);
      } else {
        clearInterval(fadeInInterval);
        resolve();
      }
    }, 100);
  });
};

export const playGongSound = (): Promise<void> => {
  if (typeof window === 'undefined') {
    console.error('Not in browser environment, cannot play gong sound.');
    return Promise.resolve();
  }

  if (!shouldPlayGong()) {
    console.log('No active flights today, skipping gong sound');
    return Promise.resolve();
  }

  if (!gongAudio) {
    preloadGongSound();
  }

  if (!gongAudio) {
    console.error('Gong audio not initialized.');
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    gongAudio!.currentTime = 0;

    const timeoutId = setTimeout(() => {
      console.warn('Gong sound timeout');
      resolve();
    }, 5000);

    gongAudio!.onended = () => {
      clearTimeout(timeoutId);
      resolve();
    };

    gongAudio!.onerror = () => {
      clearTimeout(timeoutId);
      console.error('Failed to play gong sound');
      resolve();
    };

    gongAudio!.play().catch(error => {
      clearTimeout(timeoutId);
      console.error('Failed to play gong sound:', error);
      resolve();
    });
  });
};

export const clearAnnouncementQueue = (): void => {
  announcementQueue = [];
  isProcessingQueue = false;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

export const isGongPlaying = (): boolean => {
  return !!(gongAudio && !gongAudio.paused && !gongAudio.ended);
};

export const isBackgroundMusicPlaying = (): boolean => {
  return !!(backgroundAudio && !backgroundAudio.paused && !backgroundAudio.ended);
};

// Get current background music volume
export const getBackgroundMusicVolume = (): number => {
  if (!backgroundAudio) return 0.2;
  return backgroundAudio.volume;
};

// Set background music volume
export const setBackgroundMusicVolume = (volume: number): void => {
  if (!backgroundAudio) return;
  
  const clampedVolume = Math.max(0, Math.min(1, volume));
  backgroundAudio.volume = clampedVolume;
  
  console.log(`Background music volume set to: ${clampedVolume}`);
};

// Get current flight status
export const getFlightStatus = (): { hasActiveFlights: boolean; lastCheck: Date | null } => {
  return {
    hasActiveFlights: hasActiveFlightsToday,
    lastCheck: lastFlightCheckTime
  };
};

// Initialize audio manager interface for the component
export const initializeAudioManagerInterface = (): void => {
  if (typeof window !== 'undefined') {
    window.audioManager = {
      getBackgroundMusicVolume,
      setBackgroundMusicVolume,
      isBackgroundMusicPlaying: () => {
        const playing = isBackgroundMusicPlaying();
        return playing !== null ? playing : false;
      },
      playBackgroundMusic,
      pauseBackgroundMusic,
      toggleBackgroundMusic,
      stopBackgroundMusic,
      getFlightStatus,
      updateFlightStatus,
      debugAudioStatus,
      // Kiosk functions
      setupBackgroundMusicForKiosk,
      playBackgroundMusicForKiosk,
      startKioskAudioWithRetry,
      autoStartKioskAudio
    };
  }
};

// Test stream URL function
export const testStreamUrl = async (): Promise<boolean> => {
  try {
    const streamUrl = process.env.NEXT_PUBLIC_STREAM_URL || 'https://jking.cdnstream1.com/b22139_128mp3';
    const response = await fetch(streamUrl, { method: 'HEAD' });
    console.log('Stream URL test result:', response.ok);
    return response.ok;
  } catch (error) {
    console.error('Stream URL test failed:', error);
    return false;
  }
};

// Type declarations for window.audioManager
declare global {
  interface Window {
    audioManager: {
      getBackgroundMusicVolume: () => number;
      setBackgroundMusicVolume: (volume: number) => void;
      isBackgroundMusicPlaying: () => boolean;
      playBackgroundMusic: () => Promise<boolean>;
      pauseBackgroundMusic: () => void;
      toggleBackgroundMusic: () => Promise<boolean>;
      stopBackgroundMusic: () => void;
      getFlightStatus: () => { hasActiveFlights: boolean; lastCheck: Date | null };
      updateFlightStatus: (hasFlights: boolean) => void;
      debugAudioStatus: () => void;
      setupBackgroundMusicForKiosk: () => Promise<boolean>;
      playBackgroundMusicForKiosk: () => Promise<boolean>;
      startKioskAudioWithRetry: (maxRetries?: number) => Promise<boolean>;
      autoStartKioskAudio: () => Promise<void>;
    };
  }
}