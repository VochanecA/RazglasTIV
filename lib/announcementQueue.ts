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
const DELAY_ANNOUNCEMENT_INTERVAL = 30 * 60 * 1000; // 30 minutes for delayed flights
const MAX_DELAY_ANNOUNCEMENTS = 6; // Maximum number of delay announcements
const EARLIER_ANNOUNCEMENT_INTERVAL = 10 * 60 * 1000; // 10 minutes for earlier flights
const MAX_EARLIER_ANNOUNCEMENTS = 6; // Maximum number of earlier announcements
const ON_TIME_ANNOUNCEMENT_INTERVAL = 60 * 60 * 1000; // 60 minutes for on-time flights
const MAX_ON_TIME_ANNOUNCEMENTS = 2; // Maximum number of on-time announcements

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
  | 'dangerous_goods'
  | 'on-time'; // Added 'on-time'

type FlightStatus =
  | 'processing'
  | 'checkinopen'
  | 'checkin'
  | 'check in open'
  | 'boarding'
  | 'close'
  | 'delay'
  | 'delayed'
  | 'arrived'
  | 'landed'
  | 'diverted'
  | 'cancelled'
  | 'earlier'
  | 'on-time' // Added 'on-time'
  | 'on time' // Added variant
  | 'On time' // Added variant
  | 'ON TIME'; // Added variant

interface Announcement {
  type: AnnouncementTypeExtended;
  text: string;
  flight?: Flight;
  priority?: number;
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

interface OnTimeLogEntry { // New interface for on-time announcements
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
  private delayAnnouncementLog: Map<string, DelayLogEntry> = new Map();
  private earlierAnnouncementLog: Map<string, EarlierLogEntry> = new Map();
  private onTimeAnnouncementLog: Map<string, OnTimeLogEntry> = new Map(); // New log for on-time
  private cancelledFlights: Map<string, CancelledFlightEntry> = new Map();
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
        flightKey
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
        initialDelayStatusTime: new Date()
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
        initialEarlierStatusTime: new Date()
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

  getOnTimeLog(flightKey: string): OnTimeLogEntry { // New method to get on-time log
    if (!this.onTimeAnnouncementLog.has(flightKey)) {
      this.onTimeAnnouncementLog.set(flightKey, {
        count: 0,
        lastAnnouncementTime: new Date(0),
        flightKey
      });
    }
    return this.onTimeAnnouncementLog.get(flightKey)!;
  }

  updateOnTimeLog(flightKey: string, updates: Partial<OnTimeLogEntry>): void { // New method to update on-time log
    const log = this.getOnTimeLog(flightKey);
    Object.assign(log, updates);
  }

  clearOnTimeLog(flightKey: string): void { // New method to clear on-time log
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

  getPreviousFlightStatus(flightKey: string): string | null {
    return this.previousFlightStatuses.get(flightKey) || null;
  }

  setPreviousFlightStatus(flightKey: string, status: string): void {
    this.previousFlightStatuses.set(flightKey, status);
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
      removeCancelledFlight(entry.text);
    }
    this.cancelledFlights.delete(flightKey);
    console.log(`Removed cancelled flight from queue: ${flightKey}`);
  }

  getCancelledFlights(): Map<string, CancelledFlightEntry> {
    return this.cancelledFlights;
  }

  clearAllCancelledFlights(): void {
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

  cleanup(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Clean up various announcement logs
    const logsToClean = [
      this.arrivalAnnouncementLog,
      this.delayAnnouncementLog,
      this.earlierAnnouncementLog,
      this.onTimeAnnouncementLog, // Added on-time log to cleanup
    ];

    logsToClean.forEach(logMap => {
      const keysToDelete: string[] = [];
      logMap.forEach((entry, key) => {
        if (entry.lastAnnouncementTime < cutoffTime) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => logMap.delete(key));
    });

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

    const statusCutoffTime = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const statusKeysToDelete: string[] = [];

    this.previousFlightStatuses.forEach((_, key) => {
      const delayEntry = this.delayAnnouncementLog.get(key);
      const earlierEntry = this.earlierAnnouncementLog.get(key);
      const onTimeEntry = this.onTimeAnnouncementLog.get(key); // Get on-time entry

      if ((!delayEntry || delayEntry.lastAnnouncementTime < statusCutoffTime) &&
        (!earlierEntry || earlierEntry.lastAnnouncementTime < statusCutoffTime) &&
        (!onTimeEntry || onTimeEntry.lastAnnouncementTime < statusCutoffTime) // Check on-time entry
      ) {
        statusKeysToDelete.push(key);
      }
    });

    statusKeysToDelete.forEach(key => {
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
  const numbers = input.split(',')
    .map(num => parseInt(num.trim(), 10))
    .filter(num => !isNaN(num));

  if (numbers.length === 0) return "";
  if (numbers.length === 1) return numbers[0].toString();

  const lastNumber = numbers.pop()!;
  return `${numbers.join(', ')} and ${lastNumber}`;
};

const parseFlightNumber = (flightNumber: string): string => {
  // Remove any non-alphanumeric characters and trim whitespace
  const cleanedFlightNumber = flightNumber.replace(/[^a-zA-Z0-9]/g, '').trim();

  const numberToWords: Record<string, string> = {
    '0': 'zero', '1': 'one', '2': 'two', '3': 'three',
    '4': 'four', '5': 'five', '6': 'six', '7': 'seven',
    '8': 'eight', '9': 'nine'
  };

  // Convert each character in the cleaned flight number to its word equivalent
  return cleanedFlightNumber.split('').map(char => numberToWords[char] || char).join(' ');
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
    delay: '_Delay',
    security: '',
    'special-assistance': '',
    flight: '',
    dangerous_goods: '',
    'on-time': '_OnTime', // Added suffix for on-time
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
    'landed': 'landed',
    'diverted': 'diverted',
    'cancelled': 'cancelled',
    'earlier': 'earlier',
    'delay': 'delay',
    'delayed': 'delayed',
    'on time': 'on-time', // Normalize "on time" to 'on-time'
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
  return "Dear passengers, for special assistance, please notify staff or use help points in the terminal.";
};

const generateDefaultDelayAnnouncement = (flight: Flight): string => {
  return `We regret to inform you that ${flight.KompanijaNaziv} flight ${parseFlightNumber(flight.ident)} ` +
    `is currently delayed. We apologize for any inconvenience this may cause and are working ` +
    `diligently to minimize the delay. Please stay tuned for further updates and announcements. ` +
    `Thank you for your patience and understanding.`;
};

const generateDefaultEarlierAnnouncement = (flight: Flight): string => {
  return `Attention please. ${flight.KompanijaNaziv} flight ${parseFlightNumber(flight.ident)} ` +
    `from ${flight.grad} is arriving earlier than scheduled. ` + // Changed origin.code to flight.grad
    `The flight is now expected to arrive at approximately ${flight.estimated_out || flight.scheduled_out}. ` +
    `Please check the information screens for updates. Thank you.`;
};

const generateDefaultOnTimeAnnouncement = (flight: Flight): string => {
  return `Attention please. ${flight.KompanijaNaziv} flight ${parseFlightNumber(flight.ident)} ` +
    `from ${flight.grad} is scheduled to arrive on time. ` + // Changed origin.code to flight.grad
    `Expected arrival time is approximately ${flight.scheduled_out}. ` +
    `Thank you.`;
};


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

// const shouldPlayArrivalAnnouncement = (flight: Flight): boolean => {
//   const flightKey = `${flight.Kompanija} ${flight.ident}-${flight.origin.code}`;
//   const now = new Date();

//   const arrivalTime = parseTime(flight.scheduled_out);
//   const timeSinceArrival = (now.getTime() - arrivalTime.getTime()) / (1000 * 60);

//   if (timeSinceArrival > ARRIVAL_ANNOUNCEMENT_WINDOW) return false;

//   const log = announcementState.getArrivalLog(flightKey);

//   if (log.count === 0) {
//     announcementState.updateArrivalLog(flightKey, {
//       count: 1,
//       lastAnnouncementTime: now
//     });
//     return true;
//   }

//   const minutesSinceLastAnnouncement = (now.getTime() - log.lastAnnouncementTime.getTime()) / (1000 * 60);

//   if (log.count < MAX_ARRIVAL_ANNOUNCEMENTS && minutesSinceLastAnnouncement >= MIN_ANNOUNCEMENT_INTERVAL) {
//     announcementState.updateArrivalLog(flightKey, {
//       count: log.count + 1,
//       lastAnnouncementTime: now
//     });
//     return true;
//   }

//   return false;
// };
const shouldPlayArrivalAnnouncement = (flight: Flight): boolean => {
  const flightKey = `${flight.Kompanija} ${flight.ident}-${flight.origin.code}`;
  const now = new Date();

  const arrivalTime = parseTime(flight.scheduled_out);
  const timeSinceArrival = (now.getTime() - arrivalTime.getTime()) / (1000 * 60);

  // 1. Initial Check: Is it within the announcement window?
  if (timeSinceArrival > ARRIVAL_ANNOUNCEMENT_WINDOW) return false;

  const log = announcementState.getArrivalLog(flightKey);

  // 2. First Announcement: If no previous announcements for this flight
  if (log.count === 0) {
    announcementState.updateArrivalLog(flightKey, {
      count: 1,
      lastAnnouncementTime: now
    });
    return true; // Play the first announcement
  }

  // 3. Subsequent Announcements: Check count and interval
  const minutesSinceLastAnnouncement = (now.getTime() - log.lastAnnouncementTime.getTime()) / (1000 * 60);

  if (log.count < MAX_ARRIVAL_ANNOUNCEMENTS && minutesSinceLastAnnouncement >= MIN_ANNOUNCEMENT_INTERVAL) {
    announcementState.updateArrivalLog(flightKey, {
      count: log.count + 1,
      lastAnnouncementTime: now
    });
    return true; // Play a subsequent announcement
  }

  return false; // Don't play an announcement
};

const shouldPlayDelayAnnouncement = (flight: Flight): boolean => {
  const flightKey = `${flight.Kompanija} ${flight.ident}-${flight.origin.code}`;
  const now = new Date();
  const currentStatus = normalizeFlightStatus(flight.status);
  const previousStatus = announcementState.getPreviousFlightStatus(flightKey);

  const isCurrentlyDelayed = currentStatus === 'delay' || currentStatus === 'delayed';

  const log = announcementState.getDelayLog(flightKey);

  announcementState.setPreviousFlightStatus(flightKey, flight.status);

  const statusChangedToDelayed =
    (previousStatus !== 'delay' && previousStatus !== 'delayed') &&
    isCurrentlyDelayed;

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
      initialDelayStatusTime: now
    });
    return true;
  }

  const timeSinceLastAnnouncement = now.getTime() - log.lastAnnouncementTime.getTime();

  if (log.count < MAX_DELAY_ANNOUNCEMENTS &&
    timeSinceLastAnnouncement >= DELAY_ANNOUNCEMENT_INTERVAL) {
    announcementState.updateDelayLog(flightKey, {
      count: log.count + 1,
      lastAnnouncementTime: now
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

  if ((previousStatus === 'earlier') && isArrivedStatus) {
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
      initialEarlierStatusTime: now
    });
    return true;
  }

  const timeSinceLastAnnouncement = now.getTime() - log.lastAnnouncementTime.getTime();

  if (log.count < MAX_EARLIER_ANNOUNCEMENTS &&
    timeSinceLastAnnouncement >= EARLIER_ANNOUNCEMENT_INTERVAL) {
    announcementState.updateEarlierLog(flightKey, {
      count: log.count + 1,
      lastAnnouncementTime: now
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
  const isArrivedOrDeparted = ['arrived', 'landed', 'departed'].includes(currentStatus || ''); // Assuming 'departed' for departure flights

  const log = announcementState.getOnTimeLog(flightKey);

  announcementState.setPreviousFlightStatus(flightKey, flight.status);

  // If status changes from on-time to something else (e.g., arrived/departed, delayed, cancelled)
  if (previousStatus === 'on-time' && (isArrivedOrDeparted || currentStatus === 'delay' || currentStatus === 'delayed' || currentStatus === 'cancelled' || currentStatus === 'earlier')) {
    announcementState.clearOnTimeLog(flightKey);
    return false;
  }

  if (!isCurrentlyOnTime) {
    return false;
  }

  // Play the first announcement if status changes to on-time
  if (previousStatus !== 'on-time' && isCurrentlyOnTime) {
    announcementState.updateOnTimeLog(flightKey, {
      count: 1,
      lastAnnouncementTime: now
    });
    return true;
  }

  // Subsequent announcements based on interval and max count
  const timeSinceLastAnnouncement = now.getTime() - log.lastAnnouncementTime.getTime();

  if (log.count < MAX_ON_TIME_ANNOUNCEMENTS &&
    timeSinceLastAnnouncement >= ON_TIME_ANNOUNCEMENT_INTERVAL) {
    announcementState.updateOnTimeLog(flightKey, {
      count: log.count + 1,
      lastAnnouncementTime: now
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
    return await response.json();
  } catch (error) {
    console.error(`Error fetching announcement template for ${airlineCode} ${type}:`, error);
    return null;
  }
};

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
          .replace('{delayMinutes}', flight.delay?.toString() || 'a short')
          .replace('{newTime}', flight.estimated_out || flight.scheduled_out)
        : generateDefaultDelayAnnouncement(flight);
      break;
    case 'earlier':
      template = await fetchAnnouncementTemplate(flight.KompanijaICAO, type);
      text = template
        ? template.template
          .replace('{flightNumber}', parseFlightNumber(flight.ident))
          .replace('{origin}', flight.grad) // Using flight.grad
          .replace('{newTime}', flight.estimated_out || flight.scheduled_out)
        : generateDefaultEarlierAnnouncement(flight);
      break;
    case 'on-time': // Handle 'on-time' announcements
      template = await fetchAnnouncementTemplate(flight.KompanijaICAO, type);
      text = template
        ? template.template
          .replace('{flightNumber}', parseFlightNumber(flight.ident))
          .replace('{origin}', flight.grad) // Using flight.grad
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
    priority: getPriorityForAnnouncementType(type)
  };
};


const getPriorityForAnnouncementType = (type: AnnouncementTypeExtended): number => {
  const priorityMap: Record<AnnouncementTypeExtended, number> = {
    security: 1,
    dangerous_goods: 1,
    cancelled: 2,
    diverted: 2,
    close: 3,
    boarding: 4,
    earlier: 3, // Same priority as close announcements
    delay: 3, // Same priority as close announcements
    'on-time': 5, // Set on-time announcements to priority 5
    checkin: 6,
    arrived: 7,
    'special-assistance': 8,
    flight: 9,
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

const processFlightAnnouncements = async (flight: Flight, now: Date): Promise<Announcement[]> => {
  const announcements: Announcement[] = [];
  const flightStatus = normalizeFlightStatus(flight.status);

  if (!flightStatus) {
    console.warn(`Unknown flight status: ${flight.status} for flight ${flight.ident}`);
    return announcements;
  }

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

  // If a flight has an on-time status and doesn't have a gate assigned, it's probably an arrival.
  // We still want to announce on-time for arrivals even without a gate.
  const isDepartureAndNoGate = flight.TipLeta.includes('D') && (!flight.gate || flight.gate.trim() === '');
  const isNotOnTimeAndNoGate = flightStatus !== 'on-time' && (!flight.gate || flight.gate.trim() === '');

  if (isDepartureAndNoGate && isNotOnTimeAndNoGate &&
    flightStatus !== 'arrived' && flightStatus !== 'landed' && flightStatus !== 'delay' && flightStatus !== 'delayed' && flightStatus !== 'earlier') {
    console.log(`Skipping announcement for flight ${flight.ident} - No gate assigned and not an arrival or relevant status`);
    return announcements;
  }

  const timeDiff = calculateTimeDifference(flight.scheduled_out, now);
  console.log(`Flight ${flight.ident}: Time Difference = ${timeDiff} minutes, Status = ${flightStatus}`);

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
      condition: flightStatus === 'earlier' && shouldPlayEarlierAnnouncement(flight)
    },
    {
      type: 'arrived' as const,
      condition: (flightStatus === 'arrived' || flightStatus === 'landed') && shouldPlayArrivalAnnouncement(flight)
    },
    {
      type: 'delay' as const,
      condition: (flightStatus === 'delay' || flightStatus === 'delayed') && shouldPlayDelayAnnouncement(flight)
    },
    {
      type: 'on-time' as const, // Added on-time check
      condition: flightStatus === 'on-time' && shouldPlayOnTimeAnnouncement(flight) && flight.TipLeta.includes('I') // Only for arrival flights
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
  const currentMinutes = now.getMinutes();

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

const processAnnouncementQueue = async (announcements: Announcement[]): Promise<void> => {
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

const processFlightAnnouncementQueue = async (announcement: Announcement): Promise<void> => {
  const flight = announcement.flight!;
  const type = flight.TipLeta.includes('I') ? 'ARR' : 'DEP';
  const suffix = getAnnouncementSuffix(announcement.type);
  const destinationCode = type === 'DEP' ? flight.destination?.code : flight.origin.code;

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

export const processAnnouncements = async (flightData: FlightData): Promise<void> => {
  try {
    const now = new Date();
    const announcements: Announcement[] = [];

    processCancelledFlights(now);

    const flightPromises = [...flightData.departures, ...flightData.arrivals].map(flight =>
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

    announcements.push(...processPeriodicAnnouncements(now));

    await processAnnouncementQueue(announcements);

    if (now.getMinutes() === 0) {
      announcementState.cleanup();
    }

  } catch (error) {
    console.error('Error in processAnnouncements:', error);
  }
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
      delay: undefined
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
      addedToAudioManager: entry.addedToAudioManager
    }));
  }
};

export type { Announcement, AnnouncementTypeExtended, FlightStatus, CancelledFlightEntry };