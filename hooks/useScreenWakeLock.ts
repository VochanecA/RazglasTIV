// hooks/useScreenWakeLock.ts
import { useEffect, useRef, useState } from 'react';

export const useScreenWakeLock = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // Check if Wake Lock API is supported
    setIsSupported('wakeLock' in navigator);
  }, []);

  const requestWakeLock = async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Screen Wake Lock API is not supported in this browser');
      setError('Wake Lock not supported');
      return false;
    }

    // Check if page is visible before requesting wake lock
    if (document.visibilityState !== 'visible') {
      console.warn('Cannot request wake lock: page is not visible');
      setError('Page must be visible to activate wake lock');
      return false;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setIsActive(true);
      setError(null);
      
      // Listen for wake lock release
      wakeLockRef.current.addEventListener('release', () => {
        console.log('Screen Wake Lock was released');
        setIsActive(false);
      });

      console.log('Screen Wake Lock is active');
      return true;
    } catch (err: any) {
      console.error('Failed to request screen wake lock:', err);
      setError(err.message || 'Failed to activate wake lock');
      return false;
    }
  };

  const releaseWakeLock = async (): Promise<void> => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsActive(false);
        setError(null);
      } catch (err: any) {
        console.error('Failed to release wake lock:', err);
        setError(err.message || 'Failed to release wake lock');
      }
    }
  };

  // Auto-release on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        releaseWakeLock().catch(() => {
          // Silent catch for cleanup
        });
      }
    };
  }, []);

  // Handle visibility change (important for mobile)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive && !wakeLockRef.current) {
        // Re-request wake lock when page becomes visible again
        console.log('Page became visible, re-requesting wake lock');
        await requestWakeLock();
      } else if (document.visibilityState === 'hidden' && wakeLockRef.current) {
        // Wake lock is automatically released when page becomes hidden
        console.log('Page became hidden, wake lock will be released');
        // We don't need to manually release - browser handles this
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
    error,
    requestWakeLock,
    releaseWakeLock,
  };
};