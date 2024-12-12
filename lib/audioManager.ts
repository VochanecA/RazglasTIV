'use client';

let backgroundAudio: HTMLAudioElement | null = null;
let gongAudio: HTMLAudioElement | null = null;

export const setupBackgroundMusic = () => {
  if (backgroundAudio) return;

  const streamUrl = process.env.REACT_APP_STREAM_URL || 'https://smoothjazz.cdnstream1.com/2586_128.mp3';
  backgroundAudio = new Audio(streamUrl);
  backgroundAudio.loop = true;
  backgroundAudio.volume = 0.3;
  backgroundAudio.play();
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

export const fadeInBackgroundMusic = () => {
  if (!backgroundAudio) return;

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