'use client';

let backgroundAudio: HTMLAudioElement | null = null;
let gongAudio: HTMLAudioElement | null = null;
let musicControlInterval: NodeJS.Timeout | null = null;

// Queue management
let isProcessingQueue = false;
let announcementQueue: string[] = [];

// Export the queue management functions
export const addAnnouncement = async (text: string) => {
  announcementQueue.push(text);
  processAnnouncementQueue();
};

export const addAnnouncements = async (texts: string[]) => {
  announcementQueue.push(...texts);
  processAnnouncementQueue();
};

export const setupBackgroundMusic = () => {
  if (backgroundAudio || window.location.pathname !== '/timetable') return;

  const streamUrl = process.env.REACT_APP_STREAM_URL || 'https://smoothjazz.cdnstream1.com/2586_128.mp3';
  backgroundAudio = new Audio(streamUrl);
  backgroundAudio.loop = true;
  backgroundAudio.volume = 0.3;
  backgroundAudio.play();

  musicControlInterval = setInterval(() => {
    if (window.location.pathname !== '/timetable' && backgroundAudio) {
      stopBackgroundMusic();
    }
  }, 1000);
};

export const fadeOutBackgroundMusic = () => {
  if (!backgroundAudio) return;

  return new Promise<void>((resolve) => {
    const fadeOutInterval = setInterval(() => {
      if (backgroundAudio && backgroundAudio.volume > 0.1) {
        backgroundAudio.volume -= 0.1;
      } else {
        clearInterval(fadeOutInterval);
        backgroundAudio?.pause();
        resolve();
      }
    }, 200);
  });
};

/* export const playAudioAd = async () => {
  const audio = new Audio('/mp3/ads.mp3');
  return new Promise((resolve, reject) => {
    audio.onended = resolve;
    audio.onerror = reject;
    audio.play();
  });
}; */

export const stopBackgroundMusic = () => {
  if (backgroundAudio) {
    backgroundAudio.pause();
    backgroundAudio.currentTime = 0;
    backgroundAudio.removeEventListener('ended', () => {});
    backgroundAudio.src = '';
    backgroundAudio = null;
  }

  if (musicControlInterval) {
    clearInterval(musicControlInterval);
    musicControlInterval = null;
  }
};

export const cleanupAudioResources = () => {
  stopBackgroundMusic();
  clearAnnouncementQueue();

  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  if (gongAudio) {
    gongAudio.pause();
    gongAudio.currentTime = 0;
    gongAudio.src = '';
    gongAudio = null;
  }
};

export const fadeInBackgroundMusic = () => {
  if (!backgroundAudio || window.location.pathname !== '/timetable') return;

  backgroundAudio.volume = 0;
  backgroundAudio.play();

  return new Promise<void>((resolve) => {
    const fadeInInterval = setInterval(() => {
      if (backgroundAudio && backgroundAudio.volume < 0.3) {
        backgroundAudio.volume += 0.1;
      } else {
        clearInterval(fadeInInterval);
        resolve();
      }
    }, 200);
  });
};

export const playGongSound = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!gongAudio) {
      gongAudio = new Audio('/mp3/Gong_pojacan.mp3');
    }
    gongAudio.currentTime = 0;
    gongAudio.play();
    gongAudio.onended = () => resolve();
  });
};

const playTTSAnnouncementWithoutGong = async (text: string): Promise<void> => {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    
    utterance.onend = () => {
      resolve();
    };
    
    window.speechSynthesis.speak(utterance);
  });
};

export const playTTSAnnouncement = async (text: string): Promise<void> => {
  // Add the announcement to queue instead of playing directly
  await addToAnnouncementQueue(text);
};

const processAnnouncementQueue = async () => {
  if (isProcessingQueue || announcementQueue.length === 0) return;

  isProcessingQueue = true;
  let isFirstAnnouncement = true;

  try {
    while (announcementQueue.length > 0) {
      // Fade out background music only for the first announcement
      if (isFirstAnnouncement) {
        await fadeOutBackgroundMusic();
        isFirstAnnouncement = false;
      }

      const announcement = announcementQueue[0];
      
      // Play gong and announcement
      await playGongSound();
      await playTTSAnnouncementWithoutGong(announcement);
      
      // Remove the processed announcement
      announcementQueue.shift();
      
      // Small pause between announcements if there are more in queue
      if (announcementQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Fade background music back in after all announcements
    await fadeInBackgroundMusic();
  } catch (error) {
    console.error('Error processing announcement queue:', error);
  } finally {
    isProcessingQueue = false;
    
    // Check if new announcements were added while processing
    if (announcementQueue.length > 0) {
      processAnnouncementQueue();
    }
  }
};

const addToAnnouncementQueue = async (text: string) => {
  announcementQueue.push(text);
  processAnnouncementQueue();
};

export const clearAnnouncementQueue = () => {
  announcementQueue = [];
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};