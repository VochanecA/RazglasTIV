// components/ScreenWakeManager.tsx
'use client';

import { useEffect } from 'react';
import { useScreenWakeLock } from '@/hooks/useScreenWakeLock';

interface ScreenWakeManagerProps {
  enabled?: boolean;
  autoStart?: boolean;
}

export const ScreenWakeManager = ({ 
  enabled = true, 
  autoStart = true 
}: ScreenWakeManagerProps) => {
  const { isSupported, isActive, requestWakeLock, releaseWakeLock } = useScreenWakeLock();

  useEffect(() => {
    if (enabled && autoStart && isSupported) {
      // Auto-start wake lock when component mounts
      requestWakeLock();
    }

    return () => {
      if (isActive) {
        releaseWakeLock();
      }
    };
  }, [enabled, autoStart, isSupported]);

  // Optional: Return null for invisible component, or return UI controls
  return null;
};

// Alternative: Component with visible controls
export const ScreenWakeControls = () => {
  const { isSupported, isActive, requestWakeLock, releaseWakeLock } = useScreenWakeLock();

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
        onClick={isActive ? releaseWakeLock : requestWakeLock}
        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {isActive ? 'Release' : 'Keep Active'}
      </button>
    </div>
  );
};