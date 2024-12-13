'use client';

import { FlightData, Flight } from './flightTTS';
import { playTTSAnnouncement, playGongSound,playAudioAd  } from './audioManager';

// Announcement log for arrivals
const arrivalAnnouncementLog: Record<string, { count: number; lastAnnouncementTime: Date }> = {};

interface Announcement {
  type: 'security' | 'special-assistance' | 'flight'  | 'boarding'  | 'checkin'  | 'close'  | 'arrived';
  text: string;
  flight?: Flight;
}

// Function to parse check-in or gate numbers
function parseCheckInOrGateNumbers(input: string): number[] {
  return input.split(',').map(num => parseInt(num.trim(), 10)).filter(num => !isNaN(num));
}

// Function to convert flight number to words
function parseFlightNumber(flightNumber: string): string {
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
    '9': 'nine'
  };

  // Convert each digit to its corresponding word
  return flightNumber.split('').map(digit => numberToWords[digit] || digit).join(' ');
}

const generateSecurityAnnouncement = () => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `Attention please. Dear passengers, may I have your attention please. Do not leave your baggage unattended at any time you are at the airport, as it will be removed for security reasons and may be destroyed. Thank you. The local time is ${currentTime}.`;
};

const generateSpecialAssistanceAnnouncement = () => {
  return "Dear passengers, We are committed to providing assistance for all passengers. If you require special assistance, please notify our staff or use the designated help points throughout the terminal.";
};

const logMp3Play = async (announcement: Announcement) => {
  try {
    const payload = {
      flightIcaoCode: announcement.flight?.KompanijaICAO || 'SEC',
      flightNumber: announcement.flight?.ident || 'SEC',
      destinationCode: announcement.flight?.destination?.code || 'SEC',
      callType: announcement.type,
      gate: announcement.flight?.gate,
      filename: `${announcement.flight?.ident || 'security'}_${announcement.type}_${Date.now()}.mp3`,
      playedAt: new Date()
    };

    await fetch('/api/logMp3Play', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Error logging MP3 play:', error);
  }
};

const shouldPlayArrivalAnnouncement = (flight: Flight): boolean => {
  const flightKey = `${flight.Kompanija} ${flight.ident}-${flight.origin.code}`;
  const now = new Date();
  const arrivalTime = parseTime(flight.scheduled_out);
  
  // Calculate the difference between current time and arrival time
  const timeSinceArrival = (now.getTime() - arrivalTime.getTime()) / (1000 * 60); // difference in minutes
  
  // Do not play announcements if more than 15 minutes have passed
  if (timeSinceArrival > 15) {
    return false;
  }

  // Initialize log for this flight if it doesn't exist
  if (!arrivalAnnouncementLog[flightKey]) {
    arrivalAnnouncementLog[flightKey] = { count: 0, lastAnnouncementTime: new Date(0) };
  }

  const log = arrivalAnnouncementLog[flightKey];

  // First announcement when the plane lands
  if (log.count === 0) {
    log.count++;
    log.lastAnnouncementTime = now;
    return true;
  }

  // Second and third announcements are made every 5 minutes
  const minutesSinceLastAnnouncement = (now.getTime() - log.lastAnnouncementTime.getTime()) / (1000 * 60);
  
  if (log.count < 3 && minutesSinceLastAnnouncement >= 5) {
    log.count++;
    log.lastAnnouncementTime = now;
    return true;
  }

  return false;
};

export const processAnnouncements = async (flightData: FlightData) => {
    const announcements: Announcement[] = [];
    const now = new Date();
  
    // Get current time in minutes since midnight
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
    // Process departures and arrivals
    [...flightData.departures, ...flightData.arrivals].forEach(flight => {
      // Convert scheduled_out (e.g., "10:40") to total minutes since midnight
      const [scheduledHours, scheduledMinutes] = flight.scheduled_out.split(':').map(Number);
      const scheduledTimeInMinutes = scheduledHours * 60 + scheduledMinutes;
  
      // Calculate time difference
      const timeDiff = scheduledTimeInMinutes - currentMinutes; // Difference in minutes
// Log the time difference and flight identifier
console.log(`Flight ${flight.ident}: Time Difference = ${timeDiff} minutes`);
      // Convert flight status to lowercase for case-insensitive comparison
      const flightStatus = flight.status.toLowerCase();
  
      // Check-in announcements for "Processing" or "CheckInOpen" status at specific times
      if ((flightStatus === 'processing' || flightStatus === 'checkinopen' || flightStatus === 'checkin' || flightStatus === 'check in open') && 
          (timeDiff === 90 || timeDiff === 70 || timeDiff === 60 || timeDiff === 50 || timeDiff === 40)) {
        announcements.push({
          type: 'checkin',
          text: `Check-in for flight ${flight.Kompanija} ${parseFlightNumber(flight.ident)} to ${flight.grad} is now open at counter ${parseCheckInOrGateNumbers(flight.checkIn).join(', ')}.`,
          flight
        });
      }
  
      // Boarding announcements
      if (flightStatus === 'boarding' && (timeDiff === 30 || timeDiff === 25 || timeDiff === 20 || timeDiff === 15)) {
        announcements.push({
          type: 'boarding',
          text: `Boarding for flight ${flight.Kompanija} ${parseFlightNumber(flight.ident)} to ${flight.destination.code} is now beginning at gate ${parseCheckInOrGateNumbers(flight.gate).join(', ')}.`,
          flight
        });
      }
  
      // Flight close announcements
      if (flightStatus === 'close' && (timeDiff === 10 || timeDiff === 7 || timeDiff === 5)) {
        announcements.push({
          type: 'close',
          text: `Attention. Flight ${flight.Kompanija} ${parseFlightNumber(flight.ident)} gate is now closed. Final call for boarding.`,
          flight
        });
      }
  
      // Arrival announcement
      if (flightStatus === 'arrived' && shouldPlayArrivalAnnouncement(flight)) {
        announcements.push({
          type: 'arrived',
          text: `${flight.Kompanija} announces that the flight ${parseFlightNumber(flight.ident)} from ${flight.grad} has now arrived at Tivat Airport. Welcome to Montenegro.`,
          flight
        });
      }
    });
  
     // Add periodic announcements
     const currentMinutesNow = now.getMinutes();
     if (currentMinutesNow % 30 === 0) {
       announcements.push({
         type: 'security',
         text: generateSecurityAnnouncement()
       });
     }
  
     if (currentMinutesNow % 45 === 0) {
       announcements.push({
         type: 'special-assistance',
         text: generateSpecialAssistanceAnnouncement()
       });
     }
    // Add periodic audio ads every half hour.
    setInterval(async () => {
        await playAudioAd(); // Play ads.mp3 every thirty minutes.
      }, 60 * 60 * 1000); // Every thirty minutes
     // Process announcements queue
     for (const announcement of announcements) {
       console.log("Playing announcement:", announcement.text); // Debugging line
       await playGongSound();
       await logMp3Play(announcement);
       await playTTSAnnouncement(announcement.text);
     }
  };


function parseTime(timeString: string): Date {
   const [hours, minutes] = timeString.split(':').map(Number);
   const date = new Date();
   date.setHours(hours, minutes, 0, 0);
   return date;
}

export type { Announcement };
