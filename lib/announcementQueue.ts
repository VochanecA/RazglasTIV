'use client';

import { FlightData, Flight } from './flightTTS';
import { playTTSAnnouncement, playGongSound, playAudioAd } from './audioManager';

// Announcement log for arrivals
const arrivalAnnouncementLog: Record<string, { count: number; lastAnnouncementTime: Date }> = {};

interface Announcement {
  type: 'security' | 'special-assistance' | 'flight' | 'boarding' | 'checkin' | 'close' | 'arrived' | 'dangerous_goods';
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

  return flightNumber.split('').map(digit => numberToWords[digit] || digit).join(' ');
}

const generateSecurityAnnouncement = () => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `Attention please. Dear passengers, may I have your attention please. Do not leave your baggage unattended at any time you are at the airport, as it will be removed for security reasons and may be destroyed. Thank you. The local time is ${currentTime}.`;
};

const generateDangerousGoodsAnnouncement = () => {
  return `Attention Passengers: Dangerous goods can only be transported by air if prepared by qualified personnel, unless exempt. Some items may be carried in baggage if specific requirements are met. Batteries: Lithium and sodium ion batteries are allowed based on configuration and ratings. Spare batteries are not permitted in checked baggage. Small lithium battery-powered vehicles (e.g., hoverboards) are classified as dangerous goods. Smart Luggage: Baggage with non-removable batteries exceeding 0.3 g lithium or 2.7 Wh is prohibited. Such batteries must be removed and carried in the cabin. For detailed guidance on traveling with dangerous goods, including batteries and battery-powered devices, please visit the IATA Dangerous Goods Regulations website at iata.org/en/publications/dgr. Thank you for your attention.`;
};

const generateSpecialAssistanceAnnouncement = () => {
  return "Dear passengers, we are committed to providing assistance for all passengers. If you require special assistance, please notify our staff or use the designated help points throughout the terminal.";
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
  
  const timeSinceArrival = (now.getTime() - arrivalTime.getTime()) / (1000 * 60); // difference in minutes
  
  if (timeSinceArrival > 15) {
    return false;
  }

  if (!arrivalAnnouncementLog[flightKey]) {
    arrivalAnnouncementLog[flightKey] = { count: 0, lastAnnouncementTime: new Date(0) };
  }

  const log = arrivalAnnouncementLog[flightKey];

  if (log.count === 0) {
    log.count++;
    log.lastAnnouncementTime = now;
    return true;
  }

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
  
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
    // Process departures and arrivals
    [...flightData.departures, ...flightData.arrivals].forEach(flight => {
      const [scheduledHours, scheduledMinutes] = flight.scheduled_out.split(':').map(Number);
      const scheduledTimeInMinutes = scheduledHours * 60 + scheduledMinutes;
  
      const timeDiff = scheduledTimeInMinutes - currentMinutes; // Difference in minutes
      console.log(`Flight ${flight.ident}: Time Difference = ${timeDiff} minutes`);
      
      const flightStatus = flight.status.toLowerCase();
  
      // Check-in announcements
      if ((flightStatus === 'processing' || flightStatus === 'checkinopen' || flightStatus === 'checkin' || flightStatus === 'check in open') && 
          (timeDiff === 90 || timeDiff === 70 || timeDiff === 60 || timeDiff === 50 || timeDiff === 40)) {
        announcements.push({
          type: 'checkin',
          text: `Check-in for flight ${flight.KompanijaNaziv} ${parseFlightNumber(flight.ident)} to ${flight.grad} is now open at counter ${parseCheckInOrGateNumbers(flight.checkIn).join(', ')}.`,
          flight
        });
      }
  
      // Boarding announcements
      if (flightStatus === 'boarding' && (timeDiff === 30 || timeDiff === 25 || timeDiff === 20 || timeDiff === 15)) {
        announcements.push({
          type: 'boarding',
          text: `Boarding for flight ${flight.KompanijaNaziv} ${parseFlightNumber(flight.ident)} to ${flight.destination.code} is now beginning at gate ${parseCheckInOrGateNumbers(flight.gate).join(', ')}.`,
          flight
        });
      }
  
      // Flight close announcements
      if (flightStatus === 'close' && (timeDiff === 10 || timeDiff === 7 || timeDiff === 5)) {
        announcements.push({
          type: 'close',
          text: `Attention. Flight ${flight.KompanijaNaziv} ${parseFlightNumber(flight.ident)} gate is now closed. Final call for boarding.`,
          flight
        });
      }
  
      // Arrival announcement
      if (flightStatus === 'arrived' && shouldPlayArrivalAnnouncement(flight)) {
        announcements.push({
          type: 'arrived',
          text: `${flight.KompanijaNaziv} announces that the flight ${parseFlightNumber(flight.ident)} from ${flight.grad} has now arrived at Tivat Airport. Welcome to Montenegro.`,
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

       // Add dangerous goods announcement alongside security announcement
       announcements.push({
         type: 'dangerous_goods', // You can use a different type if needed
         text: generateDangerousGoodsAnnouncement()
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
         await playAudioAd(); // Play ads.mp3 every 240 minutes.
       }, 240 * 60 * 1000); // Every thirty minutes
  
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
