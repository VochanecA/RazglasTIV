import { NextResponse } from 'next/server';
import { setTimeout } from 'timers/promises';

interface RawFlight {
  Updateovano: string;
  Datum: string;
  Dan: string;
  TipLeta: string;
  KompanijaNaziv: string;
  Kompanija: string;
  KompanijaICAO: string;
  BrojLeta: string;
  IATA: string;
  Grad: string;
  Planirano: string;
  Predvidjeno: string;
  Aktuelno: string;
  Terminal: string;
  CheckIn: string;
  Gate: string;
  Aerodrom: string;
  Status: string;
  StatusEN: string;
}

// Interface za novi API odgovor (prema stvarnoj strukturi)
interface NaisApiFlight {
  AD: 'DEPARTURE' | 'ARRIVAL';
  acttime: string;
  airlineCode: string;
  airlineICAO: string;
  brlet: string;
  checkinDesk: string;
  codeShareFlights: string;
  comment: string;
  esttime: string;
  fromto: string;
  gate: string;
  operlong: string;
  parkingPosition: string;
  schdate: string;
  schtime: string;
  sifFromto: string;
  sifVia: string;
  via: string;
}

const mapStatus = (statusEN: string, status: string): string => {
  if (status === 'C01PRO') return 'Processing';
  if (status === 'C02BRD') return 'Boarding';
  if (status === 'C03LST') return 'Final Call';
  if (status === 'A09DEP') return 'Departed';
  if (status === 'A06ARR') return 'Arrived';
  if (status === 'G02GCL') return 'Close';
  if (status === 'A01DLY') return 'Delayed';
  
  return statusEN || 'Scheduled';
};

const formatTime = (time: string): string => {
  if (!time || time.trim() === '') return '';
  return time.replace(/(\d{2})(\d{2})/, '$1:$2');
};

// Konvertovanje ISO vremena u HHMM format
const isoToHHMM = (isoString?: string): string => {
  if (!isoString || isoString.trim() === '') return '';
  
  try {
    // Ukloni timezone dodatak ako postoji
    const cleanTime = isoString.replace('Z[UTC]', '').replace('Z', '');
    const date = new Date(cleanTime);
    
    if (isNaN(date.getTime())) {
      // Ako nije validan ISO format, pokušaj da parsiraš samo vrijeme
      const timeMatch = isoString.match(/(\d{2}):(\d{2})/);
      if (timeMatch) {
        return timeMatch[1] + timeMatch[2];
      }
      return '';
    }
    
    // Uzimamo UTC sate i minute
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}${minutes}`;
  } catch (error) {
    console.error('Error converting time:', isoString, error);
    return '';
  }
};

// Mapiranje komentara u status
const mapCommentToStatus = (comment: string): { status: string, statusEN: string } => {
  comment = comment.toLowerCase();
  
  if (comment.includes('landed')) {
    return { status: 'A06ARR', statusEN: 'Arrived' };
  }
  if (comment.includes('boarding')) {
    return { status: 'C02BRD', statusEN: 'Boarding' };
  }
  if (comment.includes('final')) {
    return { status: 'C03LST', statusEN: 'Final Call' };
  }
  if (comment.includes('gate')) {
    return { status: 'C01PRO', statusEN: 'Processing' };
  }
  if (comment.includes('delayed')) {
    return { status: 'A01DLY', statusEN: 'Delayed' };
  }
  if (comment.includes('cancel')) {
    return { status: 'G02GCL', statusEN: 'Canceled' };
  }
  if (comment.includes('depart')) {
    return { status: 'A09DEP', statusEN: 'Departed' };
  }
  
  return { status: '', statusEN: 'Scheduled' };
};

const generateFingerprint = () => {
  const platforms = ['Windows NT 10.0; Win64; x64', 'Macintosh; Intel Mac OS X 10_15_7'];
  const browsers = [
    'Chrome/120.0.0.0 Safari/537.36',
    'Chrome/121.0.0.0 Safari/537.36',
    'Chrome/122.0.0.0 Safari/537.36'
  ];
  
  return {
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    browser: browsers[Math.floor(Math.random() * browsers.length)]
  };
};

const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 3000
): Promise<any> => {
  const fingerprint = generateFingerprint();
  
  for (let i = 0; i < retries; i++) {
    try {
      if (i > 0) {
        await setTimeout(Math.random() * 1000 + delay);
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': `Mozilla/5.0 (${fingerprint.platform}) AppleWebKit/537.36 (KHTML, like Gecko) ${fingerprint.browser}`,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Referer': 'https://tiv.nais.aero/',
          'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
          ...options.headers,
        },
      });

      const text = await response.text();
      
      if (!response.ok) {
        console.error('Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          body: text.substring(0, 200)
        });
        
        if (i === retries - 1) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        continue;
      }

      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON:', text.substring(0, 200));
        throw new Error('Response was not valid JSON');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Attempt ${i + 1}/${retries} failed:`, errorMessage);
      if (i === retries - 1) throw error;
    }
  }
};

// Ekstrakcija grada iz fromto polja
const extractCity = (fromto: string): string => {
  if (!fromto) return '';
  
  // Pokušaj da izvučeš grad (prvu riječ prije "Airport")
  const match = fromto.match(/(.+?)\s*(Airport|Aerodrom|Airporti)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Ako nema "Airport", vrati cijeli string bez posljednje riječi
  const parts = fromto.split(' ');
  if (parts.length > 1) {
    return parts.slice(0, -1).join(' ');
  }
  
  return fromto;
};

// Ekstrakcija datuma iz schdate
const extractDateInfo = (isoDate: string): { datum: string, dan: string } => {
  try {
    const cleanDate = isoDate.replace('Z[UTC]', '').replace('Z', '');
    const date = new Date(cleanDate);
    
    if (isNaN(date.getTime())) {
      // Ako nije validan datum, koristi trenutni
      const now = new Date();
      const days = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];
      const dan = days[now.getDay()];
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      
      return {
        datum: `${day}.${month}.${year}`,
        dan: dan
      };
    }
    
    const days = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];
    const dan = days[date.getDay()];
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return {
      datum: `${day}.${month}.${year}`,
      dan: dan
    };
  } catch (error) {
    console.error('Error extracting date:', isoDate, error);
    const now = new Date();
    const days = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];
    
    return {
      datum: `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()}`,
      dan: days[now.getDay()]
    };
  }
};

// Konvertuj NaisApiFlight u RawFlight
// Konvertuj NaisApiFlight u RawFlight
const convertToRawFlight = (flight: NaisApiFlight, index: number): RawFlight => {
  const { status, statusEN } = mapCommentToStatus(flight.comment);
  const { datum, dan } = extractDateInfo(flight.schdate);
  
  // Određivanje tipa leta
  const tipLeta = flight.AD === 'DEPARTURE' ? 'O' : 'I';
  
  // Izvlačenje grada iz fromto polja
  const grad = extractCity(flight.fromto);
  
  // Određivanje vremena
  let planirano = isoToHHMM(flight.schtime);
  let predvidjeno = isoToHHMM(flight.esttime);
  let aktuelno = isoToHHMM(flight.acttime);
  
  // Ako nema estimated time, koristi scheduled
  if (!predvidjeno && planirano) {
    predvidjeno = planirano;
  }

  // RAZLAŽENJE brlet NA AIRLINE CODE I BROJ LETA
  // brlet je u formatu "4O150" gde je "4O" IATA kod, "150" broj leta
  // Ako brlet već uključuje airlineCode, koristimo samo broj leta za ident
  let brojLeta = flight.brlet;
  
  // Ukloni airlineCode iz početka broja leta ako postoji
  if (flight.airlineCode && flight.brlet.startsWith(flight.airlineCode)) {
    brojLeta = flight.brlet.slice(flight.airlineCode.length);
  }

  return {
    Updateovano: new Date().toLocaleString('sr-RS'),
    Datum: datum,
    Dan: dan,
    TipLeta: tipLeta,
    KompanijaNaziv: flight.operlong || '',
    Kompanija: flight.airlineCode || '', // IATA kod kompanije (npr. "4O")
    KompanijaICAO: flight.airlineICAO || '',
    BrojLeta: brojLeta, // Samo broj leta (npr. "150")
    IATA: flight.sifFromto || '',
    Grad: grad,
    Planirano: planirano,
    Predvidjeno: predvidjeno,
    Aktuelno: aktuelno,
    Terminal: '', // Novi API nema terminal informacije
    CheckIn: flight.checkinDesk || '',
    Gate: flight.gate || '',
    Aerodrom: 'TIV',
    Status: status,
    StatusEN: statusEN || 'Scheduled'
  };
};

export async function GET() {
  try {
    const url = 'https://tiv.nais.aero/as-frontend/schedule/current';
    
    const options = {
      method: 'GET',
      cache: 'no-store' as RequestCache,
    };

    const response: NaisApiFlight[] = await fetchWithRetry(url, options);
    
    // Konvertuj sve letove u RawFlight format
    const rawData: RawFlight[] = response.map((flight, index) => convertToRawFlight(flight, index));


// U processedData sekciji u route.ts
const processedData = {
  departures: rawData
    .filter((flight) => flight.TipLeta === 'O')
    .map((flight) => ({
      ident: `${flight.BrojLeta}`, // Ovo će biti samo broj leta (npr. "150")
      status: mapStatus(flight.StatusEN, flight.Status),
      scheduled_out: formatTime(flight.Planirano),
      estimated_out: formatTime(flight.Predvidjeno),
      actual_out: formatTime(flight.Aktuelno),
      origin: { code: 'TIV' },
      destination: { code: flight.IATA },
      grad: flight.Grad,
      Kompanija: flight.Kompanija, // IATA kod kompanije (npr. "4O")
      KompanijaICAO: flight.KompanijaICAO,
      KompanijaNaziv: flight.KompanijaNaziv,
      checkIn: flight.CheckIn,
      gate: flight.Gate,
      TipLeta: flight.TipLeta,
    })),
  arrivals: rawData
    .filter((flight) => flight.TipLeta === 'I')
    .map((flight) => ({
      ident: `${flight.BrojLeta}`, // Ovo će biti samo broj leta (npr. "680")
      status: mapStatus(flight.StatusEN, flight.Status),
      scheduled_out: formatTime(flight.Planirano),
      estimated_out: formatTime(flight.Predvidjeno),
      actual_out: formatTime(flight.Aktuelno),
      origin: { code: flight.IATA },
      grad: flight.Grad,
      destination: { code: 'TIV' },
      Kompanija: flight.Kompanija, // IATA kod kompanije (npr. "JU")
      KompanijaICAO: flight.KompanijaICAO,
      KompanijaNaziv: flight.KompanijaNaziv,
      checkIn: flight.CheckIn,
      gate: flight.Gate,
      TipLeta: flight.TipLeta
    })),
};

    return NextResponse.json(processedData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching flight data:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to fetch flight data', details: errorMessage },
      { status: 500 }
    );
  }
}