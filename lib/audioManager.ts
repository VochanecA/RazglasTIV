'use client';

let backgroundAudio: HTMLAudioElement | null = null;
let gongAudio: HTMLAudioElement | null = null;
let musicControlInterval: NodeJS.Timeout | null = null;

export const setupBackgroundMusic = () => {
  // Only start music if on the timetable page
  if (backgroundAudio || window.location.pathname !== '/timetable') return;

  const streamUrl = process.env.REACT_APP_STREAM_URL || 'https://smoothjazz.cdnstream1.com/2586_128.mp3';
  backgroundAudio = new Audio(streamUrl);
  backgroundAudio.loop = true;
  backgroundAudio.volume = 0.3;
  backgroundAudio.play();

  // Add a listener to check and stop music when navigating away
  musicControlInterval = setInterval(() => {
    if (window.location.pathname !== '/timetable' && backgroundAudio) {
      stopBackgroundMusic();
    }
  }, 1000); // Check every second
};

export const fadeOutBackgroundMusic = () => {
  if (!backgroundAudio) return;

  const fadeOutInterval = setInterval(() => {
    if (backgroundAudio && backgroundAudio.volume > 0.1) {
      backgroundAudio.volume -= 0.1;
    } else {
      clearInterval(fadeOutInterval);
      backgroundAudio?.pause();
    }
  }, 200);
};

export const playAudioAd = async () => {
  const audio = new Audio('/mp3/ads.mp3'); // Update the path to your audio file
  return new Promise((resolve, reject) => {
    audio.onended = resolve; // Resolve when the audio finishes playing
    audio.onerror = reject; // Reject if there's an error
    audio.play();
  });
};

export const stopBackgroundMusic = () => {
  if (backgroundAudio) {
    // Stop and clean up music
    backgroundAudio.pause();
    backgroundAudio.currentTime = 0;
    backgroundAudio.removeEventListener('ended', () => {});
    backgroundAudio.src = '';
    backgroundAudio = null;
  }

  // Clear the interval that checks page location
  if (musicControlInterval) {
    clearInterval(musicControlInterval);
    musicControlInterval = null;
  }
};

export const cleanupAudioResources = () => {
  // Stop background music
  stopBackgroundMusic();

  // Stop any speech synthesis
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  // Reset gong audio if it exists
  if (gongAudio) {
    gongAudio.pause();
    gongAudio.currentTime = 0;
    gongAudio.src = '';
    gongAudio = null;
  }
};

export const fadeInBackgroundMusic = () => {
  // Only fade in if on the timetable page
  if (!backgroundAudio || window.location.pathname !== '/timetable') return;

  backgroundAudio.volume = 0;
  backgroundAudio.play();

  const fadeInInterval = setInterval(() => {
    if (backgroundAudio && backgroundAudio.volume < 0.3) {
      backgroundAudio.volume += 0.1;
    } else {
      clearInterval(fadeInInterval);
    }
  }, 200);
};

export const playGongSound = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!gongAudio) {
      gongAudio = new Audio('/mp3/Gong_pojacan.mp3');
    }
    gongAudio.play();
    gongAudio.onended = () => resolve();
  });
};

export const playTTSAnnouncement = (text: string): Promise<void> => {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    
    fadeOutBackgroundMusic();
    
    utterance.onend = () => {
      fadeInBackgroundMusic();
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
};