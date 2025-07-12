// hooks/useScreenWakeLock.ts
import { useEffect, useRef, useState } from 'react';

export const useScreenWakeLock = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // Check if Wake Lock API is supported
    setIsSupported('wakeLock' in navigator);
  }, []);

  const requestWakeLock = async () => {
    if (!isSupported) {
      console.warn('Screen Wake Lock API is not supported in this browser');
      return false;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setIsActive(true);
      
      // Listen for wake lock release
      wakeLockRef.current.addEventListener('release', () => {
        console.log('Screen Wake Lock was released');
        setIsActive(false);
      });

      console.log('Screen Wake Lock is active');
      return true;
    } catch (err) {
      console.error('Failed to request screen wake lock:', err);
      return false;
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      setIsActive(false);
    }
  };

  // Auto-release on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  // Handle visibility change (important for mobile)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive && !wakeLockRef.current) {
        // Re-request wake lock when page becomes visible again
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, isSupported]);

  return {
    isSupported,
    isActive,
    requestWakeLock,
    releaseWakeLock,
  };
};