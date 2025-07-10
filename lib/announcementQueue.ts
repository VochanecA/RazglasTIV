'use client';

import { FlightData, Flight } from './flightTTS';
import { addAnnouncement, addCancelledFlight, removeCancelledFlight, clearCancelledFlights } from './audioManager';
import { createMp3Play } from './db/queries';
import { AnnouncementType } from './db/schema';

// Constants
const THROTTLE_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds
const ARRIVAL_ANNOUNCEMENT_WINDOW = 15; // minutes
const MIN_ANNOUNCEMENT_INTERVAL = 5; // minutes
const MAX_ARRIVAL_ANNOUNCEMENTS = 3;
const CANCELLED_FLIGHT_ANNOUNCEMENT_INTERVAL = 30 * 60 * 1000; // 30 minutes for cancelled flights

// Check-in timing intervals (in minutes before departure)
const CHECKIN_INTERVALS = [90, 75, 70, 60, 50, 40] as const;
const BOARDING_INTERVALS = [30, 25, 20, 15] as const;
const CLOSE_INTERVALS = [10, 7, 5] as const;
const STATUS_INTERVALS = [90, 80, 70, 60, 50, 40, 30, 20, 10] as const;
const EARLIER_INTERVALS = [90, 70, 60, 40, 30] as const;

// Enhanced types
type AnnouncementTypeExtended = 
  | 'security' 
  | 'special-assistance' 
  | 'flight' 
  | 'boarding' 
  | 'delay' 
  | 'earlier' 
  | 'cancelled' 
  | 'diverted' 
  | 'checkin' 
  | 'close' 
  | 'arrived' 
  | 'dangerous_goods';

type FlightStatus = 
  | 'processing' 
  | 'checkinopen' 
  | 'checkin' 
  | 'check in open' 
  | 'boarding' 
  | 'close' 
  | 'arrived' 
  | 'diverted' 
  | 'cancelled' 
  | 'earlier';

interface Announcement {
  type: AnnouncementTypeExtended;
  text: string;
  flight?: Flight;
  priority?: number; // Add priority for announcement ordering
}

interface ArrivalLogEntry {
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

interface AnnouncementTemplate {
  template: string;
}

// State management
class AnnouncementState {
  private arrivalAnnouncementLog: Map<string, ArrivalLogEntry> = new Map();
  private cancelledFlights: Map<string, CancelledFlightEntry> = new Map();
  private lastAnnouncementTimes: Record<string, Date> = {
    security: new Date(0),
    dangerous_goods: new Date(0),
    special_assistance: new Date(0),
  };
  private processedAnnouncements: Set<string> = new Set();

  getArrivalLog(flightKey: string): ArrivalLogEntry {
    if (!this.arrivalAnnouncementLog.has(flightKey)) {
      this.arrivalAnnouncementLog.set(flightKey, {
        count: 0,
        lastAnnouncementTime: new Date(0),
        flightKey
      });
    }
    return this.arrivalAnnouncementLog.get(flightKey)!;
  }

  updateArrivalLog(flightKey: string, updates: Partial<ArrivalLogEntry>): void {
    const log = this.getArrivalLog(flightKey);
    Object.assign(log, updates);
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

  // Cancelled flight management
  addCancelledFlight(flightKey: string, text: string, flight: Flight): void {
    const entry: CancelledFlightEntry = {
      flightKey,
      text,
      flight,
      lastAnnouncementTime: new Date(0),
      addedToAudioManager: false
    };
    this.cancelledFlights.set(flightKey, entry);
    console.log(`Added cancelled flight to queue: ${flightKey}`);
  }

  removeCancelledFlight(flightKey: string): void {
    const entry = this.cancelledFlights.get(flightKey);
    if (entry && entry.addedToAudioManager) {
      // Remove from audio manager
      removeCancelledFlight(entry.text);
    }
    this.cancelledFlights.delete(flightKey);
    console.log(`Removed cancelled flight from queue: ${flightKey}`);
  }

  getCancelledFlights(): Map<string, CancelledFlightEntry> {
    return this.cancelledFlights;
  }

  clearAllCancelledFlights(): void {
    // Remove all from audio manager first
    this.cancelledFlights.forEach(entry => {
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

  // Clean up old entries periodically
  cleanup(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const keysToDelete: string[] = [];
    
    // Clean up arrival logs
    this.arrivalAnnouncementLog.forEach((entry, key) => {
      if (entry.lastAnnouncementTime < cutoffTime) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.arrivalAnnouncementLog.delete(key);
    });

    // Clean up cancelled flights (keep them longer - 12 hours)
    const cancelledCutoffTime = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const cancelledKeysToDelete: string[] = [];
    
    this.cancelledFlights.forEach((entry, key) => {
      if (entry.lastAnnouncementTime < cancelledCutoffTime && entry.lastAnnouncementTime.getTime() > 0) {
        cancelledKeysToDelete.push(key);
      }
    });
    
    cancelledKeysToDelete.forEach(key => {
      this.removeCancelledFlight(key);
    });
  }
}

// Singleton instance
const announcementState = new AnnouncementState();

// Utility functions
const parseTime = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const parseCheckInOrGateNumbers = (input: string): string => {
  const numbers = input.split(',')
    .map(num => parseInt(num.trim(), 10))
    .filter(num => !isNaN(num));

  if (numbers.length === 0) return "";
  if (numbers.length === 1) return numbers[0].toString();

  const lastNumber = numbers.pop()!;
  return `${numbers.join(', ')} and ${lastNumber}`;
};

const parseFlightNumber = (flightNumber: string): string => {
  const numberToWords: Record<string, string> = {
    '0': 'zero', '1': 'one', '2': 'two', '3': 'three',
    '4': 'four', '5': 'five', '6': 'six', '7': 'seven',
    '8': 'eight', '9': 'nine'
  };
  
  return flightNumber.split('').map(digit => numberToWords[digit] || digit).join(' ');
};

const getAnnouncementSuffix = (type: AnnouncementTypeExtended): string => {
  const suffixMap: Record<AnnouncementTypeExtended, string> = {
    checkin: '_1st',
    boarding: '_Boarding',
    arrived: '_Arrived',
    cancelled: '_Cancelled',
    diverted: '_Diverted',
    earlier: '_Earlier',
    close: '_Close',
    security: '',
    'special-assistance': '',
    flight: '',
    delay: '',
    dangerous_goods: '',
  };
  
  return suffixMap[type] || '';
};

const normalizeFlightStatus = (status: string): FlightStatus | null => {
  const statusMap: Record<string, FlightStatus> = {
    'processing': 'processing',
    'checkinopen': 'checkinopen',
    'checkin': 'checkin',
    'check in open': 'check in open',
    'boarding': 'boarding',
    'close': 'close',
    'arrived': 'arrived',
    'diverted': 'diverted',
    'cancelled': 'cancelled',
    'earlier': 'earlier',
  };
  
  return statusMap[status.toLowerCase()] || null;
};

// Announcement generators
const generateSecurityAnnouncement = (): string => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `Attention please: Do not leave baggage unattended; it will be removed for security and may be destroyed. Thank you. Local time: ${currentTime}.`;
};

const generateDangerousGoodsAnnouncement = (): string => {
  return `Attention: Dangerous goods must be prepared by qualified personnel or meet exemptions. Lithium batteries allowed only in cabin; spare batteries not in checked baggage. Smart luggage with non-removable batteries >0.3g lithium or 2.7Wh is prohibited. See iata.org/en/publications/dgr for details. Thank you.`;
};

const generateSpecialAssistanceAnnouncement = (): string => {
  return "Dear passengers, for special assistance, please notify staff or use help points in the terminal.";
};

// Enhanced logging function
const logMp3Play = async (announcement: Announcement): Promise<void> => {
  try {
    await createMp3Play({
      flightIcaoCode: announcement.flight?.KompanijaICAO || 'UNKNOWN',
      flightNumber: announcement.flight?.ident || '',
      destinationCode: announcement.flight?.destination?.code || '',
      callType: announcement.type,
      filename: `${announcement.type}_announcement.mp3`,
      gate: announcement.flight?.gate || undefined
    });
  } catch (error) {
    console.error(`Failed to log MP3 play for announcement ${announcement.type}:`, error);
  }
};

// Enhanced arrival announcement logic
const shouldPlayArrivalAnnouncement = (flight: Flight): boolean => {
  const flightKey = `${flight.Kompanija} ${flight.ident}-${flight.origin.code}`;
  const now = new Date();
  
  const arrivalTime = parseTime(flight.scheduled_out);
  const timeSinceArrival = (now.getTime() - arrivalTime.getTime()) / (1000 * 60);

  // Don't announce if more than 15 minutes have passed
  if (timeSinceArrival > ARRIVAL_ANNOUNCEMENT_WINDOW) return false;

  const log = announcementState.getArrivalLog(flightKey);

  // First announcement
  if (log.count === 0) {
    announcementState.updateArrivalLog(flightKey, {
      count: 1,
      lastAnnouncementTime: now
    });
    return true;
  }

  // Subsequent announcements
  const minutesSinceLastAnnouncement = (now.getTime() - log.lastAnnouncementTime.getTime()) / (1000 * 60);
  
  if (log.count < MAX_ARRIVAL_ANNOUNCEMENTS && minutesSinceLastAnnouncement >= MIN_ANNOUNCEMENT_INTERVAL) {
    announcementState.updateArrivalLog(flightKey, {
      count: log.count + 1,
      lastAnnouncementTime: now
    });
    return true;
  }
  
  return false;
};

// Enhanced template fetching with error handling
const fetchAnnouncementTemplate = async (airlineCode: string, type: string): Promise<AnnouncementTemplate | null> => {
  try {
    const response = await fetch(`/api/getAnnouncements?airlineCode=${airlineCode}&type=${type}`);
    if (!response.ok) {
      console.warn(`Failed to fetch announcement template for ${airlineCode} ${type}: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching announcement template for ${airlineCode} ${type}:`, error);
    return null;
  }
};

// Enhanced announcement processing
const processFlightAnnouncement = async (
  flight: Flight,
  type: AnnouncementTypeExtended,
  condition: boolean
): Promise<Announcement | null> => {
  if (!condition) return null;

  const announcementKey = `${flight.ident}-${type}`;
  if (announcementState.hasProcessedAnnouncement(announcementKey)) {
    return null;
  }

  announcementState.markAnnouncementProcessed(announcementKey);

  const template = await fetchAnnouncementTemplate(flight.KompanijaICAO, type);
  if (!template) return null;

  const text = template.template
    .replace('{flightNumber}', parseFlightNumber(flight.ident))
    .replace('{destination}', flight.grad)
    .replace('{gate}', flight.gate ? parseCheckInOrGateNumbers(flight.gate) : '')
    .replace('{counters}', flight.checkIn ? parseCheckInOrGateNumbers(flight.checkIn) : '')
    .replace('{origin}', flight.grad)
    .replace('{originCODE}', flight.origin.code);

  return {
    type,
    text,
    flight,
    priority: getPriorityForAnnouncementType(type)
  };
};

// Priority system for announcements
const getPriorityForAnnouncementType = (type: AnnouncementTypeExtended): number => {
  const priorityMap: Record<AnnouncementTypeExtended, number> = {
    security: 1,
    dangerous_goods: 1,
    cancelled: 2,
    diverted: 2,
    close: 3,
    boarding: 4,
    earlier: 5,
    checkin: 6,
    arrived: 7,
    'special-assistance': 8,
    flight: 9,
    delay: 9,
  };
  
  return priorityMap[type] || 10;
};

// Enhanced time calculation
const calculateTimeDifference = (scheduledTime: string, currentTime: Date): number => {
  const [scheduledHours, scheduledMinutes] = scheduledTime.split(':').map(Number);
  const scheduledTimeInMinutes = scheduledHours * 60 + scheduledMinutes;
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  
  return scheduledTimeInMinutes - currentMinutes;
};

// Process cancelled flights and manage their announcements
const processCancelledFlights = (now: Date): void => {
  const cancelledFlights = announcementState.getCancelledFlights();
  
  cancelledFlights.forEach((entry, flightKey) => {
    const timeSinceLastAnnouncement = now.getTime() - entry.lastAnnouncementTime.getTime();
    
    // If this is a new cancelled flight or it's been 30 minutes since last announcement
    if (!entry.addedToAudioManager || timeSinceLastAnnouncement >= CANCELLED_FLIGHT_ANNOUNCEMENT_INTERVAL) {
      const audioManagerData = {
        type: entry.flight.TipLeta.includes('I') ? 'ARR' as const : 'DEP' as const,
        airline: entry.flight.Kompanija,
        flightNumber: entry.flight.ident,
        announcement: 'cancelled',
        originCODE: entry.flight.origin.code,
      };

      // Add to audio manager for recurring announcements
      addCancelledFlight(entry.text, audioManagerData);
      
      // Update state
      announcementState.setCancelledFlightAddedToAudioManager(flightKey, true);
      announcementState.updateCancelledFlightAnnouncementTime(flightKey, now);
      
      console.log(`Added cancelled flight to audio manager: ${flightKey}`);
    }
  });
};

// Enhanced flight processing
const processFlightAnnouncements = async (flight: Flight, now: Date): Promise<Announcement[]> => {
  const announcements: Announcement[] = [];
  const flightStatus = normalizeFlightStatus(flight.status);
  
  if (!flightStatus) {
    console.warn(`Unknown flight status: ${flight.status} for flight ${flight.ident}`);
    return announcements;
  }

  // Handle cancelled flights separately
  if (flightStatus === 'cancelled') {
    const flightKey = `${flight.Kompanija} ${flight.ident}-${flight.destination?.code || flight.origin.code}`;
    
    // Check if this cancelled flight is already being tracked
    if (!announcementState.getCancelledFlights().has(flightKey)) {
      // Fetch the cancellation announcement template
      const template = await fetchAnnouncementTemplate(flight.KompanijaICAO, 'cancelled');
      if (template) {
        const text = template.template
          .replace('{flightNumber}', parseFlightNumber(flight.ident))
          .replace('{destination}', flight.grad)
          .replace('{gate}', flight.gate ? parseCheckInOrGateNumbers(flight.gate) : '')
          .replace('{counters}', flight.checkIn ? parseCheckInOrGateNumbers(flight.checkIn) : '')
          .replace('{origin}', flight.grad)
          .replace('{originCODE}', flight.origin.code);

        // Add to cancelled flights tracking
        announcementState.addCancelledFlight(flightKey, text, flight);
      }
    }
    
    return announcements; // Don't process other announcement types for cancelled flights
  }

  // Skip if no gate assigned (except for arrived flights)
  if (flightStatus !== 'arrived' && (!flight.gate || flight.gate.trim() === '')) {
    console.log(`Skipping announcement for flight ${flight.ident} - No gate assigned`);
    return announcements;
  }

  const timeDiff = calculateTimeDifference(flight.scheduled_out, now);
  console.log(`Flight ${flight.ident}: Time Difference = ${timeDiff} minutes, Status = ${flightStatus}`);

  // Process different announcement types based on status and timing
  const announcementChecks = [
    {
      type: 'checkin' as const,
      condition: ['processing', 'checkinopen', 'checkin', 'check in open'].includes(flightStatus) && 
                 CHECKIN_INTERVALS.includes(timeDiff as any)
    },
    {
      type: 'boarding' as const,
      condition: flightStatus === 'boarding' && BOARDING_INTERVALS.includes(timeDiff as any)
    },
    {
      type: 'close' as const,
      condition: flightStatus === 'close' && CLOSE_INTERVALS.includes(timeDiff as any)
    },
    {
      type: 'diverted' as const,
      condition: flightStatus === 'diverted' && STATUS_INTERVALS.includes(timeDiff as any)
    },
    {
      type: 'earlier' as const,
      condition: flightStatus === 'earlier' && EARLIER_INTERVALS.includes(timeDiff as any)
    },
    {
      type: 'arrived' as const,
      condition: flightStatus === 'arrived' && shouldPlayArrivalAnnouncement(flight)
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

// Enhanced periodic announcements
const processPeriodicAnnouncements = (now: Date): Announcement[] => {
  const announcements: Announcement[] = [];
  const currentMinutes = now.getMinutes();
  
  // Security and dangerous goods announcements every 30 minutes
  if (currentMinutes % 30 === 0) {
    const securityTime = announcementState.getLastAnnouncementTime('security');
    if (now.getTime() - securityTime.getTime() > THROTTLE_TIME) {
      announcements.push({
        type: 'security',
        text: generateSecurityAnnouncement(),
        priority: 1
      });
      announcementState.updateLastAnnouncementTime('security', now);
    }

    const dangerousGoodsTime = announcementState.getLastAnnouncementTime('dangerous_goods');
    if (now.getTime() - dangerousGoodsTime.getTime() > THROTTLE_TIME) {
      announcements.push({
        type: 'dangerous_goods',
        text: generateDangerousGoodsAnnouncement(),
        priority: 1
      });
      announcementState.updateLastAnnouncementTime('dangerous_goods', now);
    }
  }

  // Special assistance announcements every 45 minutes
  if (currentMinutes % 45 === 0) {
    const specialAssistanceTime = announcementState.getLastAnnouncementTime('special_assistance');
    if (now.getTime() - specialAssistanceTime.getTime() > THROTTLE_TIME) {
      announcements.push({
        type: 'special-assistance',
        text: generateSpecialAssistanceAnnouncement(),
        priority: 8
      });
      announcementState.updateLastAnnouncementTime('special_assistance', now);
    }
  }

  return announcements;
};

// Enhanced announcement processing with better error handling
const processAnnouncementQueue = async (announcements: Announcement[]): Promise<void> => {
  // Sort announcements by priority
  const sortedAnnouncements = [...announcements].sort((a, b) => 
    (a.priority || 10) - (b.priority || 10)
  );

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

// Enhanced flight announcement queue processing
const processFlightAnnouncementQueue = async (announcement: Announcement): Promise<void> => {
  const flight = announcement.flight!;
  const type = flight.TipLeta.includes('I') ? 'ARR' : 'DEP';
  const suffix = getAnnouncementSuffix(announcement.type);
  const destinationCode = type === 'DEP' ? flight.destination?.code : flight.origin.code;

  // Handle multiple gates
  const gates = flight.gate ? flight.gate.split(',').map(g => g.trim()) : [];

  if (gates.length > 0) {
    for (const gate of gates) {
      const gateInfo = `_Gate${gate}`;
      const announcementId = `${flight.Kompanija}${flight.ident}${destinationCode}${type}${suffix}${gateInfo}`;

      addAnnouncement(announcement.text, {
        type: type as 'DEP' | 'ARR',
        airline: flight.Kompanija,
        flightNumber: flight.ident,
        announcement: announcementId,
        originCODE: flight.origin.code,
      });
    }
  } else {
    const gateInfo = flight.gate ? `_Gate${flight.gate}` : '';
    const announcementId = `${flight.Kompanija}${flight.ident}${destinationCode}${type}${suffix}${gateInfo}`;

    addAnnouncement(announcement.text, {
      type: type as 'DEP' | 'ARR',
      airline: flight.Kompanija,
      flightNumber: flight.ident,
      announcement: announcementId,
      originCODE: flight.origin.code,
    });
  }
};

// Main export function with enhanced error handling
export const processAnnouncements = async (flightData: FlightData): Promise<void> => {
  try {
    const now = new Date();
    const announcements: Announcement[] = [];

    // Process cancelled flights first
    processCancelledFlights(now);

    // Process all flights
    const flightPromises = [...flightData.departures, ...flightData.arrivals].map(flight => 
      processFlightAnnouncements(flight, now)
    );

    const flightAnnouncementResults = await Promise.allSettled(flightPromises);
    
    // Collect successful results and log errors
    flightAnnouncementResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        announcements.push(...result.value);
      } else {
        const flight = [...flightData.departures, ...flightData.arrivals][index];
        console.error(`Failed to process announcements for flight ${flight.ident}:`, result.reason);
      }
    });

    // Add periodic announcements
    announcements.push(...processPeriodicAnnouncements(now));

    // Process announcement queue
    await processAnnouncementQueue(announcements);

    // Cleanup old entries periodically (every hour)
    if (now.getMinutes() === 0) {
      announcementState.cleanup();
    }

  } catch (error) {
    console.error('Error in processAnnouncements:', error);
  }
};

// Public API functions for managing cancelled flights
export const manageCancelledFlights = {
  /**
   * Manually add a cancelled flight for recurring announcements
   */
  addCancelledFlight: (flightNumber: string, destination: string, airline: string, originCode: string) => {
    const flightKey = `${airline} ${flightNumber}-${destination}`;
    const mockFlight: Flight = {
      ident: flightNumber,
      Kompanija: airline,
      KompanijaICAO: airline,
      KompanijaNaziv: airline, // Added missing property
      grad: destination,
      origin: { code: originCode },
      destination: { code: destination },
      scheduled_out: '',
      estimated_out: '', // Added missing property
      actual_out: '', // Added missing property
      status: 'cancelled',
      gate: '',
      checkIn: '',
      TipLeta: 'D'
    };
    
    const text = `Flight ${flightNumber} to ${destination} has been cancelled. Passengers should contact their airline for rebooking assistance.`;
    announcementState.addCancelledFlight(flightKey, text, mockFlight);
  },

  /**
   * Remove a cancelled flight from recurring announcements
   */
  removeCancelledFlight: (flightNumber: string, destination: string, airline: string) => {
    const flightKey = `${airline} ${flightNumber}-${destination}`;
    announcementState.removeCancelledFlight(flightKey);
  },

  /**
   * Clear all cancelled flights
   */
  clearAllCancelledFlights: () => {
    announcementState.clearAllCancelledFlights();
  },

  /**
   * Get list of currently tracked cancelled flights
   */
  getCancelledFlights: () => {
    const flights = announcementState.getCancelledFlights();
    return Array.from(flights.entries()).map(([key, entry]) => ({
      flightKey: key,
      flightNumber: entry.flight.ident,
      destination: entry.flight.grad,
      airline: entry.flight.Kompanija,
      text: entry.text,
      lastAnnouncementTime: entry.lastAnnouncementTime,
      addedToAudioManager: entry.addedToAudioManager
    }));
  }
};

// Export types for external use
export type { Announcement, AnnouncementTypeExtended, FlightStatus, CancelledFlightEntry };