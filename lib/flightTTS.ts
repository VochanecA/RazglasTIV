'use client';


// Add new type for flight status
type FlightStatus = 'Processing' | 'Boarding' | 'Final Call' | 'Close' | 'Departed';
interface TTSPlayRecord {
  flightIcaoCode: string;
  flightNumber: string;
  destinationCode: string;
  callType: 'checkin' | 'boarding' | 'final' | 'arrived' | 'close';
  gate?: string;
  filename: string;
}
interface Flight {
  ident: string;
  status: string;
  scheduled_out: string;
  estimated_out: string;
  actual_out: string | null;
  actual_in: string | null;
  origin: { code: string };
  grad: string;
  destination: { code: string };
  Kompanija: string;
  KompanijaICAO: string;
  KompanijaNaziv: string;
  checkIn: string;
  gate: string;
  isArrival?: boolean;
}

interface TTSQueueItem {
  text: string;
  priority: number;
  scheduledTime: string;
}

interface ScheduledAnnouncementConfig {
  startHour: number;
  endHourWinter: number;
  endHourSummer: number;
  interval: number; // in minutes
}

interface AnnouncementRecord {
  lastAnnounced: number; // timestamp
  count: number;
}


class FlightTTSEngine {
  private queue: TTSQueueItem[] = [];
  private isPlaying: boolean = false;
  private synth: SpeechSynthesis;
  private isInitialized: boolean = false;
  private onInitCallbacks: (() => void)[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private scheduledAnnouncementTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private announcedFlights: Map<string, AnnouncementRecord> = new Map();

  private readonly MINIMUM_ANNOUNCEMENT_INTERVAL = 1000 * 60 * 30; // 30 minutes
  private readonly CLEANUP_INTERVAL = 1000 * 60 * 60; // 1 hour
  private readonly RECORD_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

  private boardingAnnouncementTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly BOARDING_REPEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly ISRAELI_AIRLINES = ['ISRAIR', 'EL AL'];

  
  private announcementConfig: ScheduledAnnouncementConfig = {
    startHour: 7,
    endHourWinter: 16.5, // 16:30
    endHourSummer: 19.5, // 19:30
    interval: 30 // default interval
  };
  

  constructor() {
    if (typeof window === 'undefined') {
      throw new Error('FlightTTSEngine must be initialized in browser environment');
    }

    this.synth = window.speechSynthesis;
    if (!this.synth) {
      console.error('Web Speech API is not supported in this browser.');
      return;
    }

    if (this.synth.speaking) {
      this.synth.cancel();
    }

    if (this.synth.getVoices().length > 0) {
      this.setupVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        this.setupVoice();
      };
    }

    this.startCleanupTimer();
  }

  private setupVoice() {
    const voices = this.synth.getVoices();
    this.selectedVoice = 
      voices.find(voice => voice.lang === 'en-GB' && !voice.localService) ||
      voices.find(voice => voice.lang.startsWith('en-')) ||
      voices[0]; // Default to the first available voice
    if (!this.selectedVoice) {
      console.warn('No suitable TTS voice found.');
    }
  }
  
  
  public initialize() {
    console.log('FlightTTSEngine initialize called');
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.onInitCallbacks.forEach(callback => callback());
    this.onInitCallbacks = [];
  }

  public onInit(callback: () => void) {
    if (this.isInitialized) {
      callback();
    } else {
      this.onInitCallbacks.push(callback);
    }
  }

  private getVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }

  public setVoice(voice: SpeechSynthesisVoice) {
    this.selectedVoice = voice;
  }

  
  private startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupAnnouncementRecords();
    }, this.CLEANUP_INTERVAL);
  }

  private cleanupAnnouncementRecords() {
    const now = Date.now();
    Array.from(this.announcedFlights.entries()).forEach(([flightId, record]) => {
        // Keep arrival records for 2 hours to prevent duplicate announcements
        const expiryTime = flightId.includes('_arrived') ? 
            2 * 60 * 60 * 1000 : // 2 hours for arrival records
            this.RECORD_EXPIRY;   // Regular expiry for other announcements
        
        if (now - record.lastAnnounced > expiryTime) {
            this.announcedFlights.delete(flightId);
        }
    });
}
  public queueCustomAnnouncement(message: string) {
    if (!this.isInitialized) {
      this.onInit(() => this.queueCustomAnnouncement(message));
      return;
    }

    // Using medium priority (3) for custom announcements
    // Using current time as scheduledTime since it's a custom immediate announcement
    const currentTime = this.formatTime(new Date());
    
    // Add the custom announcement to the queue
    this.addToQueue(message, 3, currentTime);
  }

// Update shouldAnnounceArrival method to be more precise
public shouldAnnounceArrival(flight: Flight): boolean {
  if (!flight.actual_in) {
      return false;
  }

  try {
      const actualInTime = new Date(flight.actual_in);
      const now = new Date();
      
      if (isNaN(actualInTime.getTime())) {
          console.warn(`Invalid arrival time for flight ${flight.ident}`);
          return false;
      }

      const minutesSinceArrival = (now.getTime() - actualInTime.getTime()) / (1000 * 60);

      // Check if this arrival was already announced
      const arrivalKey = `${flight.ident}_arrived`;
      const previousAnnouncement = this.announcedFlights.get(arrivalKey);
      
      // Only announce if:
      // 1. Arrival was within last 15 minutes
      // 2. Haven't announced this arrival before
      return minutesSinceArrival <= 15 && !previousAnnouncement;

  } catch (error) {
      console.error(`Error processing arrival time for flight ${flight.ident}:`, error);
      return false;
  }
}
  
  private parseFlightDate(dateString: string): Date | null {
    try {
      const parsed = new Date(dateString);
      if (isNaN(parsed.getTime())) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  
  private recordAnnouncement(flight: Flight, type: 'checkin' | 'boarding' | 'final' | 'arrived' | 'close') {
    const now = Date.now();
    const record = this.announcedFlights.get(flight.ident) || { lastAnnounced: 0, count: 0 };
    this.announcedFlights.set(flight.ident, { lastAnnounced: now, count: record.count + 1 });
}
public onFlightStatusChange(flight: Flight): void {
  if (flight.status === 'Processing') {
    this.scheduleCheckinAnnouncements(flight);
  }
  if (flight.status === 'Boarding') {
    this.scheduleBoardingAnnouncements(flight);
  }
  if (flight.status === 'Close') {
    this.scheduleCloseAnnouncements(flight);
  }
  if (flight.status === 'Arrived' || flight.status === 'arrived' ||  flight.status === 'Landed') {
    this.scheduleArrivedAnnouncements(flight);  // Handle the "Arrived" or "Landed" status
  }
}

private scheduleCheckinAnnouncements(flight: Flight): void {
  const announcementText = this.createAnnouncementText(flight, 'checkin');
  this.scheduleAnnouncement(announcementText);
}

private scheduleBoardingAnnouncements(flight: Flight): void {
  const announcementText = this.createAnnouncementText(flight, 'boarding');
  this.scheduleAnnouncement(announcementText);
}

private scheduleCloseAnnouncements(flight: Flight): void {
  const announcementText = this.createAnnouncementText(flight, 'close');
  this.scheduleAnnouncement(announcementText);
}

private scheduleArrivedAnnouncements(flight: Flight): void {
  const announcementText = this.createAnnouncementText(flight, 'arrived');  // Announcement for arrival/landing
  this.scheduleAnnouncement(announcementText);
}

// Example for scheduling logic - you can replace this with your own scheduling method
private scheduleAnnouncement(announcementText: string): void {
  // Schedule the announcement, e.g., by sending it to a public address system, 
  // or log it for further processing.
  console.log(`Scheduled Announcement: ${announcementText}`);
}

// Your existing createAnnouncementText remains unchanged
private createAnnouncementText(flight: Flight, type: 'checkin' | 'boarding' | 'processing' | 'final' | 'arrived' | 'close'): string {
  console.log(`Creating announcement text for flight ${flight.ident}, type: ${type}`);

  // Function to remove leading zeros from check-in numbers or gate numbers
  const formatCheckInOrGate = (checkInOrGate: string) => {
    return checkInOrGate ? checkInOrGate.replace(/^0+/, '') : checkInOrGate;
  };

  // Function to convert numbers to words for numbers 1-9
  const numberToWords = (num: number) => {
    const words: { [key: number]: string } = {
      1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine'
    };
    return words[num] || num.toString(); // For numbers > 9, just return the number as a string
  };

  // Function to process the check-in counters or gate numbers to remove leading zeros and convert to words for numbers 1-9
  const processCheckInOrGate = (checkInOrGate: string) => {
    const checkInOrGateParts = checkInOrGate.split(',').map(part => formatCheckInOrGate(part.trim())); // Remove leading zeros and trim spaces
    return checkInOrGateParts.map((part, index) => {
      const num = parseInt(part, 10);
      // Convert only numbers less than 10 to words, keep others numeric
      return num < 10 ? numberToWords(num) : num.toString(); 
    }).join(' '); // Join with space instead of commas to avoid TTS issues
  };

  switch (type) {
    case 'checkin':
    case 'processing':
      return `Attention please. ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} to ${flight.grad} is open for check-in at counter ${processCheckInOrGate(flight.checkIn)}`;
    case 'boarding':
      return `Attention please. ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} to ${flight.grad} is now boarding at gate ${processCheckInOrGate(flight.gate)}`;
    case 'final':
      return `Final call. This is the final call for ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} to ${flight.grad}. Please proceed immediately to gate ${processCheckInOrGate(flight.gate)}`;
    case 'arrived':
      return `Dear passengers, ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} has arrived from ${flight.grad}. Please proceed to baggage claim.`;
    case 'close':
      return `Attention please. The boarding for ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} to ${flight.grad} has now closed. We thank you for your cooperation. We wish you a pleasant flight and see you soon.`;
    default:
      return '';
  }
}

  
  
  private getTimeDifferenceInMinutes(scheduledTime: string): number {
    const now = new Date();
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    return Math.floor((scheduled.getTime() - now.getTime()) / (1000 * 60));
  }
  

  private isSummerTime(): boolean {
    const date = new Date();
    const year = date.getFullYear();
    const marchLastSunday = new Date(year, 2, 31).getDate() - new Date(year, 2, 31).getDay();
    const octoberLastSunday = new Date(year, 9, 31).getDate() - new Date(year, 9, 31).getDay();
    
    const summerStart = new Date(year, 2, marchLastSunday);
    const summerEnd = new Date(year, 9, octoberLastSunday);
    
    return date >= summerStart && date < summerEnd;
  }

  private isWithinOperatingHours(): boolean {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const endHour = this.isSummerTime() ? 
      this.announcementConfig.endHourSummer : 
      this.announcementConfig.endHourWinter;

    return currentHour >= this.announcementConfig.startHour && currentHour <= endHour;
  }
  public shouldAnnounce(flight: Flight, status: FlightStatus): boolean {
    if (!flight.scheduled_out) return false;
    
    const timeDiff = this.getTimeDifferenceInMinutes(flight.scheduled_out);
    const isIsraeliAirline = this.ISRAELI_AIRLINES.includes(flight.KompanijaNaziv);
    
    switch (status) {
      case 'Processing': 
        if (isIsraeliAirline) {
          // Special timing for Israeli airlines: 120, 90, 80, 60, 40 minutes
          return [120, 90, 80, 60, 40].includes(timeDiff);
        }
        // Standard timing: 80, 60, 40 minutes
        return [80, 60, 40].includes(timeDiff);
        
        case 'Boarding':
          // When in final call time window (T-15 to T-10), use Final Call status instead
          if (timeDiff <= 15 && timeDiff > 10) {
            return this.shouldAnnounce(flight, 'Final Call');
          }
          // Regular boarding announcements every 5 minutes from T-25 to T-15
          const isBoardingTime = timeDiff <= 25 && timeDiff > 15 && timeDiff % 5 === 0;
          // Close announcements between T-10 and T-0
          const isCloseTime = timeDiff <= 10 && timeDiff >= 0;
          
          return isBoardingTime || isCloseTime;
          
        case 'Final Call':
          // Final call at 15 minutes before departure
          return timeDiff <= 15 && timeDiff > 10;
          
        case 'Close':
          // Close announcement at 10 minutes before departure
          return timeDiff <= 10 && timeDiff >= 0;
          
        default:
          return false;
      }
  }

  private startBoardingAnnouncements(flight: Flight) {
    // Don't start if already announcing for this flight
    if (this.boardingAnnouncementTimers.has(flight.ident)) {
      return;
    }

    const announceBoarding = () => {
      const timeDiff = this.getTimeDifferenceInMinutes(flight.scheduled_out);
      
      // Stop if we're past the boarding window
      if (timeDiff <= 15 || timeDiff > 25) {
        this.stopBoardingAnnouncements(flight.ident);
        return;
      }

      this.queueAnnouncement(flight, 'boarding');
    };

    // Make initial announcement
    announceBoarding();

    // Set up repeated announcements every 5 minutes
    const timer = setInterval(announceBoarding, 5 * 60 * 1000);
    this.boardingAnnouncementTimers.set(flight.ident, timer);
  }


  private stopBoardingAnnouncements(flightIdent: string) {
    const timer = this.boardingAnnouncementTimers.get(flightIdent);
    if (timer) {
      clearInterval(timer);
      this.boardingAnnouncementTimers.delete(flightIdent);
    }
  }

  
  
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  private createSecurityAnnouncement(): string {
    const currentTime = this.formatTime(new Date());
    return `Attention please. Dear passengers, may I have your attention please. Do not leave your baggage unattended at any time you are at the airport, ` +
           `as it will be removed for security reason and may be destroyed. Thank you. ` +
           `The local time is ${currentTime}.`;
  }

/*   private isValidFlight(flight: Flight): boolean {
    return !!(flight.ident && flight.status && flight.grad && flight.KompanijaNaziv);
  }
 */
  

public addToQueue(text: string, priority: number, scheduledTime: string) {
  if (!this.isInitialized) {
    this.onInit(() => this.addToQueue(text, priority, scheduledTime));
    return;
  }

  this._addToQueue(text, priority, scheduledTime); // Call the private method here.

  if (!this.isPlaying) {
    this.playNext();
  }
}

// Private method for queue addition and sorting
private _addToQueue(text: string, priority: number, scheduledTime: string) {
  this.queue.push({ text, priority, scheduledTime });
  this.queue.sort((a, b) => b.priority - a.priority || a.scheduledTime.localeCompare(b.scheduledTime));
}


  private playNext() {
    if (!this.isInitialized || this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }
  
    this.isPlaying = true;
    const item = this.queue.shift();
    if (!item) return;
  
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.rate = 0.75;
    utterance.pitch = 0.9;
    utterance.volume = 1;
  
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
  
    utterance.onend = () => {
      setTimeout(() => this.playNext(), 1000);
    };

    utterance.onerror = (event) => {
      console.error('TTS Error:', event);
      this.playNext();
    };
  
    this.synth.speak(utterance);
  }
  public queueAnnouncement(flight: Flight, type: 'checkin' | 'boarding' | 'final' | 'arrived' | 'close') {
    console.log(`Attempting to queue announcement for flight ${flight.ident}, type: ${type}`);

    const now = Date.now();
    const record = this.announcedFlights.get(flight.ident);

    // For check-in announcements
    if (type === 'checkin') {
        // Check if the announcement was made recently (within MINIMUM_ANNOUNCEMENT_INTERVAL)
        if (record && (now - record.lastAnnounced < this.MINIMUM_ANNOUNCEMENT_INTERVAL)) {
            console.log(`Skipping check-in announcement for flight ${flight.ident} - already announced recently.`);
            return; // Skip queuing if it was announced recently
        }
    }

    // For arrivals, do one final time check before queuing
    if (type === 'arrived') {
        if (!this.shouldAnnounceArrival(flight)) {
            console.log(`Skipping announcement queue for flight ${flight.ident} - failed final time check`);
            return;
        }
    }

    const text = this.createAnnouncementText(flight, type);
    const priority = type === 'arrived' ? 4 : type === 'final' ? 1 : type === 'close' ? 1 : type === 'boarding' ? 2 : 3;

    this.recordAnnouncement(flight, type); // Record the announcement
    this.addToQueue(text, priority, flight.scheduled_out || flight.actual_in || '');
}
  public setAnnouncementInterval(minutes: number) {
    if (minutes !== 15 && minutes !== 30) {
      console.error('Interval must be either 15 or 30 minutes');
      return;
    }
    
    this.announcementConfig.interval = minutes;
    this.stopScheduledAnnouncements();
    this.startScheduledAnnouncements();
  }


  public startScheduledAnnouncements() {
    if (this.scheduledAnnouncementTimer) {
      return;
    }

    const playIfInHours = () => {
      if (this.isWithinOperatingHours()) {
        const announcement = this.createSecurityAnnouncement();
        this.addToQueue(announcement, 5, this.formatTime(new Date()));
      }
    };

    playIfInHours();

    this.scheduledAnnouncementTimer = setInterval(() => {
      playIfInHours();
    }, this.announcementConfig.interval * 60 * 1000);
  }

  public stopScheduledAnnouncements() {
    if (this.scheduledAnnouncementTimer) {
      clearInterval(this.scheduledAnnouncementTimer);
      this.scheduledAnnouncementTimer = null;
    }
  }

  public stop() {
    this.stopScheduledAnnouncements();
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    // Clear all boarding announcement timers
    this.boardingAnnouncementTimers.forEach((timer, flightIdent) => {
      this.stopBoardingAnnouncements(flightIdent);
    });
    
    this.synth.cancel();
    this.queue = [];
    this.isPlaying = false;
    this.announcedFlights.clear();
  }
  public processAnnouncements(flight: Flight) {
    const isIsraeliAirline = this.ISRAELI_AIRLINES.includes(flight.KompanijaNaziv);
    const timeDiff = this.getTimeDifferenceInMinutes(flight.scheduled_out);
  
    // Process check-in announcements (keep existing logic)
    if (isIsraeliAirline) {
        if ([120, 90, 80, 60, 40].includes(timeDiff)) {
            this.queueAnnouncement(flight, 'checkin');
        }
    } else {
        if ([80, 60, 40].includes(timeDiff)) {
            this.queueAnnouncement(flight, 'checkin');
        }
    }

     // Handle arrival announcements for arrived flights
     if (flight.actual_in && !this.announcedFlights.has(`${flight.ident}_arrived`)) {
      const arrivalTime = new Date(flight.actual_in);
      const now = new Date();
      const minutesSinceArrival = Math.floor((now.getTime() - arrivalTime.getTime()) / (1000 * 60));
      
      // Only announce if arrival was within last 15 minutes
      if (minutesSinceArrival <= 15) {
          this.queueAnnouncement(flight, 'arrived');
          // Mark this arrival as announced to prevent duplicates
          this.announcedFlights.set(`${flight.ident}_arrived`, {
              lastAnnounced: now.getTime(),
              count: 1
          });
      }
  }
  
    // New timing-based announcement logic
    if (timeDiff <= 25 && timeDiff > 15) {
        // Start boarding announcements at T-25 minutes
        if (!this.boardingAnnouncementTimers.has(flight.ident)) {
            this.queueAnnouncement(flight, 'boarding');
            this.startBoardingAnnouncements(flight);
        }
    }
    
    // Final call at T-15 minutes
    if (timeDiff <= 15 && timeDiff > 10) {
        this.queueAnnouncement(flight, 'final');
    }
    
    // Close announcement at T-10 minutes
    if (timeDiff <= 10 && timeDiff > 0) {
        this.stopBoardingAnnouncements(flight.ident);
        this.queueAnnouncement(flight, 'close');
    }

    // Handle departure and arrival
    if (flight.actual_out || flight.status === 'Departed') {
        this.stopBoardingAnnouncements(flight.ident);
        
        // Queue arrival announcement if not already arrived
        if (flight.status?.toLowerCase() !== 'arrived') {
            flight.status = "Arrived";
            this.queueAnnouncement(flight, 'arrived');
        }
    }
}
}





let ttsEngine: FlightTTSEngine | null = null;

export const getFlightTTSEngine = () => {
  if (typeof window === 'undefined') return null;
  if (!ttsEngine) {
    ttsEngine = new FlightTTSEngine();
    ttsEngine.initialize();
  }
  return ttsEngine;
};