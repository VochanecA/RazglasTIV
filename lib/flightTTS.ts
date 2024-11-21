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
    this.selectedVoice = voices.find(voice => 
      voice.lang === 'en-GB' && !voice.localService
    ) || voices.find(voice => 
      voice.lang.startsWith('en-') && !voice.localService
    ) || voices[0];
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
    // Convert entries to array before iteration
    Array.from(this.announcedFlights.entries()).forEach(([flightId, record]) => {
      if (now - record.lastAnnounced > this.RECORD_EXPIRY) {
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

  public shouldAnnounceArrival(flight: Flight): boolean {
    // Check if the flight is an arrival and has a valid actual arrival time
    if (!flight.isArrival || (flight.status !== 'Arrived' && flight.status !== 'arrived') || !flight.actual_in) {
        console.warn(`Flight ${flight.ident} - isArrival: ${flight.isArrival}, status: ${flight.status}, actual_in: ${flight.actual_in}`);
        return false; 
    }
    
    try {
        // Parse the arrival time
        const actualInTime = new Date(flight.actual_in);
        const now = new Date();

        // Validate that the arrival time is a valid date
        if (isNaN(actualInTime.getTime())) { 
            console.warn(`Invalid arrival time for flight ${flight.ident}`);
            return false; 
        }

        // Calculate minutes since arrival
        const minutesSinceArrival = (now.getTime() - actualInTime.getTime()) / (1000 * 60);
        
        // Debug log to help track timing issues
        console.log(`Flight ${flight.ident} arrived ${minutesSinceArrival.toFixed(1)} minutes ago`);

        // Check if we've already announced this flight recently
        const record = this.announcedFlights.get(flight.ident);
        if (record) { 
            const timeSinceLastAnnouncement = (now.getTime() - record.lastAnnounced) / 1000; 
            if (timeSinceLastAnnouncement < this.MINIMUM_ANNOUNCEMENT_INTERVAL) { 
                return false; 
            } 
        }

        // If we get here, the flight arrived within the last 10 minutes or hasn't been announced recently
        return true; 
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
  private createAnnouncementText(flight: Flight, type: 'checkin' | 'boarding' | 'processing' | 'final' | 'arrived' | 'close'): string {
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
        return `Dear passengers, ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} has arrived from ${flight.grad}`;
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
        // Handle boarding in startBoardingAnnouncements
        return timeDiff <= 40 && timeDiff >= 35;
        
      case 'Final Call':
        return timeDiff <= 25 && timeDiff >= 20;
        
      case 'Close':
        return timeDiff <= 15 && timeDiff >= 10;
        
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
      // Check if flight status is still valid for boarding announcements
      if (flight.status === 'Close' || flight.status === 'Departed' || 
          flight.actual_out !== null) {
        this.stopBoardingAnnouncements(flight.ident);
        return;
      }

      if (flight.status === 'Boarding') {
        this.queueAnnouncement(flight, 'boarding');
      }
    };

    // Make initial announcement
    announceBoarding();

    // Set up repeated announcements
    const timer = setInterval(announceBoarding, this.BOARDING_REPEAT_INTERVAL);
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
    return `Dear passengers, may I have your attention please. Do not leave your baggage unattended at any time you are at the airport, ` +
           `as it will be removed for security reason and may be destroyed. Thank you. ` +
           `The local time is ${currentTime}.`;
  }

  public addToQueue(text: string, priority: number, scheduledTime: string) {
    if (!this.isInitialized) {
      this.onInit(() => this.addToQueue(text, priority, scheduledTime));
      return;
    }

    this.queue.push({ text, priority, scheduledTime });
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.scheduledTime.localeCompare(b.scheduledTime);
    });
    
    if (!this.isPlaying) {
      this.playNext();
    }
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

    // Process announcements based on time before departure
    if (isIsraeliAirline) {
      if ([120, 90, 80, 60, 40].includes(timeDiff)) {
        this.queueAnnouncement(flight, 'checkin');
      }
    } else {
      if ([80, 60, 40].includes(timeDiff)) {
        this.queueAnnouncement(flight, 'checkin');
      }
    }

    // Handle different flight statuses
    switch (flight.status as FlightStatus) {
      case 'Boarding':
        this.startBoardingAnnouncements(flight);
        break;
      case 'Final Call':
        if (this.shouldAnnounce(flight, 'Final Call')) {
          this.queueAnnouncement(flight, 'final');
        }
        break;
      case 'Close':
      case 'Departed':
        this.stopBoardingAnnouncements(flight.ident);
        if (this.shouldAnnounce(flight, 'Close')) {
          this.queueAnnouncement(flight, 'close');
        }
        break;
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