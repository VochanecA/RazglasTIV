'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';

// Ažurirani TypeScript interfejs za window.audioManager
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
      // Kiosk funkcije
      setupBackgroundMusicForKiosk: () => Promise<boolean>;
      playBackgroundMusicForKiosk: () => Promise<boolean>;
      startKioskAudioWithRetry: (maxRetries?: number) => Promise<boolean>;
    };
  }
}

const BackgroundVolume: React.FC = () => {
  const [volume, setVolume] = useState(0.2); // Default volume
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(0.2);

  // Check if we're in browser environment and have access to audioManager
  const hasAudioManager = typeof window !== 'undefined' && window.audioManager;

  useEffect(() => {
    // Initialize volume from audioManager if available
    if (hasAudioManager) {
      const currentVolume = window.audioManager.getBackgroundMusicVolume();
      setVolume(currentVolume);
      setIsPlaying(window.audioManager.isBackgroundMusicPlaying());
    }

    // Set up interval to check playing status
    const interval = setInterval(() => {
      if (hasAudioManager) {
        setIsPlaying(window.audioManager.isBackgroundMusicPlaying());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hasAudioManager]);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    
    if (hasAudioManager) {
      window.audioManager.setBackgroundMusicVolume(newVolume);
    }

    // If volume is set to 0, consider it muted
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      // Unmute: restore previous volume
      const volumeToRestore = previousVolume > 0 ? previousVolume : 0.3;
      handleVolumeChange(volumeToRestore);
      setIsMuted(false);
    } else {
      // Mute: save current volume and set to 0
      setPreviousVolume(volume);
      handleVolumeChange(0);
      setIsMuted(true);
    }
  };

  const togglePlayback = () => {
    if (hasAudioManager) {
      if (isPlaying) {
        window.audioManager.pauseBackgroundMusic();
        setIsPlaying(false);
      } else {
        window.audioManager.playBackgroundMusic();
        setIsPlaying(true);
      }
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="w-5 h-5 text-gray-600 dark:text-gray-300" />;
    } else if (volume < 0.5) {
      return <Volume1 className="w-5 h-5 text-gray-600 dark:text-gray-300" />;
    } else {
      return <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />;
    }
  };

  const getVolumePercentage = () => {
    return Math.round(volume * 100);
  };

  const getPlayingButtonStyles = () => {
    if (isPlaying) {
      return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800';
    } else {
      return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';
    }
  };

  return (
    <div className="bg-teal-100/20 dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-teal-200/20 p-4 transition-colors duration-200">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-blue-700 dark:text-yellow-600">Background Music</span>
          <button
            onClick={togglePlayback}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${getPlayingButtonStyles()}`}
          >
            {isPlaying ? 'Playing' : 'Stopped'}
          </button>
        </div>

        <div className="flex items-center space-x-2 flex-1">
          <button
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {getVolumeIcon()}
          </button>

          <div className="flex-1 relative">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${getVolumePercentage()}%, #e5e7eb ${getVolumePercentage()}%, #e5e7eb 100%)`
              }}
            />
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400 font-mono min-w-[3ch]">
            {getVolumePercentage()}%
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider:focus {
          outline: none;
        }

        .slider:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }

        @media (prefers-color-scheme: dark) {
          .slider::-webkit-slider-thumb {
            border-color: #374151;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
          }

          .slider::-moz-range-thumb {
            border-color: #374151;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
          }

          .slider:focus::-webkit-slider-thumb {
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.4);
          }
        }
      `}</style>
    </div>
  );
};

export default BackgroundVolume;