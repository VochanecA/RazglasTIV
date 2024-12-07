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
  mp3?: string; // Optional MP3 URL
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

  private backgroundMusic!: HTMLAudioElement; // Declare background music property

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
console.log(process.env.REACT_APP_STREAM_URL )
      // Initialize background music
  const streamUrl = process.env.REACT_APP_STREAM_URL || 'https://smoothjazz.cdnstream1.com/2586_128.mp3'; // Fallback in case variable is not set
       this.backgroundMusic = new Audio(streamUrl);
       this.backgroundMusic.volume = 0.3; // Set initial volume
       this.backgroundMusic.loop = true; // Loop the music
       this.backgroundMusic.play(); // Start playing background music
      //  http://fr1.lounge-radio.com/lounge128.mp3

      //  jazz: https://443-1.autopo.st/171/stream/3/
      //  smooth jazz: https://smoothjazz.cdnstream1.com/2586_128.mp3
      this.startCleanupTimer();
      this.scheduleDisabledPassengerAssistanceAnnouncement(); // Schedule announcements
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
    this.scheduleDisabledPassengerAssistanceAnnouncement(); 
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
  // First, check if the flight has actually arrived
  if (!flight.actual_out) {
    console.warn(`Invalid or missing actual_out for flight ${flight.ident}`);
    return false;
  }

  try {
    // Get current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0]; // Extracts the date part (e.g., "2024-11-26")

    // Combine current date with the actual_out time to form a full date-time string
    const dateTimeString = `${currentDate}T${flight.actual_out}:00`; // Format as "2024-11-26T11:02:00"

    const actualInTime = new Date(dateTimeString);
    const now = new Date();
    
    // Validate the actual arrival time
    if (isNaN(actualInTime.getTime())) {
      console.warn(`Invalid arrival time for flight ${flight.ident}: ${dateTimeString}`);
      return false;
    }

    // Calculate minutes since arrival
    const minutesSinceArrival = (now.getTime() - actualInTime.getTime()) / (1000 * 60);

    // Additional validation checks
    if (minutesSinceArrival < 0) {
      console.warn(`Future arrival time detected for flight ${flight.ident}`);
      return false;
    }

    // Check if this arrival was already announced
    const arrivalKey = `${flight.ident}_arrived`;
    const previousAnnouncement = this.announcedFlights.get(arrivalKey);
    
    // Precise announcement criteria:
    // 1. Arrival was within last 15 minutes
    // 2. Haven't announced this arrival before
    // 3. Actual arrival time is valid
    const shouldAnnounce = minutesSinceArrival <= 15 && 
                           !previousAnnouncement && 
                           !isNaN(actualInTime.getTime());

    return shouldAnnounce;

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
private async scheduleCheckinAnnouncements(flight: Flight): Promise<void> {
  const { generatedAnnouncement } = await this.createAnnouncementText(flight, 'checkin');
  this.scheduleAnnouncement(generatedAnnouncement); // Pass only the announcement text
}

private async scheduleBoardingAnnouncements(flight: Flight): Promise<void> {
  const { generatedAnnouncement } = await this.createAnnouncementText(flight, 'boarding');
  this.scheduleAnnouncement(generatedAnnouncement); // Pass only the announcement text
}

private async scheduleCloseAnnouncements(flight: Flight): Promise<void> {
  const { generatedAnnouncement } = await this.createAnnouncementText(flight, 'close');
  this.scheduleAnnouncement(generatedAnnouncement); // Pass only the announcement text
}

private async scheduleArrivedAnnouncements(flight: Flight): Promise<void> {
  const { generatedAnnouncement } = await this.createAnnouncementText(flight, 'arrived');
  this.scheduleAnnouncement(generatedAnnouncement); // Pass only the announcement text
}


// Example for scheduling logic - you can replace this with your own scheduling method
private scheduleAnnouncement(announcementText: string): void {
  // Schedule the announcement, e.g., by sending it to a public address system, 
  // or log it for further processing.
  console.log(`Scheduled Announcement: ${announcementText}`);
}

// Your existing createAnnouncementText remains unchanged
private async createAnnouncementText(
  flight: Flight,
  type: 'checkin' | 'boarding' | 'processing' | 'final' | 'arrived' | 'close'
): Promise<{ generatedAnnouncement: string; flightData: any }> {
  console.log(`Creating announcement text for flight ${flight.ident}, type: ${type}`);

  // Functions to format check-in or gate numbers
  const formatCheckInOrGate = (checkInOrGate: string): string => {
    return checkInOrGate ? checkInOrGate.replace(/^0+/, '') : checkInOrGate;
  };

  // Processing check-in or gate numbers
  const processCheckInOrGate = (checkInOrGate: string): string => {
    const checkInOrGateParts = checkInOrGate.split(',').map(part => formatCheckInOrGate(part.trim()));
    return checkInOrGateParts.map((part) => {
      const num = parseInt(part, 10);
      return num < 10 ? numberToWords(num) : num.toString();
    }).join(' ');
  };

  // Function to convert numbers to words for numbers 1-9
  const numberToWords = (num: number): string => {
    const words: { [key: number]: string } = {
      1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine',
    };
    return words[num] || num.toString();
  };

  let generatedAnnouncement = ''; 
  let flightIcaoCode = flight.ident; 
  let flightNumber = flight.ident.split('').join(' '); 
  let destinationCode = flight.grad; 

  switch (type) {
    case 'checkin':
    case 'processing':
      generatedAnnouncement = `Attention please. ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} to ${flight.grad} is open for check-in at counter ${processCheckInOrGate(flight.checkIn)}`;
      break;
    case 'boarding':
      generatedAnnouncement = `Attention please. ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} to ${flight.grad} is now boarding at gate ${processCheckInOrGate(flight.gate)}`;
      break;
    case 'final':
      generatedAnnouncement = `Final call. This is the final call for ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} to ${flight.grad}. Please proceed immediately to gate ${processCheckInOrGate(flight.gate)}`;
      break;
    case 'arrived':
      generatedAnnouncement = `Dear passengers, ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} has arrived from ${flight.grad}. Please proceed to passport control and then to baggage claim. Thank you and welcome to Montenegro.`;
      break;
    case 'close':
      generatedAnnouncement = `Attention please. The boarding for ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} to ${flight.grad} has now closed. We thank you for your cooperation. We wish you a pleasant flight and see you soon.`;
      break;
    default:
      return { generatedAnnouncement: '', flightData: null };
  }

  // Constructing flightData object
  const flightData = {
    flightIcaoCode, 
    flightNumber, 
    destinationCode, 
    callType: type, 
    gate: type === 'boarding' || type === 'final' ? flight.gate : undefined, 
    filename: `${type}_${flight.ident}_${Date.now()}.mp3`, 
    playedAt: new Date(), 
  };

  // Return the generated text and flight data
  return { generatedAnnouncement, flightData };
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

  private async createSecurityAnnouncement(): Promise<string> {
    const currentTime = this.formatTime(new Date());

    // Log separately using the API
    await this.logSecurityAnnouncement();

    return `Attention please. Dear passengers, may I have your attention please. Do not leave your baggage unattended at any time you are at the airport, ` +
           `as it will be removed for security reasons and may be destroyed. Thank you. ` +
           `The local time is ${currentTime}.`;
        
}
private async logAnnouncement(
  flightData: any,
  type: 'checkin' | 'boarding' | 'processing' | 'final' | 'arrived' | 'close' | 'security'
): Promise<void> {
  // Prepare the data to be sent in the POST request
  const requestBody = {
    flightIcaoCode: flightData.flightIcaoCode,  // 'AB123'
    flightNumber: flightData.flightNumber,      // 'AB 123' (with spaces between digits)
    destinationCode: flightData.destinationCode, // 'City'
    callType: type,                             // Announcement type ('boarding', etc.)
    gate: flightData.gate,                      // 'A1', only included if relevant
    filename: flightData.filename,              // 'boarding_AB123_1634000000000.mp3'
    playedAt: flightData.playedAt.toISOString(), // Format the date to ISO string: '2024-12-07T05:00:00Z'
  };

  try {
    // Send the data as a POST request to the API endpoint
    const response = await fetch('http://localhost:3000/api/logMp3Play', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody), // Send the request body in JSON format
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error('Failed to log announcement:', response.statusText, errorDetails);
    } else {
      console.log('Successfully logged announcement');
    }
  } catch (error) {
    console.error('Error logging announcement:', error);
  }
}



private async logSecurityAnnouncement() {
  // Prepare the request body with necessary fields for security announcements
  const requestBody = {
      flightIcaoCode: 'SEC', // For security announcements, using a placeholder like 'SEC'
      flightNumber: 'SEC',   // Same here, 'SEC' as a placeholder
      destinationCode: 'SEC', // Similarly, 'SEC' placeholder
      callType: 'security',   // Specify the type as 'security'
      gate: 'SEC',            // You can set this to 'SEC' for security announcements
      filename: 'Security Announcement.mp3', // Set a default filename for security
      playedAt: new Date().toISOString() // Current timestamp for when the announcement is played
  };

  // Log the request body to the console for debugging
  console.log('Logging security announcement with body:', requestBody);

  try {
    // Send the request to the API endpoint
    const response = await fetch('/api/logMp3Play', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Log response status for debugging
    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorDetails = await response.text(); // Get detailed error message
      console.error('Failed to log security announcement:', response.statusText, errorDetails);
    } else {
      console.log('Successfully logged security announcement'); // Log success message
    }
  } catch (error) {
    console.error('Error logging security announcement:', error); // Handle fetch errors
  }
}



private scheduleDisabledPassengerAssistanceAnnouncement() {
  // Schedule the announcement every 5 minutes (300000 milliseconds)
  this.scheduledAnnouncementTimer = setInterval(() => {
      if (this.isWithinOperatingHours()) {
          const announcementText = "We are committed to providing assistance for all passengers. If you require special assistance, please notify our staff or use the designated help points throughout the terminal.";
          this.queueCustomAnnouncement(announcementText);
      }
  }, 2700000); // 45 minutes in milliseconds
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

private playNext(): void {
  if (!this.isInitialized || this.queue.length === 0) {
      this.isPlaying = false; 
      return; 
  }

  const item = this.queue.shift(); 

  // Check if item exists and item.text is a string
  if (!item || typeof item.text !== 'string' || !item.text.trim()) { 
      this.isPlaying = false; 
      return; 
  }

  console.log("Playing Announcement:", item.text); 

  const utterance = new SpeechSynthesisUtterance(item.text);
  
  if (this.selectedVoice) { 
      utterance.voice = this.selectedVoice; 
  }
  
  // Fade out background music before TTS announcement
  this.fadeOutVolume(0, 100).then(() => { 
      this.backgroundMusic.volume = 0; // Ensure volume is set to 0 before speaking

      utterance.onend = () => { 
          console.log("Announcement finished.");
          
          // Gradually restore volume after announcement
          this.fadeInVolume(0.5);
          
          // Call playNext to handle the next item in the queue
          this.playNext(); 
      };

      utterance.onerror = (event) => { 
          console.error(`Speech synthesis error: ${event.error}`);
          this.isPlaying = false; 

          // Restore volume on error
          this.fadeInVolume(0.5);

          // Call playNext to handle the next item in the queue
          this.playNext(); 
      };

      const hasTtsText = item.text && item.text.trim() !== '';

      // Play the hardcoded MP3 only if there's TTS text (indicating an announcement)
      if (hasTtsText) {
          console.log("Playing Hardcoded MP3");
          const audio = new Audio('/mp3/Gong_pojacan.mp3');

          audio.onended = () => {
              console.log("Hardcoded MP3 playback finished. Checking for item MP3...");

              // Check if item includes its own MP3
              if (item.mp3) {
                  console.log("Playing Item MP3:", item.mp3);
                  const itemAudio = new Audio(item.mp3);

                  itemAudio.onended = () => {
                      console.log("Item MP3 playback finished. Starting TTS...");
                      window.speechSynthesis.speak(utterance); // Play TTS after item MP3
                  };

                  itemAudio.onerror = (error) => {
                      console.error("Item MP3 playback error:", error);
                      window.speechSynthesis.speak(utterance); // Proceed with TTS on error
                  };

                  itemAudio.play();
              } else {
                  // No item MP3, directly play TTS
                  window.speechSynthesis.speak(utterance);
              }
          };

          audio.onerror = (error) => {
              console.error("Hardcoded MP3 playback error:", error);
              window.speechSynthesis.speak(utterance); // Proceed with TTS if hardcoded MP3 fails
          };

          audio.play(); // Start hardcoded MP3 playback
      } else {
          console.log("No TTS text, skipping airport bell...");
          this.playNext();
      }
  });
}
private fadeOutVolume(targetVolume: number, duration: number): Promise<void> { 
  return new Promise((resolve) => { 
      const stepTime = 100; 
      const steps = duration / stepTime; 
      const currentVolume = this.backgroundMusic.volume;

      let stepIncrement = (targetVolume - currentVolume) / steps;

      const fadeInterval = setInterval(() => { 
          if ((stepIncrement < 0 && this.backgroundMusic.volume > targetVolume) || 
              (stepIncrement > 0 && this.backgroundMusic.volume < targetVolume)) { 
              this.backgroundMusic.volume += stepIncrement; 
          } else { 
              clearInterval(fadeInterval); 
              resolve(); // Resolve the promise when fade out is complete
          } 
      }, stepTime); 
  }); 
}
private fadeInVolume(targetVolume: number, duration: number = 2000): void {
  const stepTime = 100; 
  const steps = duration / stepTime; 
  const currentVolume = this.backgroundMusic.volume;

  let stepIncrement = (targetVolume - currentVolume) / steps;

  const fadeInterval = setInterval(() => {
      if ((stepIncrement > 0 && this.backgroundMusic.volume < targetVolume) ||
          (stepIncrement < 0 && this.backgroundMusic.volume > targetVolume)) {
          this.backgroundMusic.volume += stepIncrement;
      } else {
          clearInterval(fadeInterval);
          this.backgroundMusic.volume = targetVolume; 
      }
  }, stepTime);
}


// Helper method for TTS playback
private playTTS(text: string): void {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.pitch = 0.9;
  utterance.volume = 1;

  if (this.selectedVoice) {
    utterance.voice = this.selectedVoice;
  }

  utterance.onend = () => {
    setTimeout(() => this.playNext(), 1000); // Proceed to the next item
  };

  utterance.onerror = (event) => {
    console.error('TTS Error:', event.error);
    this.playNext(); // Continue with the next item in the queue
  };

  this.synth.speak(utterance);
}


public async queueAnnouncement(flight: Flight, type: 'checkin' | 'boarding' | 'final' | 'arrived' | 'close' | 'earlier') {
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

  // Handle earlier arrival announcements
  if (type === 'earlier') {
      const earlyAnnouncementText = `Attention passengers, ${flight.KompanijaNaziv} flight number ${flight.ident.split('').join(' ')} from ${flight.origin.code} is arriving earlier than scheduled. Landing is expected at ${flight.actual_in}.`;
      this.addToQueue(earlyAnnouncementText, 5, flight.scheduled_out || flight.actual_in || '');
      console.log(`Queued earlier arrival announcement for flight ${flight.ident}`);
      return; // Exit after queuing the earlier announcement
  }

  // Get the announcement text and flight data
  const { generatedAnnouncement } = await this.createAnnouncementText(flight, type);  // <-- Add await here

  // Determine priority based on type
  const priority = type === 'arrived' ? 4 : type === 'final' ? 1 : type === 'close' ? 1 : type === 'boarding' ? 2 : 3;

  this.recordAnnouncement(flight, type); // Record the announcement
  this.addToQueue(generatedAnnouncement, priority, flight.scheduled_out || flight.actual_in || '');
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
    const playIfInHours = async () => {
      if (this.isWithinOperatingHours()) {
          try {
              const announcement = await this.createSecurityAnnouncement();
              this.addToQueue(announcement, 5, this.formatTime(new Date()));
          } catch (error) {
              console.error('Failed to create security announcement:', error);
          }
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