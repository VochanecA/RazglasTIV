// lib/emergencyAnnouncementSync.ts
// Ovaj fajl sinhronizuje emergency announcements između server-side i client-side

import { addAnnouncement } from './audioManager';

interface EmergencyAnnouncementEntry {
  id: string;
  type: 'emergency-alert' | 'evacuation-procedure' | 'security-level-change' | 'lost-found';
  text: string;
  priority: number;
  lastAnnouncementTime: Date;
  isActive: boolean;
  repeatInterval: number;
  maxRepeats: number;
  currentRepeats: number;
}

// Client-side polling za emergency announcements
let pollingInterval: NodeJS.Timeout | null = null;
let lastProcessedIds = new Set<string>();

// Function to process and play emergency announcements
const processEmergencyAnnouncement = async (announcement: EmergencyAnnouncementEntry): Promise<void> => {
  try {
    console.log('[Emergency Sync] Processing announcement:', announcement.id);
    
    // Add to audio manager queue with high priority
    await addAnnouncement(announcement.text);
    
    console.log('[Emergency Sync] Added to audio queue:', announcement.text.substring(0, 50));
  } catch (error) {
    console.error('[Emergency Sync] Failed to process announcement:', error);
  }
};

// Function to check for new emergency announcements
const checkEmergencyAnnouncements = async (): Promise<void> => {
  try {
    const response = await fetch('/api/emergency-announcements');
    const data = await response.json();
    
    if (!data.success || !data.emergencies) {
      return;
    }
    
    const now = new Date();
    
    for (const emergency of data.emergencies) {
      // Skip inactive announcements
      if (!emergency.isActive) {
        lastProcessedIds.delete(emergency.id);
        continue;
      }
      
      // Calculate time since last announcement
      const lastTime = emergency.lastAnnouncementTime 
        ? new Date(emergency.lastAnnouncementTime).getTime()
        : 0;
      
      const timeSince = now.getTime() - lastTime;
      
      // Check if it's time to play this announcement
      const shouldPlay = !lastProcessedIds.has(emergency.id) || 
                        (timeSince >= emergency.repeatInterval);
      
      if (shouldPlay && emergency.currentRepeats < emergency.maxRepeats) {
        await processEmergencyAnnouncement(emergency);
        lastProcessedIds.add(emergency.id);
        
        // Update server-side timestamp
        await fetch('/api/emergency-announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'update-timestamp', 
            id: emergency.id 
          }),
        }).catch(err => console.error('[Emergency Sync] Failed to update timestamp:', err));
      }
    }
  } catch (error) {
    console.error('[Emergency Sync] Failed to check announcements:', error);
  }
};

// Start polling for emergency announcements
export const startEmergencyAnnouncementPolling = (intervalMs: number = 10000): void => {
  if (pollingInterval) {
    console.log('[Emergency Sync] Polling already started');
    return;
  }
  
  console.log('[Emergency Sync] Starting polling every', intervalMs, 'ms');
  
  // Check immediately
  checkEmergencyAnnouncements().catch(console.error);
  
  // Then poll regularly
  pollingInterval = setInterval(() => {
    checkEmergencyAnnouncements().catch(console.error);
  }, intervalMs);
};

// Stop polling
export const stopEmergencyAnnouncementPolling = (): void => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('[Emergency Sync] Polling stopped');
  }
};

// Manual trigger for immediate announcement
export const triggerEmergencyAnnouncementCheck = async (): Promise<void> => {
  console.log('[Emergency Sync] Manual trigger initiated');
  await checkEmergencyAnnouncements();
};

// Clear processed IDs (useful for testing)
export const resetProcessedAnnouncements = (): void => {
  lastProcessedIds.clear();
  console.log('[Emergency Sync] Cleared processed announcement history');
};