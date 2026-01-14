// Na samom vrhu fajla, dodajte:
/// <reference lib="es2015" />
/// <reference lib="es2015.iterable" />
'use client';

import { FlightData, Flight } from './flightTTS';
import { addAnnouncement, addCancelledFlight, removeCancelledFlight, clearCancelledFlights } from './audioManager';
import { createMp3Play } from './db/queries';
import { AnnouncementType } from './db/schema';
import { generateAIAnnouncement, analyzePassengerSentiment, type AIAnnouncementRequest, type AIAnnouncementResponse } from './aiAnnouncementGenerator';

// Constants
const THROTTLE_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds
const ARRIVAL_ANNOUNCEMENT_WINDOW = 15; // minutes
const MIN_ANNOUNCEMENT_INTERVAL = 5; // minutes
const MAX_ARRIVAL_ANNOUNCEMENTS = 3;
const CANCELLED_FLIGHT_ANNOUNCEMENT_INTERVAL = 30 * 60 * 1000; // 30 minutes for cancelled flights
const DELAY_ANNOUNCEMENT_INTERVAL = 30 * 60 * 1000; // 30 minutes for delayed flights
const MAX_DELAY_ANNOUNCEMENTS = 6; // Maximum number of delay announcements
const EARLIER_ANNOUNCEMENT_INTERVAL = 10 * 60 * 1000; // 10 minutes for earlier flights
const MAX_EARLIER_ANNOUNCEMENTS = 6; // Maximum number of earlier announcements
const ON_TIME_ANNOUNCEMENT_INTERVAL = 60 * 60 * 1000; // 60 minutes for on-time flights
const MAX_ON_TIME_ANNOUNCEMENTS = 2; // Maximum number of on-time announcements
const AI_ANNOUNCEMENT_COOLDOWN = 15 * 60 * 1000; // 15 minutes cooldown for AI announcements

// Emergency announcement constants
const EMERGENCY_ANNOUNCEMENT_INTERVAL = 5 * 60 * 1000; // 5 minutes for emergency announcements
const SECURITY_LEVEL_CHANGE_INTERVAL = 10 * 60 * 1000; // 10 minutes for security level changes

// Check-in timing intervals (in minutes before departure)
const CHECKIN_INTERVALS = [90, 75, 70, 60, 50, 40] as const;
const BOARDING_INTERVALS = [30, 25, 20, 15] as const;
const CLOSE_INTERVALS = [10, 7, 5] as const;
const STATUS_INTERVALS = [90, 80, 70, 60, 50, 40, 30, 20, 10] as const;
const EARLIER_INTERVALS = [90, 70, 60, 40, 30] as const;

// Type guards za array includes
const isInArray = <T extends readonly number[]>(array: T, value: number): value is T[number] => {
  return array.includes(value as T[number]);
};

// Enhanced types
type AnnouncementTypeExtended =
  | 'security'
  | 'special-assistance'
  | 'flight'
  | 'boarding'
  | 'delay'
  | 'earlier'
  | 'cancelled'
  | 'Cancelled'
  | 'diverted'
  | 'checkin'
  | 'close'
  | 'arrived'
  | 'dangerous_goods'
  | 'on-time'
  | 'on Time'
  | 'On time'
  | 'ON TIME'
  | 'ai-delay-reason'
  | 'ai-weather-update'
  | 'ai-passenger-assistance'
  | 'ai-gate-change'
  | 'ai-baggage-info'
  | 'emergency-alert'
  | 'evacuation-procedure'
  | 'security-level-change'
  | 'lost-found';

type FlightStatus =
  | 'processing'
  | 'checkinopen'
  | 'checkin'
  | 'check in open'
  | 'check-in'
  | 'Check-In'
  | 'CHECK-IN'
  | 'boarding'
  | 'close'
  | 'delay'
  | 'delayed'
  | 'arrived'
  | 'landed'
  | 'diverted'
  | 'cancelled'
  | 'Cancelled'
  | 'earlier'
  | 'on-time'
  | 'on time'
  | 'On time'
  | 'ON TIME';

interface Announcement {
  type: AnnouncementTypeExtended;
  text: string;
  flight?: Flight;
  priority?: number;
  isAI?: boolean;
  aiData?: AIAnnouncementResponse;
  isEmergency?: boolean;
}

interface ArrivalLogEntry {
  count: number;
  lastAnnouncementTime: Date;
  flightKey: string;
}

interface DelayLogEntry {
  count: number;
  lastAnnouncementTime: Date;
  flightKey: string;
  initialDelayStatusTime: Date;
}

interface EarlierLogEntry {
  count: number;
  lastAnnouncementTime: Date;
  flightKey: string;
  initialEarlierStatusTime: Date;
}

interface OnTimeLogEntry {
  count: number;
  lastAnnouncementTime: Date;
  flightKey: string;
}

interface CancelledFlightEntry {
  flightKey: string;
  text: string;
  flight: Flight;
  lastAnnouncementTime: Date;
  addedToAudioManager: boolean;
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

interface AnnouncementTemplate {
  template: string;
}

interface AIAnnouncementLogEntry {
  lastAITime: Date;
  flightKey: string;
  announcementType: string;
}

// Emergency announcement types
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

// State management
class AnnouncementState {
  private arrivalAnnouncementLog: Map<string, ArrivalLogEntry> = new Map();
  private delayAnnouncementLog: Map<string, DelayLogEntry> = new Map();
  private earlierAnnouncementLog: Map<string, EarlierLogEntry> = new Map();
  private onTimeAnnouncementLog: Map<string, OnTimeLogEntry> = new Map();
  private cancelledFlights: Map<string, CancelledFlightEntry> = new Map();
  private aiAnnouncementLog: Map<string, AIAnnouncementLogEntry> = new Map();
  private emergencyAnnouncements: Map<string, EmergencyAnnouncementEntry> = new Map();
  private lastAnnouncementTimes: Record<string, Date> = {
    security: new Date(0),
    dangerous_goods: new Date(0),
    special_assistance: new Date(0),
  };
  private processedAnnouncements: Set<string> = new Set();
  private previousFlightStatuses: Map<string, string> = new Map();

  getArrivalLog(flightKey: string): ArrivalLogEntry {
    if (!this.arrivalAnnouncementLog.has(flightKey)) {
      this.arrivalAnnouncementLog.set(flightKey, {
        count: 0,
        lastAnnouncementTime: new Date(0),
        flightKey,
      });
    }
    return this.arrivalAnnouncementLog.get(flightKey)!;
  }

  updateArrivalLog(flightKey: string, updates: Partial<ArrivalLogEntry>): void {
    const log = this.getArrivalLog(flightKey);
    Object.assign(log, updates);
  }

  getDelayLog(flightKey: string): DelayLogEntry {
    if (!this.delayAnnouncementLog.has(flightKey)) {
      this.delayAnnouncementLog.set(flightKey, {
        count: 0,
        lastAnnouncementTime: new Date(0),
        flightKey,
        initialDelayStatusTime: new Date(),
      });
    }
    return this.delayAnnouncementLog.get(flightKey)!;
  }

  updateDelayLog(flightKey: string, updates: Partial<DelayLogEntry>): void {
    const log = this.getDelayLog(flightKey);
    Object.assign(log, updates);
  }

  clearDelayLog(flightKey: string): void {
    this.delayAnnouncementLog.delete(flightKey);
  }

  getEarlierLog(flightKey: string): EarlierLogEntry {
    if (!this.earlierAnnouncementLog.has(flightKey)) {
      this.earlierAnnouncementLog.set(flightKey, {
        count: 0,
        lastAnnouncementTime: new Date(0),
        flightKey,
        initialEarlierStatusTime: new Date(),
      });
    }
    return this.earlierAnnouncementLog.get(flightKey)!;
  }

  updateEarlierLog(flightKey: string, updates: Partial<EarlierLogEntry>): void {
    const log = this.getEarlierLog(flightKey);
    Object.assign(log, updates);
  }

  clearEarlierLog(flightKey: string): void {
    this.earlierAnnouncementLog.delete(flightKey);
  }

  getOnTimeLog(flightKey: string): OnTimeLogEntry {
    if (!this.onTimeAnnouncementLog.has(flightKey)) {
      this.onTimeAnnouncementLog.set(flightKey, {
        count: 0,
        lastAnnouncementTime: new Date(0),
        flightKey,
      });
    }
    return this.onTimeAnnouncementLog.get(flightKey)!;
  }

  updateOnTimeLog(flightKey: string, updates: Partial<OnTimeLogEntry>): void {
    const log = this.getOnTimeLog(flightKey);
    Object.assign(log, updates);
  }

  clearOnTimeLog(flightKey: string): void {
    this.onTimeAnnouncementLog.delete(flightKey);
  }

  getLastAnnouncementTime(type: string): Date {
    return this.lastAnnouncementTimes[type] || new Date(0);
  }

  updateLastAnnouncementTime(type: string, time: Date): void {
    this.lastAnnouncementTimes[type] = time;
  }

  hasProcessedAnnouncement(key: string): boolean {
    return this.processedAnnouncements.has(key);
  }

  markAnnouncementProcessed(key: string): void {
    this.processedAnnouncements.add(key);
  }

  getPreviousFlightStatus(flightKey: string): string | undefined {
    return this.previousFlightStatuses.get(flightKey);
  }

  setPreviousFlightStatus(flightKey: string, status: string): void {
    this.previousFlightStatuses.set(flightKey, status);
  }

  // AI Announcement management
  getAILog(flightKey: string, announcementType: string): AIAnnouncementLogEntry {
    const key = `${flightKey}-${announcementType}`;
    if (!this.aiAnnouncementLog.has(key)) {
      this.aiAnnouncementLog.set(key, {
        lastAITime: new Date(0),
        flightKey,
        announcementType,
      });
    }
    return this.aiAnnouncementLog.get(key)!;
  }

  updateAILog(flightKey: string, announcementType: string, time: Date): void {
    const key = `${flightKey}-${announcementType}`;
    this.aiAnnouncementLog.set(key, {
      lastAITime: time,
      flightKey,
      announcementType,
    });
  }

  canUseAI(flightKey: string, announcementType: string): boolean {
    const log = this.getAILog(flightKey, announcementType);
    const now = new Date();
    return now.getTime() - log.lastAITime.getTime() > AI_ANNOUNCEMENT_COOLDOWN;
  }

  // Cancelled flight management
  addCancelledFlight(flightKey: string, text: string, flight: Flight): void {
    const entry: CancelledFlightEntry = {
      flightKey,
      text,
      flight,
      lastAnnouncementTime: new Date(0),
      addedToAudioManager: false,
    };
    this.cancelledFlights.set(flightKey, entry);
    console.log(`Added cancelled flight to queue: ${flightKey}`);
  }

  removeCancelledFlight(flightKey: string): void {
    const entry = this.cancelledFlights.get(flightKey);
    if (entry?.addedToAudioManager) {
      removeCancelledFlight(entry.text);
    }
    this.cancelledFlights.delete(flightKey);
    console.log(`Removed cancelled flight from queue: ${flightKey}`);
  }

  getCancelledFlights(): Map<string, CancelledFlightEntry> {
    return this.cancelledFlights;
  }

  clearAllCancelledFlights(): void {
    this.cancelledFlights.forEach((entry) => {
      if (entry.addedToAudioManager) {
        removeCancelledFlight(entry.text);
      }
    });
    this.cancelledFlights.clear();
    clearCancelledFlights();
    console.log('Cleared all cancelled flights');
  }

  updateCancelledFlightAnnouncementTime(flightKey: string, time: Date): void {
    const entry = this.cancelledFlights.get(flightKey);
    if (entry) {
      entry.lastAnnouncementTime = time;
    }
  }

  setCancelledFlightAddedToAudioManager(flightKey: string, added: boolean): void {
    const entry = this.cancelledFlights.get(flightKey);
    if (entry) {
      entry.addedToAudioManager = added;
    }
  }

  // Emergency announcement management
  addEmergencyAnnouncement(
    id: string,
    type: EmergencyAnnouncementEntry['type'],
    text: string,
    priority: number,
    repeatInterval: number = EMERGENCY_ANNOUNCEMENT_INTERVAL,
    maxRepeats: number = 10
  ): void {
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
    this.emergencyAnnouncements.set(id, entry);
    console.log(`Added emergency announcement: ${id}`);
  }

  removeEmergencyAnnouncement(id: string): void {
    this.emergencyAnnouncements.delete(id);
    console.log(`Removed emergency announcement: ${id}`);
  }

  getEmergencyAnnouncements(): Map<string, EmergencyAnnouncementEntry> {
    return this.emergencyAnnouncements;
  }

  updateEmergencyAnnouncementTime(id: string, time: Date): void {
    const entry = this.emergencyAnnouncements.get(id);
    if (entry) {
      entry.lastAnnouncementTime = time;
      entry.currentRepeats += 1;
      
      if (entry.currentRepeats >= entry.maxRepeats) {
        entry.isActive = false;
      }
    }
  }

  deactivateEmergencyAnnouncement(id: string): void {
    const entry = this.emergencyAnnouncements.get(id);
    if (entry) {
      entry.isActive = false;
    }
  }

  clearAllEmergencyAnnouncements(): void {
    this.emergencyAnnouncements.clear();
    console.log('Cleared all emergency announcements');
  }

  cleanup(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const aiCutoffTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours for AI logs

    // Clean up various announcement logs
    const logsToClean = [
      this.arrivalAnnouncementLog,
      this.delayAnnouncementLog,
      this.earlierAnnouncementLog,
      this.onTimeAnnouncementLog,
    ];

    logsToClean.forEach((logMap) => {
      const keysToDelete: string[] = [];
      logMap.forEach((entry, key) => {
        if (entry.lastAnnouncementTime < cutoffTime) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => logMap.delete(key));
    });

    // Clean up AI logs
    const aiKeysToDelete: string[] = [];
    this.aiAnnouncementLog.forEach((entry, key) => {
      if (entry.lastAITime < aiCutoffTime) {
        aiKeysToDelete.push(key);
      }
    });
    aiKeysToDelete.forEach((key) => this.aiAnnouncementLog.delete(key));

    // Clean up inactive emergency announcements
    const emergencyKeysToDelete: string[] = [];
    this.emergencyAnnouncements.forEach((entry, key) => {
      if (!entry.isActive) {
        emergencyKeysToDelete.push(key);
      }
    });
    emergencyKeysToDelete.forEach((key) => this.emergencyAnnouncements.delete(key));

    const cancelledCutoffTime = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const cancelledKeysToDelete: string[] = [];

    this.cancelledFlights.forEach((entry, key) => {
      if (entry.lastAnnouncementTime < cancelledCutoffTime && entry.lastAnnouncementTime.getTime() > 0) {
        cancelledKeysToDelete.push(key);
      }
    });

    cancelledKeysToDelete.forEach((key) => {
      this.removeCancelledFlight(key);
    });

    const statusCutoffTime = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const statusKeysToDelete: string[] = [];

    this.previousFlightStatuses.forEach((_, key) => {
      const delayEntry = this.delayAnnouncementLog.get(key);
      const earlierEntry = this.earlierAnnouncementLog.get(key);
      const onTimeEntry = this.onTimeAnnouncementLog.get(key);

      if (
        (!delayEntry || delayEntry.lastAnnouncementTime < statusCutoffTime) &&
        (!earlierEntry || earlierEntry.lastAnnouncementTime < statusCutoffTime) &&
        (!onTimeEntry || onTimeEntry.lastAnnouncementTime < statusCutoffTime)
      ) {
        statusKeysToDelete.push(key);
      }
    });

    statusKeysToDelete.forEach((key) => {
      this.previousFlightStatuses.delete(key);
    });
  }
}

const announcementState = new AnnouncementState();

// Utility functions
const parseTime = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const parseCheckInOrGateNumbers = (input: string): string => {
  const numbers = input
    .split(',')
    .map((num) => parseInt(num.trim(), 10))
    .filter((num) => !Number.isNaN(num));

  if (numbers.length === 0) return '';
  if (numbers.length === 1) return numbers[0].toString();

  const lastNumber = numbers.pop()!;
  return `${numbers.join(', ')} and ${lastNumber}`;
};

const parseFlightNumber = (flightNumber: string): string => {
  const cleanedFlightNumber = flightNumber.replace(/[^a-zA-Z0-9]/g, '').trim();

  const numberToWords: Record<string, string> = {
    '0': 'zero',
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '6': 'six',
    '7': 'seven',
    '8': 'eight',
    '9': 'nine',
  };

  return cleanedFlightNumber
    .split('')
    .map((char) => numberToWords[char] || char)
    .join(' ');
};

const getAnnouncementSuffix = (type: AnnouncementTypeExtended): string => {
  const suffixMap: Record<AnnouncementTypeExtended, string> = {
    checkin: '_1st',
    boarding: '_Boarding',
    arrived: '_Arrived',
    cancelled: '_Cancelled',
    Cancelled: '_Cancelled',
    diverted: '_Diverted',
    earlier: '_Earlier',
    close: '_Close',
    delay: '_Delay',
    security: '',
    'special-assistance': '',
    flight: '',
    dangerous_goods: '',
    'on-time': '_OnTime',
    'ai-delay-reason': '_AI_Delay',
    'ai-weather-update': '_AI_Weather',
    'ai-passenger-assistance': '_AI_Assistance',
    'ai-gate-change': '_AI_Gate',
    'ai-baggage-info': '_AI_Baggage',
    'emergency-alert': '_Emergency',
    'evacuation-procedure': '_Evacuation',
    'security-level-change': '_SecurityLevel',
    'lost-found': '_LostFound',
    'on Time': '',
    'On time': '',
    'ON TIME': ''
  };

  return suffixMap[type] || '';
};

// POBOLJŠANA NORMALIZACIJA STATUSA
const normalizeCancelledStatus = (status: string): 'cancelled' | null => {
  const cancelledVariants = [
    'cancelled', 'Cancelled', 'CANCELLED', 
    'canceled', 'Canceled', 'CANCELED',
    'otkazan', 'Otkazan', 'OTKAZAN' // Dodati lokalne varijante ako su potrebne
  ];
  
  if (cancelledVariants.includes(status)) {
    return 'cancelled';
  }
  return null;
};

const normalizeFlightStatus = (status: string): FlightStatus | null => {
  // Prvo provjeri cancelled status
  const cancelledStatus = normalizeCancelledStatus(status);
  if (cancelledStatus) {
    return cancelledStatus;
  }

  const statusMap: Record<string, FlightStatus> = {
    processing: 'processing',
    checkinopen: 'checkinopen',
    checkin: 'checkin',
    'check in open': 'check in open',
    'check-in': 'check-in',
    'Check-In': 'check-in',
    'CHECK-IN': 'check-in',
    boarding: 'boarding',
    close: 'close',
    arrived: 'arrived',
    landed: 'landed',
    diverted: 'diverted',
    earlier: 'earlier',
    delay: 'delay',
    delayed: 'delayed',
    'on time': 'on-time',
    'on-time': 'on-time',
    'On time': 'on-time',
    'ON TIME': 'on-time',
  };

  return statusMap[status.toLowerCase()] || null;
};

// Announcement generators
const generateSecurityAnnouncement = (): string => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `Attention please: Do not leave baggage unattended; it will be removed for security reason and may be destroyed. Thank you. Local time: ${currentTime}.`;
};

const generateDangerousGoodsAnnouncement = (): string => {
  return `Attention: Dangerous goods must be prepared by qualified personnel or meet exemptions. Lithium batteries allowed only in cabin; spare batteries not in checked baggage. Smart luggage with non-removable batteries >0.3g lithium or 2.7Wh is prohibited. See iata.org/en/publications/dgr for details. Thank you.`;
};

const generateSpecialAssistanceAnnouncement = (): string => {
  return 'Dear passengers, for special assistance, please notify staff or use help points in the terminal.';
};

// Emergency announcement generators
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

const generateDefaultDelayAnnouncement = (flight: Flight): string => {
  return (
    `We regret to inform you that ${flight.KompanijaNaziv} flight ${parseFlightNumber(flight.ident)} ` +
    'is currently delayed. We apologize for any inconvenience this may cause and are working ' +
    'diligently to minimize the delay. Please stay tuned for further updates and announcements. ' +
    'Thank you for your patience and understanding.'
  );
};

const generateDefaultEarlierAnnouncement = (flight: Flight): string => {
  return (
    `Attention please. ${flight.KompanijaNaziv} flight ${parseFlightNumber(flight.ident)} ` +
    `from ${flight.grad} is arriving earlier than scheduled. ` +
    `The flight is now expected to arrive at approximately ${flight.estimated_out || flight.scheduled_out}. ` +
    'Please check the information screens for updates. Thank you.'
  );
};

 const generateDefaultOnTimeAnnouncement = (flight: Flight): string => {
  return (
    `Attention please. ${flight.KompanijaNaziv} flight ${parseFlightNumber(flight.ident)} ` +
    `from ${flight.grad} is scheduled to arrive on time. ` +
    `Expected arrival time is approximately ${flight.estimated_out || flight.scheduled_out}. ` +
    'Thank you.'
  );
};

const logMp3Play = async (announcement: Announcement): Promise<void> => {
  try {
    await createMp3Play({
      flightIcaoCode: announcement.flight?.KompanijaICAO || 'UNKNOWN',
      flightNumber: announcement.flight?.ident || '',
      destinationCode: announcement.flight?.destination?.code || '',
      callType: announcement.type as AnnouncementType,
      filename: `${announcement.type}_announcement.mp3`,
      gate: announcement.flight?.gate || undefined,
    });
  } catch (error) {
    console.error(`Failed to log MP3 play for announcement ${announcement.type}:`, error);
  }
};

const shouldPlayArrivalAnnouncement = (flight: Flight): boolean => {
  const flightKey = `${flight.Kompanija} ${flight.ident}-${flight.origin.code}`;
  const now = new Date();

  const arrivalTime = parseTime(flight.scheduled_out);
  const timeSinceArrival = (now.getTime() - arrivalTime.getTime()) / (1000 * 60);

  if (timeSinceArrival > ARRIVAL_ANNOUNCEMENT_WINDOW) return false;

  const log = announcementState.getArrivalLog(flightKey);

  if (log.count === 0) {
    announcementState.updateArrivalLog(flightKey, {
      count: 1,
      lastAnnouncementTime: now,
    });
    return true;
  }

  const minutesSinceLastAnnouncement = (now.getTime() - log.lastAnnouncementTime.getTime()) / (1000 * 60);

  if (log.count < MAX_ARRIVAL_ANNOUNCEMENTS && minutesSinceLastAnnouncement >= MIN_ANNOUNCEMENT_INTERVAL) {
    announcementState.updateArrivalLog(flightKey, {
      count: log.count + 1,
      lastAnnouncementTime: now,
    });
    return true;
  }

  return false;
};

const shouldPlayDelayAnnouncement = (flight: Flight): boolean => {
  const flightKey = `${flight.Kompanija} ${flight.ident}-${flight.origin.code}`;
  const now = new Date();
  const currentStatus = normalizeFlightStatus(flight.status);
  const previousStatus = announcementState.getPreviousFlightStatus(flightKey);

  const isCurrentlyDelayed = currentStatus === 'delay' || currentStatus === 'delayed';

  const log = announcementState.getDelayLog(flightKey);

  announcementState.setPreviousFlightStatus(flightKey, flight.status);

  const statusChangedToDelayed = previousStatus !== 'delay' && previousStatus !== 'delayed' && isCurrentlyDelayed;

  if ((previousStatus === 'delay' || previousStatus === 'delayed') && !isCurrentlyDelayed) {
    announcementState.clearDelayLog(flightKey);
    return false;
  }

  if (!isCurrentlyDelayed) {
    return false;
  }

  if (statusChangedToDelayed) {
    announcementState.updateDelayLog(flightKey, {
      count: 1,
      lastAnnouncementTime: now,
      initialDelayStatusTime: now,
    });
    return true;
  }

  const timeSinceLastAnnouncement = now.getTime() - log.lastAnnouncementTime.getTime();

  if (log.count < MAX_DELAY_ANNOUNCEMENTS && timeSinceLastAnnouncement >= DELAY_ANNOUNCEMENT_INTERVAL) {
    announcementState.updateDelayLog(flightKey, {
      count: log.count + 1,
      lastAnnouncementTime: now,
    });
    return true;
  }

  return false;
};

const shouldPlayEarlierAnnouncement = (flight: Flight): boolean => {
  const flightKey = `${flight.Kompanija} ${flight.ident}-${flight.origin.code}`;
  const now = new Date();
  const currentStatus = normalizeFlightStatus(flight.status);
  const previousStatus = announcementState.getPreviousFlightStatus(flightKey);

  const isCurrentlyEarlier = currentStatus === 'earlier';
  const isArrivedStatus = ['arrived', 'landed'].includes(currentStatus || '');

  const log = announcementState.getEarlierLog(flightKey);

  announcementState.setPreviousFlightStatus(flightKey, flight.status);

  if (previousStatus === 'earlier' && isArrivedStatus) {
    announcementState.clearEarlierLog(flightKey);
    return false;
  }

  if (!isCurrentlyEarlier) {
    return false;
  }

  if (previousStatus !== 'earlier' && isCurrentlyEarlier) {
    announcementState.updateEarlierLog(flightKey, {
      count: 1,
      lastAnnouncementTime: now,
      initialEarlierStatusTime: now,
    });
    return true;
  }

  const timeSinceLastAnnouncement = now.getTime() - log.lastAnnouncementTime.getTime();

  if (log.count < MAX_EARLIER_ANNOUNCEMENTS && timeSinceLastAnnouncement >= EARLIER_ANNOUNCEMENT_INTERVAL) {
    announcementState.updateEarlierLog(flightKey, {
      count: log.count + 1,
      lastAnnouncementTime: now,
    });
    return true;
  }

  return false;
};

const shouldPlayOnTimeAnnouncement = (flight: Flight): boolean => {
  const flightKey = `${flight.Kompanija} ${flight.ident}-${flight.origin.code}`;
  const now = new Date();
  const currentStatus = normalizeFlightStatus(flight.status);
  const previousStatus = announcementState.getPreviousFlightStatus(flightKey);

  const isCurrentlyOnTime = currentStatus === 'on-time';
  const isArrivedOrDeparted = ['arrived', 'landed', 'departed'].includes(currentStatus || '');

  const log = announcementState.getOnTimeLog(flightKey);

  announcementState.setPreviousFlightStatus(flightKey, flight.status);

  if (
    previousStatus === 'on-time' &&
    (isArrivedOrDeparted || currentStatus === 'delay' || currentStatus === 'delayed' || currentStatus === 'cancelled' || currentStatus === 'earlier')
  ) {
    announcementState.clearOnTimeLog(flightKey);
    return false;
  }

  if (!isCurrentlyOnTime) {
    return false;
  }

  if (previousStatus !== 'on-time' && isCurrentlyOnTime) {
    announcementState.updateOnTimeLog(flightKey, {
      count: 1,
      lastAnnouncementTime: now,
    });
    return true;
  }

  const timeSinceLastAnnouncement = now.getTime() - log.lastAnnouncementTime.getTime();

  if (log.count < MAX_ON_TIME_ANNOUNCEMENTS && timeSinceLastAnnouncement >= ON_TIME_ANNOUNCEMENT_INTERVAL) {
    announcementState.updateOnTimeLog(flightKey, {
      count: log.count + 1,
      lastAnnouncementTime: now,
    });
    return true;
  }

  return false;
};

const fetchAnnouncementTemplate = async (airlineCode: string, type: string): Promise<AnnouncementTemplate | null> => {
  try {
    const response = await fetch(`/api/getAnnouncements?airlineCode=${airlineCode}&type=${type}`);
    if (!response.ok) {
      console.warn(`Failed to fetch announcement template for ${airlineCode} ${type}: ${response.status}`);
      return null;
    }
    return response.json();
  } catch (error) {
    console.error(`Error fetching announcement template for ${airlineCode} ${type}:`, error);
    return null;
  }
};

// AI-enhanced announcement generation
const generateAIEnhancedAnnouncement = async (flight: Flight, type: AnnouncementTypeExtended): Promise<Announcement | null> => {
  const flightKey = `${flight.Kompanija} ${flight.ident}-${flight.origin.code}`;
  
  // Check if we can use AI for this announcement
  if (!announcementState.canUseAI(flightKey, type)) {
    return null;
  }

  try {
    const now = new Date();
    const timeOfDay = now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening';
    const isPeakHours = (now.getHours() >= 7 && now.getHours() <= 9) || (now.getHours() >= 16 && now.getHours() <= 19);

    // Type-safe delay handling
    const delayValue = flight.delay ?? 0; // Convert null/undefined to 0

    const aiRequest: AIAnnouncementRequest = {
      flight: {
        airline: flight.KompanijaNaziv,
        flightNumber: flight.ident,
        destination: flight.grad,
        origin: flight.origin.code,
        scheduledTime: flight.scheduled_out,
        estimatedTime: flight.estimated_out,
        gate: flight.gate,
        status: flight.status,
        delay: flight.delay ?? undefined, // Use undefined instead of null
      },
      announcementType: type.replace('ai-', ''),
      context: {
        timeOfDay,
        isPeakHours,
        previousAnnouncements: [], // Could be enhanced to track previous announcements
        passengerSentiment: analyzePassengerSentiment(delayValue, timeOfDay, isPeakHours),
      },
    };

    const aiResponse = await generateAIAnnouncement(aiRequest);

    if (aiResponse.shouldAnnounce) {
      announcementState.updateAILog(flightKey, type, now);
      
      return {
        type,
        text: aiResponse.text,
        flight,
        priority: aiResponse.priority,
        isAI: true,
        aiData: aiResponse,
      };
    }
  } catch (error) {
    console.error(`AI announcement generation failed for flight ${flight.ident}:`, error);
  }

  return null;
};

const processFlightAnnouncement = async (flight: Flight, type: AnnouncementTypeExtended, condition: boolean): Promise<Announcement | null> => {
  // Type guard to ensure condition is strictly boolean
  if (!Boolean(condition)) return null;

  const announcementKey = `${flight.ident}-${type}`;
  if (announcementState.hasProcessedAnnouncement(announcementKey)) {
    return null;
  }

  announcementState.markAnnouncementProcessed(announcementKey);

  // Try AI-enhanced announcement first for certain types
  if (type.startsWith('ai-')) {
    const aiAnnouncement = await generateAIEnhancedAnnouncement(flight, type);
    if (aiAnnouncement) {
      return aiAnnouncement;
    }
    // Fall back to regular announcement if AI fails
    type = type.replace('ai-', '') as AnnouncementTypeExtended;
  }

  let text: string;
  let template: AnnouncementTemplate | null;

  switch (type) {
    case 'delay':
      template = await fetchAnnouncementTemplate(flight.KompanijaICAO, type);
      text = template
        ? template.template
            .replace('{flightNumber}', parseFlightNumber(flight.ident))
            .replace('{destination}', flight.grad)
            .replace('{gate}', flight.gate ? parseCheckInOrGateNumbers(flight.gate) : '')
            .replace('{counters}', flight.checkIn ? parseCheckInOrGateNumbers(flight.checkIn) : '')
            .replace('{origin}', flight.grad)
            .replace('{originCODE}', flight.origin?.code || '')
            .replace('{delayMinutes}', (flight.delay?.toString() || 'a short'))
            .replace('{newTime}', flight.estimated_out || flight.scheduled_out)
        : generateDefaultDelayAnnouncement(flight);
      break;
    case 'earlier':
      template = await fetchAnnouncementTemplate(flight.KompanijaICAO, type);
      text = template
        ? template.template
            .replace('{flightNumber}', parseFlightNumber(flight.ident))
            .replace('{origin}', flight.grad)
            .replace('{newTime}', flight.estimated_out || flight.scheduled_out)
        : generateDefaultEarlierAnnouncement(flight);
      break;
    case 'on-time':
      template = await fetchAnnouncementTemplate(flight.KompanijaICAO, type);
      text = template
        ? template.template
            .replace('{flightNumber}', parseFlightNumber(flight.ident))
            .replace('{origin}', flight.grad)
            .replace('{scheduledTime}', flight.scheduled_out)
        : generateDefaultOnTimeAnnouncement(flight);
      break;
    default:
      template = await fetchAnnouncementTemplate(flight.KompanijaICAO, type);
      if (!template) return null;
      text = template.template
        .replace('{flightNumber}', parseFlightNumber(flight.ident))
        .replace('{destination}', flight.grad)
        .replace('{gate}', flight.gate ? parseCheckInOrGateNumbers(flight.gate) : '')
        .replace('{counters}', flight.checkIn ? parseCheckInOrGateNumbers(flight.checkIn) : '')
        .replace('{origin}', flight.grad)
        .replace('{originCODE}', flight.origin?.code || '');
  }

  return {
    type,
    text,
    flight,
    priority: getPriorityForAnnouncementType(type),
  };
};

const getPriorityForAnnouncementType = (type: AnnouncementTypeExtended): number => {
  const priorityMap: Record<AnnouncementTypeExtended, number> = {
    'emergency-alert': 0, // Highest priority
    'evacuation-procedure': 0,
    'security-level-change': 1,
    security: 1,
    dangerous_goods: 1,
    cancelled: 2,
    Cancelled: 2,
    diverted: 2,
    close: 3,
    boarding: 4,
    earlier: 3,
    delay: 3,
    'on-time': 5,
    checkin: 6,
    arrived: 7,
    'special-assistance': 8,
    flight: 9,
    'lost-found': 4,
    'ai-delay-reason': 2, // High priority for AI delay reasons
    'ai-weather-update': 2, // High priority for weather updates
    'ai-passenger-assistance': 3, // Medium-high priority
    'ai-gate-change': 3, // Medium-high priority
    'ai-baggage-info': 4,
    'on Time': 0,
    'On time': 0,
    'ON TIME': 0
  };

  return priorityMap[type] || 10;
};

const calculateTimeDifference = (scheduledTime: string, currentTime: Date): number => {
  const [scheduledHours, scheduledMinutes] = scheduledTime.split(':').map(Number);
  const scheduledTimeInMinutes = scheduledHours * 60 + scheduledMinutes;
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  return scheduledTimeInMinutes - currentMinutes;
};

const processCancelledFlights = (now: Date): void => {
  const cancelledFlights = announcementState.getCancelledFlights();

  cancelledFlights.forEach((entry, flightKey) => {
    const timeSinceLastAnnouncement = now.getTime() - entry.lastAnnouncementTime.getTime();

    if (!entry.addedToAudioManager || timeSinceLastAnnouncement >= CANCELLED_FLIGHT_ANNOUNCEMENT_INTERVAL) {
      const audioManagerData = {
        type: entry.flight.TipLeta.includes('I') ? 'ARR' as const : 'DEP' as const,
        airline: entry.flight.Kompanija,
        flightNumber: entry.flight.ident,
        announcement: 'cancelled',
        originCODE: entry.flight.origin.code,
      };

      addCancelledFlight(entry.text, audioManagerData);

      announcementState.setCancelledFlightAddedToAudioManager(flightKey, true);
      announcementState.updateCancelledFlightAnnouncementTime(flightKey, now);

      console.log(`Added cancelled flight to audio manager: ${flightKey}`);
    }
  });
};

const processEmergencyAnnouncements = (now: Date): Announcement[] => {
  const announcements: Announcement[] = [];
  const emergencyAnnouncements = announcementState.getEmergencyAnnouncements();

  emergencyAnnouncements.forEach((entry) => {
    if (!entry.isActive) return;

    const timeSinceLastAnnouncement = now.getTime() - entry.lastAnnouncementTime.getTime();

    if (timeSinceLastAnnouncement >= entry.repeatInterval) {
      announcements.push({
        type: entry.type,
        text: entry.text,
        priority: entry.priority,
        isEmergency: true,
      });

      announcementState.updateEmergencyAnnouncementTime(entry.id, now);
    }
  });

  return announcements;
};

const processFlightAnnouncements = async (flight: Flight, now: Date): Promise<Announcement[]> => {
  const announcements: Announcement[] = [];
  const flightStatus = normalizeFlightStatus(flight.status);

  if (!flightStatus) {
    console.warn(`Unknown flight status: ${flight.status} for flight ${flight.ident}`);
    return announcements;
  }

  // KORIŠTENJE POBOLJŠANE NORMALIZACIJE ZA CANCELLED
  if (flightStatus === 'cancelled') {
    const flightKey = `${flight.Kompanija} ${flight.ident}-${flight.destination?.code || flight.origin.code}`;

    if (!announcementState.getCancelledFlights().has(flightKey)) {
      const template = await fetchAnnouncementTemplate(flight.KompanijaICAO, 'cancelled');
      if (template) {
        const text = template.template
          .replace('{flightNumber}', parseFlightNumber(flight.ident))
          .replace('{destination}', flight.grad)
          .replace('{gate}', flight.gate ? parseCheckInOrGateNumbers(flight.gate) : '')
          .replace('{counters}', flight.checkIn ? parseCheckInOrGateNumbers(flight.checkIn) : '')
          .replace('{origin}', flight.grad)
          .replace('{originCODE}', flight.origin.code);

        announcementState.addCancelledFlight(flightKey, text, flight);
      }
    }

    return announcements;
  }

  const isDepartureAndNoGate = flight.TipLeta.includes('D') && (!flight.gate || flight.gate.trim() === '');
  const isNotOnTimeAndNoGate =
    flightStatus !== 'on-time' &&
    (!flight.gate || flight.gate.trim() === '') &&
    flightStatus !== 'arrived' &&
    flightStatus !== 'landed' &&
    flightStatus !== 'delay' &&
    flightStatus !== 'delayed' &&
    flightStatus !== 'earlier';

  if (isDepartureAndNoGate && isNotOnTimeAndNoGate) {
    console.log(`Skipping announcement for flight ${flight.ident} - No gate assigned and not an arrival or relevant status`);
    return announcements;
  }

  const timeDiff = calculateTimeDifference(flight.scheduled_out, now);
  console.log(`Flight ${flight.ident}: Time Difference = ${timeDiff} minutes, Status = ${flightStatus}`);

  // Type-safe announcement conditions
  const announcementChecks: Array<{
    type: AnnouncementTypeExtended;
    condition: boolean;
  }> = [
    {
      type: 'checkin',
      condition: ['processing', 'checkinopen', 'checkin', 'check in open'].includes(flightStatus) && 
                isInArray(CHECKIN_INTERVALS, timeDiff),
    },
    {
      type: 'boarding',
      condition: flightStatus === 'boarding' && isInArray(BOARDING_INTERVALS, timeDiff),
    },
    {
      type: 'close',
      condition: flightStatus === 'close' && isInArray(CLOSE_INTERVALS, timeDiff),
    },
    {
      type: 'diverted',
      condition: flightStatus === 'diverted' && isInArray(STATUS_INTERVALS, timeDiff),
    },
    {
      type: 'earlier',
      condition: flightStatus === 'earlier' && shouldPlayEarlierAnnouncement(flight),
    },
    {
      type: 'arrived',
      condition: (flightStatus === 'arrived' || flightStatus === 'landed') && shouldPlayArrivalAnnouncement(flight),
    },
    {
      type: 'delay',
      condition: (flightStatus === 'delay' || flightStatus === 'delayed') && shouldPlayDelayAnnouncement(flight),
    },
    {
      type: 'on-time',
      condition: flightStatus === 'on-time' && shouldPlayOnTimeAnnouncement(flight) && flight.TipLeta.includes('I'),
    },
    // AI-enhanced announcements with type-safe conditions
    {
      type: 'ai-delay-reason',
      condition: (flightStatus === 'delay' || flightStatus === 'delayed') && (flight.delay ?? 0) > 30,
    },
    {
      type: 'ai-weather-update',
      condition: (flightStatus === 'delay' || flightStatus === 'delayed') && (flight.delay ?? 0) > 60,
    },
    {
      type: 'ai-passenger-assistance',
      condition: (flightStatus === 'delay' || flightStatus === 'delayed') && (flight.delay ?? 0) > 90,
    },
    {
      type: 'ai-passenger-assistance',
      condition: flightStatus === 'boarding' && isInArray(BOARDING_INTERVALS, timeDiff),
    },
  ];

  for (const check of announcementChecks) {
    const announcement = await processFlightAnnouncement(flight, check.type, check.condition);
    if (announcement) {
      announcements.push(announcement);
    }
  }

  return announcements;
};

const processPeriodicAnnouncements = (now: Date): Announcement[] => {
  const announcements: Announcement[] = [];
  const currentTime = now.getTime();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const totalMinutes = currentHour * 60 + currentMinutes;

  // Konfiguracija sezona i radnog vremena
  const OPERATING_HOURS = {
    // Ljeto: April - Oktober (4-10)
    summer: {
      start: { hour: 6, minute: 30 }, // 06:30
      end: { hour: 19, minute: 0 },   // 19:00
      months: [4, 5, 6, 7, 8, 9, 10] // April - Oktober
    },
    // Zima: Novembar - Mart (11-3)
    winter: {
      start: { hour: 6, minute: 30 }, // 06:30
      end: { hour: 15, minute: 0 },   // 15:00
      months: [11, 12, 1, 2, 3]       // Novembar - Mart
    }
  };

  // Helper function to check if current time is within operating hours
  const isWithinOperatingHours = (): boolean => {
    const currentMonth = now.getMonth() + 1; // January = 1
    
    // Odredi sezonu
    let season;
    if (OPERATING_HOURS.summer.months.includes(currentMonth)) {
      season = OPERATING_HOURS.summer;
    } else if (OPERATING_HOURS.winter.months.includes(currentMonth)) {
      season = OPERATING_HOURS.winter;
    } else {
      // Fallback ako mesec nije u definiciji
      season = OPERATING_HOURS.summer;
    }
    
    // Izračunaj početno i krajnje vrijeme u minutama
    const startMinutes = season.start.hour * 60 + season.start.minute;
    const endMinutes = season.end.hour * 60 + season.end.minute;
    
    // Provjeri da li je trenutno vrijeme unutar radnog vremena
    const isWithin = totalMinutes >= startMinutes && totalMinutes <= endMinutes;
    
    // Logovanje za debugging
    if (!isWithin) {
      const seasonName = season === OPERATING_HOURS.summer ? 'Summer' : 'Winter';
      const startTime = `${season.start.hour.toString().padStart(2, '0')}:${season.start.minute.toString().padStart(2, '0')}`;
      const endTime = `${season.end.hour.toString().padStart(2, '0')}:${season.end.minute.toString().padStart(2, '0')}`;
      const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
      
      console.log(`Outside operating hours: Current: ${currentTimeStr}, Season: ${seasonName}, Operating: ${startTime} - ${endTime}, Month: ${currentMonth}`);
    }
    
    return isWithin;
  };

  // Ako nismo unutar radnog vremena, vrati prazan array
  if (!isWithinOperatingHours()) {
    return announcements;
  }

  // Security announcement - svakih 30 minuta
  const securityTime = announcementState.getLastAnnouncementTime('security');
  const timeSinceSecurityAnnouncement = currentTime - securityTime.getTime();
  
  if (timeSinceSecurityAnnouncement >= THROTTLE_TIME) {
    announcements.push({
      type: 'security',
      text: generateSecurityAnnouncement(),
      priority: 1,
    });
    announcementState.updateLastAnnouncementTime('security', now);
    console.log(`[${now.toLocaleTimeString()}] Security announcement triggered`);
  }

  // Dangerous goods announcement - svakih 30 minuta
  const dangerousGoodsTime = announcementState.getLastAnnouncementTime('dangerous_goods');
  const timeSinceDangerousGoods = currentTime - dangerousGoodsTime.getTime();
  
  if (timeSinceDangerousGoods >= THROTTLE_TIME) {
    announcements.push({
      type: 'dangerous_goods',
      text: generateDangerousGoodsAnnouncement(),
      priority: 1,
    });
    announcementState.updateLastAnnouncementTime('dangerous_goods', now);
    console.log(`[${now.toLocaleTimeString()}] Dangerous goods announcement triggered`);
  }

  // Special assistance announcement - svakih 45 minuta
  const specialAssistanceTime = announcementState.getLastAnnouncementTime('special_assistance');
  const timeSinceSpecialAssistance = currentTime - specialAssistanceTime.getTime();
  
  if (timeSinceSpecialAssistance >= (45 * 60 * 1000)) { // 45 minuta
    announcements.push({
      type: 'special-assistance',
      text: generateSpecialAssistanceAnnouncement(),
      priority: 8,
    });
    announcementState.updateLastAnnouncementTime('special_assistance', now);
    console.log(`[${now.toLocaleTimeString()}] Special assistance announcement triggered`);
  }

  return announcements;
};

const processAnnouncementQueue = async (announcements: Announcement[]): Promise<void> => {
  const sortedAnnouncements = [...announcements].sort((a, b) => (a.priority || 10) - (b.priority || 10));

  for (const announcement of sortedAnnouncements) {
    try {
      await logMp3Play(announcement);

      if (announcement.flight) {
        await processFlightAnnouncementQueue(announcement);
      } else {
        addAnnouncement(announcement.text);
      }
    } catch (error) {
      console.error(`Failed to process announcement ${announcement.type}:`, error);
    }
  }
};

const processFlightAnnouncementQueue = async (announcement: Announcement): Promise<void> => {
  const flight = announcement.flight!;
  const type = flight.TipLeta.includes('I') ? 'ARR' : 'DEP';
  const suffix = getAnnouncementSuffix(announcement.type);
  
  const gates = flight.gate ? flight.gate.split(',').map((g) => g.trim()) : [];

  if (gates.length > 0) {
    for (const gate of gates) {
      const gateInfo = `_Gate${gate}`;
      // Samo suffix + gate (npr: "_1st_Gate3" ili "_Boarding_Gate3")
      const announcementSuffix = `${suffix}${gateInfo}`;

      addAnnouncement(announcement.text, {
        type: type as 'DEP' | 'ARR',
        airline: flight.Kompanija,
        flightNumber: flight.ident,
        announcement: announcementSuffix, // SAMO SUFFIX + GATE
        originCODE: flight.origin.code,
      });
    }
  } else {
    const gateInfo = flight.gate ? `_Gate${flight.gate}` : '';
    // Samo suffix + gate (ili samo suffix ako nema gate)
    const announcementSuffix = flight.gate ? `${suffix}${gateInfo}` : suffix;

    addAnnouncement(announcement.text, {
      type: type as 'DEP' | 'ARR',
      airline: flight.Kompanija,
      flightNumber: flight.ident,
      announcement: announcementSuffix, // SAMO SUFFIX (+ GATE)
      originCODE: flight.origin.code,
    });
  }
};

// export const processAnnouncements = async (flightData: FlightData): Promise<void> => {
//   try {
//     const now = new Date();
//     const announcements: Announcement[] = [];

//     processCancelledFlights(now);

//     // Add emergency announcements
//     announcements.push(...processEmergencyAnnouncements(now));

//     const flightPromises = [...flightData.departures, ...flightData.arrivals].map((flight) =>
//       processFlightAnnouncements(flight, now)
//     );

//     const flightAnnouncementResults = await Promise.allSettled(flightPromises);

//     flightAnnouncementResults.forEach((result, index) => {
//       if (result.status === 'fulfilled') {
//         announcements.push(...result.value);
//       } else {
//         const flight = [...flightData.departures, ...flightData.arrivals][index];
//         console.error(`Failed to process announcements for flight ${flight.ident}:`, result.reason);
//       }
//     });

//     announcements.push(...processPeriodicAnnouncements(now));

//     await processAnnouncementQueue(announcements);

//     if (now.getMinutes() === 0) {
//       announcementState.cleanup();
//     }
//   } catch (error) {
//     console.error('Error in processAnnouncements:', error);
//   }
// };

// Emergency Announcements Management

export const processAnnouncements = async (flightData: FlightData): Promise<void> => {
  try {
    const now = new Date();
    const announcements: Announcement[] = [];

    processCancelledFlights(now);

    // Add emergency announcements
    announcements.push(...processEmergencyAnnouncements(now));

    // LINIJA 1: Zakazi nove on-time letove
    [...flightData.departures, ...flightData.arrivals].forEach(flight => {
      const flightStatus = normalizeFlightStatus(flight.status);
      if (flightStatus === 'on-time' && flight.TipLeta.includes('I')) {
        scheduleAutoOnTimeAnnouncement(flight);
      }
    });

    const flightPromises = [...flightData.departures, ...flightData.arrivals].map((flight) =>
      processFlightAnnouncements(flight, now)
    );

    const flightAnnouncementResults = await Promise.allSettled(flightPromises);

    flightAnnouncementResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        announcements.push(...result.value);
      } else {
        const flight = [...flightData.departures, ...flightData.arrivals][index];
        console.error(`Failed to process announcements for flight ${flight.ident}:`, result.reason);
      }
    });

    // LINIJA 2: Generisi automatske on-time objave
    announcements.push(...processAutoOnTimeAnnouncements());

    announcements.push(...processPeriodicAnnouncements(now));

    await processAnnouncementQueue(announcements);

    if (now.getMinutes() === 0) {
      announcementState.cleanup();
      // LINIJA 3: Cleanup automatskih objava
      cleanupAutoOnTimeAnnouncements();
    }
  } catch (error) {
    console.error('Error in processAnnouncements:', error);
  }
};

export const emergencyAnnouncements = {
  // Critical security alerts
  addSecurityAlert: (alert: EmergencyAlert): string => {
    const id = `security-alert-${Date.now()}`;
    const text = generateEmergencyAlert(alert);
    
    announcementState.addEmergencyAnnouncement(
      id,
      'emergency-alert',
      text,
      0, // Highest priority
      EMERGENCY_ANNOUNCEMENT_INTERVAL,
      10 // Repeat 10 times
    );
    
    return id;
  },

  // Emergency evacuation procedures
  addEvacuationProcedure: (procedure: EvacuationProcedure): string => {
    const id = `evacuation-${Date.now()}`;
    const text = generateEvacuationProcedure(procedure);
    
    announcementState.addEmergencyAnnouncement(
      id,
      'evacuation-procedure',
      text,
      0, // Highest priority
      EMERGENCY_ANNOUNCEMENT_INTERVAL,
      15 // Repeat 15 times for evacuation
    );
    
    return id;
  },

  // Security level changes
  addSecurityLevelChange: (change: SecurityLevelChange): string => {
    const id = `security-level-${Date.now()}`;
    const text = generateSecurityLevelChange(change);
    
    announcementState.addEmergencyAnnouncement(
      id,
      'security-level-change',
      text,
      1, // High priority
      SECURITY_LEVEL_CHANGE_INTERVAL,
      5 // Repeat 5 times
    );
    
    return id;
  },

  // Lost and found announcements
  addLostFound: (item: LostFoundAnnouncement): string => {
    const id = `lost-found-${Date.now()}`;
    const text = generateLostFoundAnnouncement(item);
    
    announcementState.addEmergencyAnnouncement(
      id,
      'lost-found',
      text,
      4, // Medium priority
      10 * 60 * 1000, // 10 minutes
      3 // Repeat 3 times
    );
    
    return id;
  },

  // Manual control methods
  removeEmergencyAnnouncement: (id: string): void => {
    announcementState.removeEmergencyAnnouncement(id);
  },

  deactivateEmergencyAnnouncement: (id: string): void => {
    announcementState.deactivateEmergencyAnnouncement(id);
  },

  clearAllEmergencyAnnouncements: (): void => {
    announcementState.clearAllEmergencyAnnouncements();
  },

  getActiveEmergencyAnnouncements: (): Array<{
    id: string;
    type: string;
    text: string;
    priority: number;
    isActive: boolean;
    currentRepeats: number;
    maxRepeats: number;
  }> => {
    const emergencies = announcementState.getEmergencyAnnouncements();
    return Array.from(emergencies.entries()).map(([id, entry]) => ({
      id,
      type: entry.type,
      text: entry.text,
      priority: entry.priority,
      isActive: entry.isActive,
      currentRepeats: entry.currentRepeats,
      maxRepeats: entry.maxRepeats,
    }));
  },
};

export const manageCancelledFlights = {
  addCancelledFlight: (flightNumber: string, destination: string, airline: string, originCode: string) => {
    const flightKey = `${airline} ${flightNumber}-${destination}`;
    const mockFlight: Flight = {
      ident: flightNumber,
      Kompanija: airline,
      KompanijaICAO: airline,
      KompanijaNaziv: airline,
      grad: destination,
      origin: { code: originCode },
      destination: { code: destination },
      scheduled_out: '',
      estimated_out: '',
      actual_out: '',
      status: 'cancelled',
      gate: '',
      checkIn: '',
      TipLeta: 'D',
      delay: undefined,
    };

    const text = `Flight ${flightNumber} to ${destination} has been cancelled. Passengers should contact their airline for rebooking assistance.`;
    announcementState.addCancelledFlight(flightKey, text, mockFlight);
  },

  removeCancelledFlight: (flightNumber: string, destination: string, airline: string) => {
    const flightKey = `${airline} ${flightNumber}-${destination}`;
    announcementState.removeCancelledFlight(flightKey);
  },

  clearAllCancelledFlights: () => {
    announcementState.clearAllCancelledFlights();
  },

  getCancelledFlights: () => {
    const flights = announcementState.getCancelledFlights();
    return Array.from(flights.entries()).map(([key, entry]) => ({
      flightKey: key,
      flightNumber: entry.flight.ident,
      destination: entry.flight.grad,
      airline: entry.flight.Kompanija,
      text: entry.text,
      lastAnnouncementTime: entry.lastAnnouncementTime,
      addedToAudioManager: entry.addedToAudioManager,
    }));
  },
};

// lib/announcementQueue.ts - DODAJTE OVO NA KRAJ FAJLA

// Globalni objekat za praćenje automatskih on-time objava
const autoOnTimeAnnouncements: Map<string, {
  flight: Flight;
  lastAnnouncementTime: Date;
  announcementCount: number;
  isLanded: boolean;
}> = new Map();

// Interval za automatske objave (30 minuta)
const AUTO_ON_TIME_INTERVAL = 30 * 60 * 1000; // 30 minuta u milisekundama

// Dodaj let za automatsko praćenje
export function scheduleAutoOnTimeAnnouncement(flight: Flight): void {
  const flightKey = `${flight.Kompanija} ${flight.ident}`;
  
  // Proveri da li je let već zakazan
  if (autoOnTimeAnnouncements.has(flightKey)) {
    return;
  }
  
  // Proveri da li je let na vreme i da li je arrival (sletanje)
  const status = normalizeFlightStatus(flight.status);
  const isOnTime = status === 'on-time';
  const isArrival = flight.TipLeta.includes('I');
  
  if (isOnTime && isArrival) {
    autoOnTimeAnnouncements.set(flightKey, {
      flight,
      lastAnnouncementTime: new Date(0), // Nikad nije objavljeno
      announcementCount: 0,
      isLanded: false
    });
    
    console.log(`Scheduled auto on-time announcements for: ${flightKey}`);
  }
}

// Ukloni let iz automatskog praćenja
export function removeAutoOnTimeAnnouncement(flightKey: string): void {
  autoOnTimeAnnouncements.delete(flightKey);
  console.log(`Removed auto on-time announcements for: ${flightKey}`);
}

// Proveri i generiši automatske objave - pozivajte ovo iz glavnog procesa
export function processAutoOnTimeAnnouncements(): Announcement[] {
  const announcements: Announcement[] = [];
  const now = new Date();
  
  // REŠENJE: Koristimo Array.from() umesto direktne iteracije
  const entries = Array.from(autoOnTimeAnnouncements.entries());
  
  for (const [flightKey, data] of entries) {
    // Proveri da li je let sleteo
    if (data.isLanded) continue;
    
    // Proveri trenutni status
    const currentStatus = normalizeFlightStatus(data.flight.status);
    const isLanded = currentStatus === 'arrived' || currentStatus === 'landed';
    
    if (isLanded) {
      data.isLanded = true;
      continue;
    }
    
    // Proveri da li je prošlo 30 minuta od zadnje objave
    const timeSinceLast = now.getTime() - data.lastAnnouncementTime.getTime();
    
    if (timeSinceLast >= AUTO_ON_TIME_INTERVAL) {
      // Generiši objavu
      const announcement = {
        type: 'on-time' as AnnouncementTypeExtended,
        text: generateDefaultOnTimeAnnouncement(data.flight),
        flight: data.flight,
        priority: 5
      };
      
      announcements.push(announcement);
      
      // Ažuriraj podatke
      data.lastAnnouncementTime = now;
      data.announcementCount++;
      
      console.log(`Auto-generated on-time announcement for: ${flightKey} (#${data.announcementCount})`);
    }
  }
  
  return announcements;
}

// Cleanup starih letova
export function cleanupAutoOnTimeAnnouncements(): void {
  const cutoffTime = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 sati
  
  const toRemove: string[] = [];
  
  // REŠENJE: Koristimo forEach umesto for...of
  autoOnTimeAnnouncements.forEach((data, flightKey) => {
    // Ukloni ako je sleteo i prošlo je 2 sata
    if (data.isLanded && data.lastAnnouncementTime.getTime() > 0) {
      const timeSinceLanded = new Date().getTime() - data.lastAnnouncementTime.getTime();
      if (timeSinceLanded > 2 * 60 * 60 * 1000) {
        toRemove.push(flightKey);
      }
    }
    // Ili ukloni ako nema objava u 6 sati
    else if (data.lastAnnouncementTime < cutoffTime && data.announcementCount > 0) {
      toRemove.push(flightKey);
    }
  });
  
  toRemove.forEach(key => autoOnTimeAnnouncements.delete(key));
  
  if (toRemove.length > 0) {
    console.log(`Cleaned up ${toRemove.length} auto on-time announcements`);
  }
}

// Helper funkcija za dobijanje svih zakazanih letova
export function getAutoOnTimeScheduledFlights() {
  // REŠENJE: Koristimo Array.from()
  return Array.from(autoOnTimeAnnouncements.entries()).map(([key, data]) => ({
    flightKey: key,
    flightNumber: data.flight.ident,
    airline: data.flight.KompanijaNaziv,
    destination: data.flight.grad,
    announcementCount: data.announcementCount,
    lastAnnouncementTime: data.lastAnnouncementTime,
    isLanded: data.isLanded
  }));
}
export {
  generateDefaultOnTimeAnnouncement,
  generateDefaultDelayAnnouncement,
  generateDefaultEarlierAnnouncement
};



export type { 
  Announcement, 
  AnnouncementTypeExtended, 
  FlightStatus, 
  CancelledFlightEntry,
  EmergencyAlert,
  EvacuationProcedure,
  SecurityLevelChange,
  LostFoundAnnouncement,
  
};