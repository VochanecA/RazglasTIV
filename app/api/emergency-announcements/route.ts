// app/api/emergency-announcements/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Emergency announcement types - definisane lokalno da izbegnemo 'use client' probleme
interface EmergencyAlert {
  type: 'security' | 'weather' | 'medical' | 'technical' | 'security-breach';
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedAreas?: string[];
}

interface EvacuationProcedure {
  type: 'fire' | 'security' | 'weather' | 'other';
  zones: string[];
  assemblyPoints: string[];
  instructions: string;
}

interface SecurityLevelChange {
  previousLevel: string;
  newLevel: string;
  restrictions: string[];
  message: string;
}

interface LostFoundAnnouncement {
  item: string;
  location: string;
  description: string;
  contactInfo: string;
}

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

// Constants
const EMERGENCY_ANNOUNCEMENT_INTERVAL = 5 * 60 * 1000; // 5 minutes
const SECURITY_LEVEL_CHANGE_INTERVAL = 10 * 60 * 1000; // 10 minutes

// In-memory storage for emergency announcements (server-side)
const emergencyAnnouncements = new Map<string, EmergencyAnnouncementEntry>();

// Helper functions
const generateEmergencyAlert = (alert: EmergencyAlert): string => {
  const levelText = alert.level.toUpperCase();
  const areas = alert.affectedAreas?.join(', ') || 'terminal areas';
  
  return `EMERGENCY ALERT LEVEL ${levelText}: ${alert.message}. Affected areas: ${areas}. Please follow staff instructions.`;
};

const generateEvacuationProcedure = (procedure: EvacuationProcedure): string => {
  const zones = procedure.zones.join(', ');
  const assemblyPoints = procedure.assemblyPoints.join(', ');
  
  return `EVACUATION NOTICE: ${procedure.instructions}. Evacuating zones: ${zones}. Proceed to assembly points: ${assemblyPoints}. Do not use elevators.`;
};

const generateSecurityLevelChange = (change: SecurityLevelChange): string => {
  return `SECURITY LEVEL CHANGE: Security level changed from ${change.previousLevel} to ${change.newLevel}. ${change.message}. Restrictions: ${change.restrictions.join(', ')}.`;
};

const generateLostFoundAnnouncement = (item: LostFoundAnnouncement): string => {
  return `LOST AND FOUND: ${item.description} found at ${item.location}. Please contact ${item.contactInfo} to claim.`;
};

// Emergency management functions
const addEmergencyAnnouncement = (
  id: string,
  type: EmergencyAnnouncementEntry['type'],
  text: string,
  priority: number,
  repeatInterval: number,
  maxRepeats: number
): void => {
  const entry: EmergencyAnnouncementEntry = {
    id,
    type,
    text,
    priority,
    lastAnnouncementTime: new Date(0),
    isActive: true,
    repeatInterval,
    maxRepeats,
    currentRepeats: 0,
  };
  emergencyAnnouncements.set(id, entry);
  console.log(`[Server] Added emergency announcement: ${id}`);
};

const addSecurityAlert = (alert: EmergencyAlert): string => {
  const id = `security-alert-${Date.now()}`;
  const text = generateEmergencyAlert(alert);
  
  addEmergencyAnnouncement(
    id,
    'emergency-alert',
    text,
    0, // Highest priority
    EMERGENCY_ANNOUNCEMENT_INTERVAL,
    10 // Repeat 10 times
  );
  
  return id;
};

const addEvacuationProcedure = (procedure: EvacuationProcedure): string => {
  const id = `evacuation-${Date.now()}`;
  const text = generateEvacuationProcedure(procedure);
  
  addEmergencyAnnouncement(
    id,
    'evacuation-procedure',
    text,
    0, // Highest priority
    EMERGENCY_ANNOUNCEMENT_INTERVAL,
    15 // Repeat 15 times for evacuation
  );
  
  return id;
};

const addSecurityLevelChange = (change: SecurityLevelChange): string => {
  const id = `security-level-${Date.now()}`;
  const text = generateSecurityLevelChange(change);
  
  addEmergencyAnnouncement(
    id,
    'security-level-change',
    text,
    1, // High priority
    SECURITY_LEVEL_CHANGE_INTERVAL,
    5 // Repeat 5 times
  );
  
  return id;
};

const addLostFound = (item: LostFoundAnnouncement): string => {
  const id = `lost-found-${Date.now()}`;
  const text = generateLostFoundAnnouncement(item);
  
  addEmergencyAnnouncement(
    id,
    'lost-found',
    text,
    4, // Medium priority
    10 * 60 * 1000, // 10 minutes
    3 // Repeat 3 times
  );
  
  return id;
};

const deactivateEmergencyAnnouncement = (id: string): void => {
  const entry = emergencyAnnouncements.get(id);
  if (entry) {
    entry.isActive = false;
    console.log(`[Server] Deactivated emergency announcement: ${id}`);
  }
};

const clearAllEmergencyAnnouncements = (): void => {
  emergencyAnnouncements.clear();
  console.log('[Server] Cleared all emergency announcements');
};

const getActiveEmergencyAnnouncements = () => {
  return Array.from(emergencyAnnouncements.entries()).map(([id, entry]) => ({
    id,
    type: entry.type,
    text: entry.text,
    priority: entry.priority,
    isActive: entry.isActive,
    currentRepeats: entry.currentRepeats,
    maxRepeats: entry.maxRepeats,
    lastAnnouncementTime: entry.lastAnnouncementTime,
    repeatInterval: entry.repeatInterval,
  }));
};

// API Routes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    console.log(`[Emergency API] Action: ${action}`, data);

    switch (action) {
        
      case 'add-security-alert':
        const alertId = addSecurityAlert(data.alert);
        return NextResponse.json({ success: true, id: alertId });

      case 'add-evacuation':
        const evacuationId = addEvacuationProcedure(data.procedure);
        return NextResponse.json({ success: true, id: evacuationId });

      case 'add-security-level-change':
        const securityId = addSecurityLevelChange(data.change);
        return NextResponse.json({ success: true, id: securityId });

      case 'add-lost-found':
        const lostFoundId = addLostFound(data.item);
        return NextResponse.json({ success: true, id: lostFoundId });

      case 'deactivate-emergency':
        deactivateEmergencyAnnouncement(data.id);
        return NextResponse.json({ success: true });

      case 'update-timestamp':
        const entry = emergencyAnnouncements.get(data.id);
        if (entry) {
          entry.lastAnnouncementTime = new Date();
          entry.currentRepeats += 1;
          
          if (entry.currentRepeats >= entry.maxRepeats) {
            entry.isActive = false;
          }
          
          console.log(`[Server] Updated timestamp for: ${data.id}, repeats: ${entry.currentRepeats}/${entry.maxRepeats}`);
        }
        return NextResponse.json({ success: true });

      case 'clear-all-emergencies':
        clearAllEmergencyAnnouncements();
        return NextResponse.json({ success: true });

      case 'get-active-emergencies':
        const active = getActiveEmergencyAnnouncements();
        return NextResponse.json({ success: true, emergencies: active });

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Emergency announcements API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const activeEmergencies = getActiveEmergencyAnnouncements();
    return NextResponse.json({ success: true, emergencies: activeEmergencies });
  } catch (error) {
    console.error('Emergency announcements GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}