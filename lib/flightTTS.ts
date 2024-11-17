'use client';

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


  public shouldAnnounceArrival(flight: Flight): boolean {
    // First check if basic conditions are met
    if (!flight.isArrival || flight.status !== 'arrived' || !flight.actual_in) {
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

      // Strict check: Only announce if arrived less than 10 minutes ago
      if (minutesSinceArrival > 10) {
        console.log(`Skipping announcement for flight ${flight.ident} - arrived ${minutesSinceArrival.toFixed(1)} minutes ago`);
        return false;
      }

      // Check if we've already announced this flight recently
      const record = this.announcedFlights.get(flight.ident);
      if (record) {
        const timeSinceLastAnnouncement = (now.getTime() - record.lastAnnounced) / 1000;
        if (timeSinceLastAnnouncement < this.MINIMUM_ANNOUNCEMENT_INTERVAL) {
          return false;
        }
      }

      // If we get here, the flight arrived within the last 10 minutes and hasn't been announced recently
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

  private recordAnnouncement(flight: Flight) {
    const now = Date.now();
    const record = this.announcedFlights.get(flight.ident) || { lastAnnounced: 0, count: 0 };
    
    this.announcedFlights.set(flight.ident, {
      lastAnnounced: now,
      count: record.count + 1
    });
  }

  private createAnnouncementText(flight: Flight, type: 'checkin' | 'boarding' | 'final' | 'arrived' | 'close'): string {
    switch (type) {
      case 'checkin':
        return `Attention please. ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} to ${flight.destination.code} is now open for check-in at counter ${flight.checkIn}`;
      case 'boarding':
        return `Attention please. ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} to ${flight.destination.code} is now boarding at gate ${flight.gate}`;
      case 'final':
        return `Final call. This is the final call for ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} to ${flight.destination.code}. Please proceed immediately to gate ${flight.gate}`;
      case 'arrived':
        return `Dear passengers, ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} has arrived from ${flight.grad}`;
      case 'close':
        return `Attention please. The boarding for ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} to ${flight.destination.code} has now closed. We thank you for your cooperation.`;
      default:
        return '';
    }
  }

  private getTimeDifferenceInMinutes(scheduledTime: string): number {
    const now = new Date();
    const scheduled = new Date();
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    scheduled.setHours(hours, minutes, 0, 0);
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

  public shouldAnnounce(flight: Flight, status: string): boolean {
    if (!flight.scheduled_out) return false;
    
    const timeDiff = this.getTimeDifferenceInMinutes(flight.scheduled_out);
    
    switch (status) {
      case 'Check In':
        return timeDiff <= 60 && timeDiff >= 55;
      case 'Processing':
        return timeDiff <= 40 && timeDiff >= 35;
      case 'Boarding':
        return timeDiff <= 25 && timeDiff >= 20;
      case 'Final Call':
        return timeDiff <= 15 && timeDiff >= 10;
      case 'Close':
        return timeDiff <= 10 && timeDiff >= 5;
      default:
        return false;
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
    return `Dear passengers, may I have your attention please. Do not leave baggage unattended. ` +
           `Unattended baggage may be confiscated for security reason and may be destroyed. ` +
           `The local time is ${currentTime}. Thank you.`;
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
    // For arrivals, do one final time check before queuing
    if (type === 'arrived') {
      if (!this.shouldAnnounceArrival(flight)) {
        console.log(`Skipping announcement queue for flight ${flight.ident} - failed final time check`);
        return;
      }
    }

    const text = this.createAnnouncementText(flight, type);
    const priority = type === 'arrived' ? 4 : 
                    type === 'final' ? 1 : 
                    type === 'close' ? 1 : 
                    type === 'boarding' ? 2 : 3;

    this.recordAnnouncement(flight);
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
    this.synth.cancel();
    this.queue = [];
    this.isPlaying = false;
    this.announcedFlights.clear();
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