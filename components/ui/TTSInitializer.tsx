'use client';

import { useEffect, useRef } from 'react';
import { getFlightTTSEngine } from '@/lib/flightTTS';

export const TTSInitializer = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      const handleUserInteraction = () => {
        const ttsEngine = getFlightTTSEngine();
        if (ttsEngine) {
          ttsEngine.initialize();
          document.removeEventListener('click', handleUserInteraction);
          document.removeEventListener('keypress', handleUserInteraction);
          document.removeEventListener('touchstart', handleUserInteraction);
        }
      };

      // Auto-trigger after a short delay
      const autoTrigger = () => {
        const button = document.createElement('button');
        button.style.position = 'fixed';
        button.style.opacity = '0';
        button.style.pointerEvents = 'none';
        document.body.appendChild(button);
        button.click();
        document.body.removeChild(button);
      };

      // Add event listeners for user interaction
      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('keypress', handleUserInteraction);
      document.addEventListener('touchstart', handleUserInteraction);

      // Attempt auto-trigger after a short delay
      setTimeout(autoTrigger, 1000);

      initialized.current = true;
    }
  }, []);

  return null;
};