'use client';

let backgroundAudio: HTMLAudioElement | null = null;
let gongAudio: HTMLAudioElement | null = null;
let musicControlInterval: NodeJS.Timeout | null = null;
let cancelledFlightInterval: NodeJS.Timeout | null = null;

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
  endTime: Date; // 21:00 on the same day
}

// Queue management
let isProcessingQueue = false;
let announcementQueue: Array<{ text: string; flightInfo?: FlightMP3Info }> = [];
let cancelledFlights: CancelledFlightInfo[] = [];

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
    // Extract gate numbers (e.g., "2,3" from "2nd_Gate2,3")
    const gatePart = announcement.split('Gate')[1];
    if (gatePart) {
      const individualGates = gatePart.split(',');

      const paths = individualGates.map(gate => {
        // Construct base announcement without gate numbers
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
const preloadGongSound = () => {
  // Ensure Audio object is available (i.e., running in browser)
  if (typeof window !== 'undefined' && !gongAudio) {
    gongAudio = new Audio('/mp3/Gong_pojacan.mp3');
    // Pre-load the audio file
    gongAudio.load();
    gongAudio.onerror = (error) => {
      console.error('Failed to preload gong sound:', error);
    };
  }
};

// Call this function only if window is defined (client-side)
if (typeof window !== 'undefined') {
  preloadGongSound();
}

// Function to check if current time is before 21:00
const isBeforeEndTime = (): boolean => {
  const now = new Date();
  const endTime = new Date();
  endTime.setHours(21, 0, 0, 0); // Set to 21:00 today
  return now < endTime;
};

// Function to play cancelled flight announcements
const playCancelledFlightAnnouncements = async () => {
  if (!isBeforeEndTime()) {
    console.log('Past 21:00, stopping cancelled flight announcements');
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

  // Add all cancelled flight announcements to the queue
  const cancelledAnnouncements = activeCancelledFlights.map(flight => ({
    text: flight.text,
    flightInfo: flight.flightInfo
  }));

  await addAnnouncements(cancelledAnnouncements);
};

// Function to start cancelled flight announcement schedule
const startCancelledFlightAnnouncements = () => {
  if (cancelledFlightInterval) {
    clearInterval(cancelledFlightInterval);
  }

  // Play immediately if we have cancelled flights and it's before 21:00
  if (cancelledFlights.length > 0 && isBeforeEndTime()) {
    playCancelledFlightAnnouncements();
  }

  // Set up interval to play every 30 minutes (30 * 60 * 1000 = 1800000ms)
  cancelledFlightInterval = setInterval(() => {
    playCancelledFlightAnnouncements();
  }, 30 * 60 * 1000);

  console.log('Started cancelled flight announcements (every 30 minutes until 21:00)');
};

// Function to stop cancelled flight announcement schedule
const stopCancelledFlightAnnouncements = () => {
  if (cancelledFlightInterval) {
    clearInterval(cancelledFlightInterval);
    cancelledFlightInterval = null;
    console.log('Stopped cancelled flight announcements');
  }
};

// Function to add a cancelled flight
export const addCancelledFlight = (text: string, flightInfo?: FlightMP3Info) => {
  const now = new Date();
  const endTime = new Date();
  endTime.setHours(21, 0, 0, 0); // Set to 21:00 today

  // If it's already past 21:00, set end time to 21:00 tomorrow
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

  // Start the announcement schedule if not already running
  if (!cancelledFlightInterval) {
    startCancelledFlightAnnouncements();
  }
};

// Function to remove a cancelled flight
export const removeCancelledFlight = (text: string) => {
  const initialLength = cancelledFlights.length;
  cancelledFlights = cancelledFlights.filter(flight => flight.text !== text);

  if (cancelledFlights.length < initialLength) {
    console.log('Removed cancelled flight:', text);
  }

  // Stop announcements if no cancelled flights remain
  if (cancelledFlights.length === 0) {
    stopCancelledFlightAnnouncements();
  }
};

// Function to get all cancelled flights
export const getCancelledFlights = (): CancelledFlightInfo[] => {
  return [...cancelledFlights];
};

// Function to clear all cancelled flights
export const clearCancelledFlights = () => {
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
      // Ensure Audio object is available before creating a new instance
      if (typeof window === 'undefined') {
        console.error('Audio object not available, cannot play MP3.');
        return reject(new Error('Audio object not available'));
      }
      const audio = new Audio(path);

      // Preload the audio file to reduce delay
      audio.load();

      const cleanup = () => {
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

      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.error('MP3 playback timeout');
        cleanup();
        reject(new Error('MP3 playback timeout'));
      }, 30000); // 30 second timeout

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
      return resolve();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.warn('TTS timeout, resolving anyway');
      resolve();
    }, 30000); // 30 second timeout

    utterance.onend = () => {
      clearTimeout(timeoutId);
      resolve();
    };

    utterance.onerror = (event) => {
      clearTimeout(timeoutId);
      console.error('Speech synthesis error:', event);
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

  // MODIFICATION: Pause background music immediately
  if (backgroundAudio) {
    backgroundAudio.pause();
    console.log('Background music paused for TTS.');
  }

  if (!gongAudio) {
    preloadGongSound();
  }

  // Ensure gongAudio is initialized before proceeding
  if (!gongAudio) {
    console.error('Gong audio not initialized.');
    return playTTSAnnouncementWithoutGong(text); // Fallback to just TTS
  }

  return new Promise<void>((resolve) => {
    // Reset gong to start position
    gongAudio!.currentTime = 0;

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.warn('Gong and TTS timeout, resolving anyway');
      resolve();
    }, 35000); // 35 second timeout

    // Set up the onended callback before playing
    gongAudio!.onended = async () => {
      try {
        // Play TTS immediately after gong ends
        await playTTSAnnouncementWithoutGong(text);
      } catch (error) {
        console.error('Error playing TTS after gong:', error);
      } finally {
        clearTimeout(timeoutId);
        resolve();
      }
    };

    gongAudio!.onerror = (error) => {
      console.error('Gong playback error:', error);
      clearTimeout(timeoutId);
      // If gong fails, still try to play the TTS
      playTTSAnnouncementWithoutGong(text).then(resolve);
    };

    // Play the gong
    gongAudio!.play().catch(error => {
      console.error('Failed to play gong sound:', error);
      clearTimeout(timeoutId);
      // If gong fails, still try to play the TTS
      playTTSAnnouncementWithoutGong(text).then(resolve);
    });
  });
};

// Function that combines playing gong and MP3 without delay
const playGongAndMP3 = async (mp3Path: string): Promise<void> => {
  if (typeof window === 'undefined') {
    console.error('Not in browser environment, cannot play gong and MP3.');
    return Promise.resolve();
  }

  // MODIFICATION: Pause background music immediately
  if (backgroundAudio) {
    backgroundAudio.pause();
    console.log('Background music paused for MP3.');
  }

  if (!gongAudio) {
    preloadGongSound();
  }

  // Ensure gongAudio is initialized before proceeding
  if (!gongAudio) {
    console.error('Gong audio not initialized.');
    return playMP3Announcement(mp3Path); // Fallback to just MP3
  }

  return new Promise<void>((resolve) => {
    // Reset gong to start position
    gongAudio!.currentTime = 0;

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.warn('Gong and MP3 timeout, resolving anyway');
      resolve();
    }, 35000); // 35 second timeout

    // Set up the onended callback before playing
    gongAudio!.onended = async () => {
      try {
        // Play MP3 immediately after gong ends
        await playMP3Announcement(mp3Path);
      } catch (error) {
        console.error('Error playing MP3 after gong:', error);
      } finally {
        clearTimeout(timeoutId);
        resolve();
      }
    };

    gongAudio!.onerror = (error) => {
      console.error('Gong playback error:', error);
      clearTimeout(timeoutId);
      // If gong fails, still try to play the MP3
      playMP3Announcement(mp3Path).then(resolve);
    };

    // Play the gong
    gongAudio!.play().catch(error => {
      console.error('Failed to play gong sound:', error);
      clearTimeout(timeoutId);
      // If gong fails, still try to play the MP3
      playMP3Announcement(mp3Path).then(resolve);
    });
  });
};

const processAnnouncementQueue = async () => {
  if (isProcessingQueue || announcementQueue.length === 0) return;

  isProcessingQueue = true;

  try {
    // MODIFICATION: Move fadeOutBackgroundMusic here, before starting any announcement
    // This ensures it attempts to fade out/pause BEFORE the gong or TTS starts.
    await fadeOutBackgroundMusic(); // This will pause if volume reaches 0.1

    while (announcementQueue.length > 0) {
      try {
        const announcement = announcementQueue[0];

        if (announcement.flightInfo) {
          const mp3Path = getMP3Path(announcement.flightInfo);
          console.log('Processing announcement with path:', mp3Path);

          try {
            // For multiple paths, check if any exist
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

        // Add delay between announcements if there are more
        if (announcementQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error('Error processing single announcement:', error);
        // Remove the problematic announcement and continue
        if (announcementQueue.length > 0) {
          announcementQueue.shift();
        }
      }
    }

    // Fade in background music after all announcements are done
    await fadeInBackgroundMusic();
  } catch (error) {
    console.error('Error in queue processing:', error);
  } finally {
    isProcessingQueue = false;

    // If more announcements were added while processing, restart the queue
    if (announcementQueue.length > 0) {
      setTimeout(processAnnouncementQueue, 1000);
    }
  }
};

export const addAnnouncement = async (text: string, flightInfo?: FlightMP3Info) => {
  announcementQueue.push({ text, flightInfo });
  processAnnouncementQueue();
};

export const addAnnouncements = async (announcements: Array<{ text: string; flightInfo?: FlightMP3Info }>) => {
  announcementQueue.push(...announcements);
  processAnnouncementQueue();
};

// Export to get the current announcement queue
export const getAnnouncementQueue = () => {
  return [...announcementQueue]; // Return a copy to prevent external modification
};

// Export to check if the announcement queue is empty
export const isAnnouncementQueueEmpty = () => {
  return announcementQueue.length === 0;
};

export const setupBackgroundMusic = () => {
  // Ensure Audio object is available and we are on the client side
  if (typeof window === 'undefined' || backgroundAudio) return;

  // Only setup if on timetable page
  if (window.location.pathname !== '/timetable') return;

  const streamUrl = process.env.NEXT_PUBLIC_STREAM_URL || 'https://jking.cdnstream1.com/b22139_128mp3';
  backgroundAudio = new Audio(streamUrl);
  backgroundAudio.loop = true;
  backgroundAudio.volume = 0.2;

  console.log('Background music setup. Remember to call playBackgroundMusic() from a user interaction.');

  // Setup interval to check if we're still on timetable page
  musicControlInterval = setInterval(() => {
    if (window.location.pathname !== '/timetable' && backgroundAudio) {
      stopBackgroundMusic();
    }
  }, 1000);

  // Preload gong sound on music setup
  preloadGongSound();

  // Initialize the audio manager interface
  initializeAudioManagerInterface();
};

// New export for playing background music after user interaction
export const playBackgroundMusic = () => {
  if (backgroundAudio && backgroundAudio.paused) {
    backgroundAudio.play().catch(error => {
      console.error('Failed to play background music on user interaction:', error);
    });
  }
};

// Add this function to your audioManager.ts file
export const pauseBackgroundMusic = (): void => {
  if (backgroundAudio && !backgroundAudio.paused) {
    backgroundAudio.pause();
    console.log('Background music paused');
  }
};

// Optional: Add toggle function for easier control
export const toggleBackgroundMusic = (): void => {
  if (!backgroundAudio) return;
  
  if (backgroundAudio.paused) {
    playBackgroundMusic();
  } else {
    pauseBackgroundMusic();
  }
};

export const fadeOutBackgroundMusic = (): Promise<void> => {
  if (!backgroundAudio) return Promise.resolve(); // Initial check covers the overall function call

  return new Promise<void>((resolve) => {
    // MODIFIED: Add a null check here before accessing properties like 'paused'
    if (backgroundAudio === null) {
      console.warn('backgroundAudio is null inside fadeOutBackgroundMusic promise.');
      return resolve(); // Should not happen if initial check works, but defensive coding
    }

    // If background music isn't currently playing, no need to fade out, just resolve.
    if (backgroundAudio.paused) {
      return resolve();
    }

    const initialVolume = backgroundAudio.volume; // Store current volume to restore later

    const fadeOutInterval = setInterval(() => {
      // MODIFIED: Add null check for backgroundAudio inside the interval callback as well
      if (backgroundAudio === null) {
        clearInterval(fadeOutInterval);
        console.warn('backgroundAudio became null during fadeOutInterval.');
        return resolve();
      }

      if (backgroundAudio.volume > 0.01) { // Fade to near zero
        backgroundAudio.volume = Math.max(0, backgroundAudio.volume - 0.05); // Faster fade out
      } else {
        clearInterval(fadeOutInterval);
        backgroundAudio.pause(); // Ensure it's paused after fading
        backgroundAudio.volume = initialVolume; // Reset volume for next fade-in
        resolve();
      }
    }, 50); // Faster interval for smoother and quicker fade
  });
};

export const stopBackgroundMusic = () => {
  if (backgroundAudio) {
    backgroundAudio.pause();
    backgroundAudio.currentTime = 0;
    backgroundAudio.volume = 0.2; // Reset volume
  }

  if (musicControlInterval) {
    clearInterval(musicControlInterval);
    musicControlInterval = null;
  }
};

export const cleanupAudioResources = () => {
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

  // Reset processing flag
  isProcessingQueue = false;
};

export const fadeInBackgroundMusic = (): Promise<void> => {
  if (typeof window === 'undefined' || !backgroundAudio || window.location.pathname !== '/timetable') {
    return Promise.resolve();
  }

  // If already playing and at target volume, resolve.
  if (!backgroundAudio.paused && backgroundAudio.volume >= 0.2) {
      return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    backgroundAudio!.volume = backgroundAudio!.volume > 0 ? backgroundAudio!.volume : 0; // Start from current or 0
    backgroundAudio!.play().catch(error => {
      console.error('Failed to resume background music:', error);
      resolve();
      return;
    });

    const fadeInInterval = setInterval(() => {
      if (backgroundAudio && backgroundAudio.volume < 0.2) {
        backgroundAudio.volume = Math.min(0.2, backgroundAudio.volume + 0.05); // Slower, smoother fade in
      } else {
        clearInterval(fadeInInterval);
        resolve();
      }
    }, 100); // Slower interval for smoother fade
  });
};

export const playGongSound = (): Promise<void> => {
  if (typeof window === 'undefined') {
    console.error('Not in browser environment, cannot play gong sound.');
    return Promise.resolve();
  }

  if (!gongAudio) {
    preloadGongSound();
  }

  // Ensure gongAudio is initialized before proceeding
  if (!gongAudio) {
    console.error('Gong audio not initialized.');
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    gongAudio!.currentTime = 0;

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.warn('Gong sound timeout');
      resolve();
    }, 5000); // 5 second timeout

    gongAudio!.onended = () => {
      clearTimeout(timeoutId);
      resolve();
    };

    gongAudio!.onerror = (error) => {
      clearTimeout(timeoutId);
      console.error('Failed to play gong sound:', error);
      resolve();
    };

    gongAudio!.play().catch(error => {
      clearTimeout(timeoutId);
      console.error('Failed to play gong sound:', error);
      resolve();
    });
  });
};

export const clearAnnouncementQueue = () => {
  announcementQueue = [];
  isProcessingQueue = false;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

export const isGongPlaying = () => {
  return gongAudio && !gongAudio.paused && !gongAudio.ended;
};

export const isBackgroundMusicPlaying = () => {
  return backgroundAudio && !backgroundAudio.paused && !backgroundAudio.ended;
};

// Get current background music volume
export const getBackgroundMusicVolume = (): number => {
  if (!backgroundAudio) return 0.2; // Default volume
  return backgroundAudio.volume;
};

// Set background music volume
export const setBackgroundMusicVolume = (volume: number): void => {
  if (!backgroundAudio) return;
  
  // Clamp volume between 0 and 1
  const clampedVolume = Math.max(0, Math.min(1, volume));
  backgroundAudio.volume = clampedVolume;
  
  console.log(`Background music volume set to: ${clampedVolume}`);
};

// KIOSK MOD FUNCTIONS

// Funkcija za kiosk mod koja pokušava zaobići autoplay restrictions
export const initializeKioskAudio = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    console.log('Initializing kiosk audio...');

    // Strategy 1: Try to play a silent audio to unlock audio context
    const trySilentAudio = () => {
      const silentAudio = new Audio();
      silentAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgYZrXp8sVvIAUfZqzh57trFgUZX6fb5rVlEAUYWqTZ5bNjDgUXVqHX5LBhDAUWVZ/Y465fCgUVVJ7X4q1dCAUUU53W4axbCAUTUpzW4KtaCAUSUZvV36pZCAURUJrU3qlYCAUQUJnT3ahXCAUPUJjS3KdWCAUOUJfR26ZVCAUNUJbQ2qVUCAUMUJXP2aRTCAULUJTO2KNSCAUKUJPN16JRCAUJUJLM1qFQCAUIUJHL1aBPCAAFAgEEAAIBAQIB';
      silentAudio.volume = 0.001;
      
      const playPromise = silentAudio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Kiosk audio unlocked with silent audio');
          silentAudio.pause();
          silentAudio.remove();
          resolve(true);
        }).catch(() => {
          console.log('Silent audio failed, trying user gesture simulation');
          tryUserGestureSimulation().then(resolve);
        });
      } else {
        console.log('Play promise not supported, trying user gesture simulation');
        tryUserGestureSimulation().then(resolve);
      }
    };

    // Strategy 2: Simulate user gesture through programmatic interaction
    const tryUserGestureSimulation = (): Promise<boolean> => {
      return new Promise((gestureResolve) => {
        try {
          // Create a virtually invisible button and programmatically click it
          const button = document.createElement('button');
          button.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 1px;
            height: 1px;
            opacity: 0.001;
            pointer-events: none;
            z-index: -1;
          `;
          button.textContent = 'audio unlock';
          
          let clicked = false;
          
          button.onclick = () => {
            clicked = true;
            console.log('Programmatic click executed for audio unlock');
            setTimeout(() => {
              button.remove();
              gestureResolve(true);
            }, 100);
          };

          document.body.appendChild(button);
          
          // Try to click programmatically
          setTimeout(() => {
            try {
              button.click();
              console.log('Programmatic click attempted');
            } catch (error) {
              console.error('Programmatic click error:', error);
            }
            
            // Fallback: if not clicked within 2 seconds, remove and resolve false
            setTimeout(() => {
              if (!clicked && document.body.contains(button)) {
                button.remove();
                console.log('Programmatic click timeout');
                gestureResolve(false);
              }
            }, 2000);
            
          }, 100);
          
        } catch (error) {
          console.error('User gesture simulation failed:', error);
          gestureResolve(false);
        }
      });
    };

    // Start with silent audio strategy
    trySilentAudio();
  });
};

// Modifikovana setup funkcija za kiosk
// Modifikovana setup funkcija za kiosk sa silent error handling
export const setupBackgroundMusicForKiosk = async (): Promise<boolean> => {
  if (typeof window === 'undefined') {
    console.log('Cannot setup kiosk audio: not in browser environment');
    return false;
  }

  // Only setup if on timetable page
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
    
    // Setup background music
    const streamUrl = process.env.NEXT_PUBLIC_STREAM_URL || 'https://jking.cdnstream1.com/b22139_128mp3';
    backgroundAudio = new Audio(streamUrl);
    backgroundAudio.loop = true;
    backgroundAudio.volume = 0.2;

    // SILENT AUTOPLAY ATTEMPT - catch all errors
    try {
      const playPromise = backgroundAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Silent catch - this is expected for autoplay restrictions
          console.log('Autoplay blocked (expected), will start on user interaction');
        });
      }
    } catch (error) {
      // Silent catch for sync errors
      console.log('Sync autoplay error caught silently');
    }

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

    console.log('Kiosk audio setup completed (audio ready for user interaction)');
    return true;

  } catch (error) {
    console.log('Kiosk audio setup failed silently');
    return false;
  }
};

// Enhanced play function for kiosk that tries multiple strategies
export const playBackgroundMusicForKiosk = async (): Promise<boolean> => {
  if (!backgroundAudio) {
    console.log('No background audio, setting up kiosk audio first');
    return await setupBackgroundMusicForKiosk();
  }

  if (!backgroundAudio.paused) {
    console.log('Background music already playing');
    return true;
  }

  try {
    // Strategy 1: Direct play with silent error handling
    const playPromise = backgroundAudio.play();
    
    if (playPromise !== undefined) {
      await playPromise;
      console.log('Kiosk background music started');
      return true;
    } else {
      // Fallback for browsers that don't return promise
      backgroundAudio.play();
      console.log('Kiosk background music started (fallback)');
      return true;
    }
  } catch (error) {
    // SILENT ERROR HANDLING - don't throw, just return false
    console.log('Kiosk play failed silently (autoplay restrictions)');
    return false;
  }
};


// Funkcija za automatski start kiosk audio sa retry logikom
// Funkcija za automatski start kiosk audio sa silent retry logikom
export const startKioskAudioWithRetry = async (maxRetries = 2): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Kiosk audio start attempt ${attempt}/${maxRetries}`);
    
    try {
      const success = await playBackgroundMusicForKiosk();
      
      if (success) {
        console.log(`Kiosk audio started successfully on attempt ${attempt}`);
        return true;
      }
      
      // Wait before retry
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
    } catch (error) {
      // SILENT CATCH - don't throw errors to the UI
      console.log(`Kiosk audio attempt ${attempt} failed silently`);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  console.log(`All ${maxRetries} kiosk audio attempts completed (audio will start on user interaction)`);
  return false;
};

// Initialize audio manager interface for the component
export const initializeAudioManagerInterface = () => {
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
      // Kiosk functions
      setupBackgroundMusicForKiosk,
      playBackgroundMusicForKiosk,
      startKioskAudioWithRetry
    };
  }
};

// Modified setupBackgroundMusic function (alternative approach)
export const setupBackgroundMusicWithInterface = () => {
  setupBackgroundMusic();
  initializeAudioManagerInterface();
};

// Type declarations for window.audioManager
declare global {
  interface Window {
    audioManager: {
      getBackgroundMusicVolume: () => number;
      setBackgroundMusicVolume: (volume: number) => void;
      isBackgroundMusicPlaying: () => boolean;
      playBackgroundMusic: () => void;
      pauseBackgroundMusic: () => void;
      toggleBackgroundMusic: () => void;
      stopBackgroundMusic: () => void;
      setupBackgroundMusicForKiosk: () => Promise<boolean>;
      playBackgroundMusicForKiosk: () => Promise<boolean>;
      startKioskAudioWithRetry: (maxRetries?: number) => Promise<boolean>;
    };
  }
}

