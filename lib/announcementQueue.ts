'use client';

import { FlightData, Flight } from './flightTTS';
import { addAnnouncement } from './audioManager';
import { createMp3Play } from './db/queries';
import { AnnouncementType } from './db/schema';

// Announcement log for arrivals
const arrivalAnnouncementLog: Record<string, { count: number; lastAnnouncementTime: Date }> = {};
const lastAnnouncementTimes: Record<string, Date> = {
  security: new Date(0),
  dangerous_goods: new Date(0),
  special_assistance: new Date(0),
};

const THROTTLE_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

interface Announcement {
  type: 'security' | 'special-assistance' | 'flight' | 'boarding' | 'checkin' | 'close' | 'arrived' | 'dangerous_goods';
  text: string;
  flight?: Flight;
}

// Helper functions remain the same
function parseCheckInOrGateNumbers(input: string): string {
  const numbers = input.split(',')
    .map(num => parseInt(num.trim(), 10))
    .filter(num => !isNaN(num));

  if (numbers.length === 0) {
    return ""; // Return an empty string if no valid numbers are found
  }

  if (numbers.length === 1) {
    return numbers[0].toString(); // Return single number as a string
  }

  const lastNumber = numbers.pop(); // Remove the last number
  return `${numbers.join(', ')} and ${lastNumber}`; // Join with commas and add "and"
}

function parseFlightNumber(flightNumber: string): string {
  const numberToWords: Record<string, string> = {
    '0': 'zero', '1': 'one', '2': 'two', '3': 'three',
    '4': 'four', '5': 'five', '6': 'six', '7': 'seven',
    '8': 'eight', '9': 'nine'
  };
  
  return flightNumber.split('').map(digit => numberToWords[digit] || digit).join(' ');
}

// Announcement generators remain the same
const generateSecurityAnnouncement = () => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `Attention please. Dear passengers, may I have your attention please. Do not leave your baggage unattended at any time you are at the airport, as it will be removed for security reasons and may be destroyed. Thank you. The local time is ${currentTime}.`;
};

const generateDangerousGoodsAnnouncement = () => {
  return `Attention please: Dangerous goods can only be transported by air if prepared by qualified personnel, unless exempt. Some items may be carried in baggage if specific requirements are met. Batteries: Lithium and sodium ion batteries are allowed based on configuration and ratings. Spare batteries are not permitted in checked baggage. Small lithium battery-powered vehicles (e.g., hoverboards) are classified as dangerous goods. Smart Luggage: Baggage with non-removable batteries exceeding 0.3 g lithium or 2.7 Wh is prohibited. Such batteries must be removed and carried in the cabin. For detailed guidance on traveling with dangerous goods, including batteries and battery-powered devices, please visit the IATA Dangerous Goods Regulations website at iata.org/en/publications/dgr. Thank you for your attention.`;
};

const generateSpecialAssistanceAnnouncement = () => {
  return "Dear passengers, we are committed to providing assistance for all passengers. If you require special assistance, please notify our staff or use the designated help points throughout the terminal.";
};

async function logMp3Play(announcement: Announcement) {
  return await createMp3Play({
    flightIcaoCode: announcement.flight?.KompanijaICAO || 'UNKNOWN',
    flightNumber: parseFlightNumber(announcement.flight?.ident || ''),
    destinationCode: announcement.flight?.destination?.code || '',
    callType: announcement.type,
    filename: `${announcement.type}_announcement.mp3`,
    gate: announcement.flight?.gate || undefined
  });
}

const shouldPlayArrivalAnnouncement = (flight: Flight): boolean => {
  const flightKey = `${flight.Kompanija} ${flight.ident}-${flight.origin.code}`;
  const now = new Date();
  
  const arrivalTime = parseTime(flight.scheduled_out);
  const timeSinceArrival = (now.getTime() - arrivalTime.getTime()) / (1000 * 60);

  if (timeSinceArrival > 15) return false;

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
 await Promise.all([...flightData.departures, ...flightData.arrivals].map(async (flight) => {
   const [scheduledHours, scheduledMinutes] = flight.scheduled_out.split(':').map(Number);
   const scheduledTimeInMinutes = scheduledHours * 60 + scheduledMinutes;
   const timeDiff = scheduledTimeInMinutes - currentMinutes;

   console.log(`Flight ${flight.ident}: Time Difference = ${timeDiff} minutes`);
   const flightStatus = flight.status.toLowerCase();

   // Check-in announcements
   if ((flightStatus === 'processing' || flightStatus === 'checkinopen' || flightStatus === 'checkin' || flightStatus === 'check in open') && [90,75,70,60,50,40].includes(timeDiff)) {
     const response = await fetch(`/api/getAnnouncements?airlineCode=${flight.KompanijaICAO}&type=checkin`);
     if (response.ok) {
       const template = await response.json();
       announcements.push({
         type: 'checkin',
         text: template.template
           .replace('{flightNumber}', parseFlightNumber(flight.ident))
           .replace('{destination}', flight.grad)
           .replace('{counters}', parseCheckInOrGateNumbers(flight.checkIn)),
         flight
       });
     }
   }

   // Boarding announcements
   if (flightStatus === 'boarding' && (timeDiff === 30 || timeDiff === 25 || timeDiff === 20 || timeDiff ===15)) {
     const response = await fetch(`/api/getAnnouncements?airlineCode=${flight.KompanijaICAO}&type=boarding`);
     if (response.ok) {
       const template = await response.json();
       announcements.push({
         type: 'boarding',
         text: template.template
           .replace('{flightNumber}', parseFlightNumber(flight.ident))
           .replace('{gate}', parseCheckInOrGateNumbers(flight.gate))
           .replace('{destination}', flight.destination.code),
         flight
       });
     }
   }

   // Flight close announcements
   if (flightStatus === 'close' && (timeDiff ===10 || timeDiff ===7 || timeDiff ===5)) {
     const response = await fetch(`/api/getAnnouncements?airlineCode=${flight.KompanijaICAO}&type=close`);
     if (response.ok) {
       const template = await response.json();
       announcements.push({
         type: 'close',
         text: template.template.replace('{flightNumber}', parseFlightNumber(flight.ident)),
         flight
       });
     }
   }

   // Arrival announcement
   if (flightStatus === 'arrived' && shouldPlayArrivalAnnouncement(flight)) {
     const response = await fetch(`/api/getAnnouncements?airlineCode=${flight.KompanijaICAO}&type=arrived`);
     if (response.ok) {
       const template = await response.json();
       announcements.push({
         type: 'arrived',
         text: template.template.replace('{flightNumber}', parseFlightNumber(flight.ident))
           .replace('{origin}', flight.grad),
         flight
       });
     }
   }
 }));

 // Add periodic announcements
 const currentMinutesNow = now.getMinutes();
 
 if (currentMinutesNow %30 ===0) {
   // Check for security announcement throttle
   if (now.getTime() - lastAnnouncementTimes.security.getTime() > THROTTLE_TIME) {
     announcements.push({
       type: 'security',
       text: generateSecurityAnnouncement()
     });
     lastAnnouncementTimes.security = now; // Update last announcement time
   }

   // Check for dangerous goods announcement throttle
   if (now.getTime() - lastAnnouncementTimes.dangerous_goods.getTime() > THROTTLE_TIME) {
     announcements.push({
       type: 'dangerous_goods',
       text: generateDangerousGoodsAnnouncement()
     });
     lastAnnouncementTimes.dangerous_goods = now; // Update last announcement time
   }
 }

 if (currentMinutesNow %45 ===0) {
   // Check for special assistance announcement throttle
   if (now.getTime() - lastAnnouncementTimes.special_assistance.getTime() > THROTTLE_TIME) {
     announcements.push({
       type: 'special-assistance',
       text: generateSpecialAssistanceAnnouncement()
     });
     lastAnnouncementTimes.special_assistance = now; // Update last announcement time
   }
 }

 // Process announcements using the queue system
 for (const announcement of announcements) {
   await logMp3Play(announcement);
   addAnnouncement(announcement.text);
 }

// Handle periodic audio ads 
/* 
if (currentMinutesNow %30 ===0) { 
await playAudioAd(); 
} 
*/
};

function parseTime(timeString: string): Date {
 const [hours, minutes] = timeString.split(':').map(Number);
 const date = new Date();
 date.setHours(hours, minutes,0,0);
 return date;
}

export type { Announcement };
