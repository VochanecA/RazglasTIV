// components/ScreenWakeManager.tsx
'use client';

import { useEffect, useState } from 'react';
import { useScreenWakeLock } from '@/hooks/useScreenWakeLock';

interface ScreenWakeManagerProps {
  enabled?: boolean;
  autoStart?: boolean;
  retryDelay?: number; // Delay in milliseconds before auto-retry
}

export const ScreenWakeManager = ({ 
  enabled = true, 
  autoStart = true,
  retryDelay = 2000 // 2 seconds delay
}: ScreenWakeManagerProps) => {
  const { isSupported, isActive, error, requestWakeLock, releaseWakeLock } = useScreenWakeLock();
  const [retryCount, setRetryCount] = useState(0);
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsPageVisible(visible);
      console.log(`Page visibility changed: ${visible ? 'visible' : 'hidden'}`);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    setIsPageVisible(document.visibilityState === 'visible');

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Safe auto-start with retry logic
  useEffect(() => {
    if (!enabled || !autoStart || !isSupported) return;

    let retryTimeout: NodeJS.Timeout;

    const attemptWakeLock = async () => {
      // Only attempt if page is visible
      if (!isPageVisible) {
        console.log('Delaying wake lock request: page not visible');
        retryTimeout = setTimeout(attemptWakeLock, retryDelay);
        return;
      }

      const success = await requestWakeLock();
      
      if (!success && retryCount < 3) {
        console.log(`Wake lock request failed, retrying in ${retryDelay}ms...`);
        setRetryCount(prev => prev + 1);
        retryTimeout = setTimeout(attemptWakeLock, retryDelay);
      }
    };

    // Initial attempt with small delay to ensure page is ready
    const initialTimeout = setTimeout(attemptWakeLock, 500);

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(retryTimeout);
      if (isActive) {
        releaseWakeLock().catch(() => {
          // Silent cleanup
        });
      }
    };
  }, [enabled, autoStart, isSupported, isPageVisible, retryCount, retryDelay]);

  // Log errors for debugging (but don't show to user)
  useEffect(() => {
    if (error) {
      console.warn('Screen Wake Manager error:', error);
    }
  }, [error]);

  // Optional: Return null for invisible component, or return UI controls
  return null;
};

// Alternative: Component with visible controls and better error handling
export const ScreenWakeControls = () => {
  const { isSupported, isActive, error, requestWakeLock, releaseWakeLock } = useScreenWakeLock();
  const [isPageVisible, setIsPageVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    setIsPageVisible(document.visibilityState === 'visible');

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleToggle = async () => {
    if (isActive) {
      await releaseWakeLock();
    } else {
      // Only attempt if page is visible
      if (!isPageVisible) {
        alert('Please make sure the page is visible to activate wake lock');
        return;
      }
      await requestWakeLock();
    }
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-muted-foreground">
        Screen wake lock not supported in this browser
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
      <span>Screen: {isActive ? 'Active' : 'Inactive'}</span>
      <button
        onClick={handleToggle}
        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        disabled={!isPageVisible && !isActive}
      >
        {isActive ? 'Release' : 'Keep Active'}
      </button>
      {error && (
        <span className="text-xs text-red-500 max-w-[120px] truncate" title={error}>
          Error
        </span>
      )}
      {!isPageVisible && (
        <span className="text-xs text-yellow-500">Page hidden</span>
      )}
    </div>
  );
};