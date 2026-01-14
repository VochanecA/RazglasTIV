// lib/emergencyAnnouncementAPI.ts
import { 
  EmergencyAlert, 
  EvacuationProcedure, 
  SecurityLevelChange, 
  LostFoundAnnouncement 
} from './announcementQueue';

export const emergencyAnnouncementAPI = {
  async addSecurityAlert(alert: EmergencyAlert) {
    try {
      const response = await fetch('/api/emergency-announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-security-alert', alert }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to add security alert:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async addEvacuation(procedure: EvacuationProcedure) {
    try {
      const response = await fetch('/api/emergency-announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-evacuation', procedure }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to add evacuation:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async addSecurityLevelChange(change: SecurityLevelChange) {
    try {
      const response = await fetch('/api/emergency-announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-security-level-change', change }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to change security level:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async addLostFound(item: LostFoundAnnouncement) {
    try {
      const response = await fetch('/api/emergency-announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-lost-found', item }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to add lost & found:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async deactivateEmergency(id: string) {
    try {
      const response = await fetch('/api/emergency-announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate-emergency', id }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to deactivate emergency:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async clearAllEmergencies() {
    try {
      const response = await fetch('/api/emergency-announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-all-emergencies' }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to clear emergencies:', error);
      return { success: false, error: 'Network error' };
    }
  },

  async getActiveEmergencies() {
    try {
      const response = await fetch('/api/emergency-announcements');
      return await response.json();
    } catch (error) {
      console.error('Failed to get emergencies:', error);
      return { success: false, error: 'Network error', emergencies: [] };
    }
  },
};