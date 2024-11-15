'use client';


interface Flight {
  ident: string;
  status: string;
  scheduled_out: string;
  estimated_out: string;
  actual_out: string | null;
  origin: { code: string };
  grad:string;
  destination: { code: string };
  Kompanija: string;
  KompanijaICAO: string;
  KompanijaNaziv: string;
  checkIn: string;
  gate: string;
}

interface TTSQueueItem {
  text: string;
  priority: number;
  scheduledTime: string;
}

class FlightTTSEngine {
  private queue: TTSQueueItem[] = [];
  private isPlaying: boolean = false;
  private synth: SpeechSynthesis;
  private isInitialized: boolean = false;
  private onInitCallbacks: (() => void)[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.synth = window.speechSynthesis;

    if (!this.synth) {
      console.error('Web Speech API is not supported in this browser.');
      return;
    }

    if (this.synth.pending || this.synth.speaking) {
      console.error('Web Speech API is already in use.');
      return;
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
    console.log('FlightTTSEngine onInit called');
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

  private createAnnouncementText(flight: Flight, type: 'checkin' | 'boarding' | 'final' | 'arrived'): string {
    console.log('FlightTTSEngine createAnnouncementText called');
    switch (type) {
      case 'checkin':
        return `Attention please. ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} to ${flight.destination.code} is now open for check-in at counter ${flight.checkIn}`;
      case 'boarding':
        return `Attention please. ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} to ${flight.destination.code} is now boarding at gate ${flight.gate}`;
      case 'final':
        return `Final call. This is the final call for ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} to ${flight.destination.code}. Please proceed immediately to gate ${flight.gate}`;
      case 'arrived':
        return `Dear passengers, ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} has arrived from ${flight.grad}`;
      default:
        return '';
    }
  }

  private getTimeDifferenceInMinutes(scheduledTime: string): number {
    console.log('FlightTTSEngine getTimeDifferenceInMinutes called');
    const now = new Date();
    const scheduled = new Date();
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    scheduled.setHours(hours, minutes, 0, 0);
    return Math.floor((scheduled.getTime() - now.getTime()) / (1000 * 60));
  }

  public shouldAnnounce(flight: Flight, status: string): boolean {
    console.log('FlightTTSEngine shouldAnnounce called');
    if (!flight.scheduled_out) return false;
    
    const timeDiff = this.getTimeDifferenceInMinutes(flight.scheduled_out);
    
    switch (status) {
      case 'Check In':
        return timeDiff <= 60 && timeDiff >= 55;
      case 'Processing':
        return timeDiff <= 40 && timeDiff >= 35;
      case 'Boarding':
        return timeDiff <= 30 && timeDiff >= 25;
      case 'Final Call':
        return timeDiff <= 15 && timeDiff >= 10;
      default:
        return false;
    }
  }

  public addToQueue(text: string, priority: number, scheduledTime: string) {
    console.log('FlightTTSEngine addToQueue called');
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
    console.log('FlightTTSEngine playNext called');
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
    } else {
      // Find the first available voice
      const voices = this.getVoices();
      if (voices.length > 0) {
        utterance.voice = voices[0];
      }
    }
  
    utterance.onend = () => {
      console.log('FlightTTSEngine playNext onend called');
      setTimeout(() => this.playNext(), 1000);
    };
  
    this.synth.speak(utterance);
  }

  public queueAnnouncement(flight: Flight, type: 'checkin' | 'boarding' | 'final' | 'arrived') {
    console.log('FlightTTSEngine queueAnnouncement called');
    const text = this.createAnnouncementText(flight, type);
    const priority = type === 'arrived' ? 4 : 
                    type === 'final' ? 1 : 
                    type === 'boarding' ? 2 : 3;
    
    this.addToQueue(text, priority, flight.scheduled_out || '');
  }

  public stop() {
    console.log('FlightTTSEngine stop called');
    this.synth.cancel();
    this.queue = [];
    this.isPlaying = false;
  }
}

let ttsEngine: FlightTTSEngine | null = null;

export const getFlightTTSEngine = () => {
  console.log('getFlightTTSEngine called');
  if (typeof window === 'undefined') return null;
  if (!ttsEngine) {
    ttsEngine = new FlightTTSEngine();
  }
  return ttsEngine;
};