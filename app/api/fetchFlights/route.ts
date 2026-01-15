import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Tipovi za API response
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

// Tipovi za naš response
interface FlightResponse {
  ident: string; // Full ident za FlightAware (npr. "4O150")
  flightNumber: string; // Samo broj leta (npr. "150")
  status: string;
  scheduled_out: string;
  estimated_out: string;
  actual_out: string;
  origin: { code: string };
  destination: { code: string };
  grad: string;
  Kompanija: string; // IATA kod kompanije (npr. "4O")
  KompanijaICAO: string;
  KompanijaNaziv: string;
  checkIn: string;
  gate: string;
  TipLeta: string;
}

interface ProcessedData {
  departures: FlightResponse[];
  arrivals: FlightResponse[];
}

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const mapStatus = (statusEN: string, status: string): string => {
  if (status === 'C01PRO') return 'Processing';
  if (status === 'C02BRD') return 'Boarding';
  if (status === 'C03LST') return 'Final Call';
  if (status === 'A09DEP') return 'Departed';
  if (status === 'A06ARR') return 'Arrived';
  if (status === 'G02GCL') return 'Closed';
  if (status === 'A01DLY') return 'Delayed';
  
  return statusEN || 'Scheduled';
};

const formatTime = (time: string): string => {
  if (!time || time.trim() === '') return '';
  return time.replace(/(\d{2})(\d{2})/, '$1:$2');
};

const isoToHHMM = (isoString?: string): string => {
  if (!isoString || isoString.trim() === '') return '';
  
  try {
    // Ukloni timezone dodatak ako postoji
    const cleanTime = isoString.replace('Z[UTC]', '').replace('Z', '');
    const date = new Date(cleanTime);
    
    if (isNaN(date.getTime())) {
      // Ako nije validan ISO format, pokušaj da parsiraš samo vrijeme
      const timeMatch = isoString.match(/(\d{2}):(\d{2})/);
      if (timeMatch && timeMatch[1] && timeMatch[2]) {
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

const mapCommentToStatus = (comment: string): { status: string; statusEN: string } => {
  const commentLower = comment.toLowerCase();
  
  if (commentLower.includes('landed')) {
    return { status: 'A06ARR', statusEN: 'Arrived' };
  }
  if (commentLower.includes('boarding')) {
    return { status: 'C02BRD', statusEN: 'Boarding' };
  }
  if (commentLower.includes('final')) {
    return { status: 'C03LST', statusEN: 'Final Call' };
  }
  if (commentLower.includes('gate')) {
    return { status: 'C01PRO', statusEN: 'Processing' };
  }
  if (commentLower.includes('delayed')) {
    return { status: 'A01DLY', statusEN: 'Delayed' };
  }
  if (commentLower.includes('cancel')) {
    return { status: 'G02GCL', statusEN: 'Canceled' };
  }
  if (commentLower.includes('depart')) {
    return { status: 'A09DEP', statusEN: 'Departed' };
  }
  
  return { status: '', statusEN: 'Scheduled' };
};

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

const extractDateInfo = (isoDate: string): { datum: string; dan: string } => {
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

const convertToFlightResponse = (flight: NaisApiFlight): FlightResponse | null => {
  try {
    const { status, statusEN } = mapCommentToStatus(flight.comment);
    const { datum, dan } = extractDateInfo(flight.schdate);
    
    const tipLeta = flight.AD === 'DEPARTURE' ? 'O' : 'I';
    const grad = extractCity(flight.fromto);
    
    let planirano = isoToHHMM(flight.schtime);
    let predvidjeno = isoToHHMM(flight.esttime);
    const aktuelno = isoToHHMM(flight.acttime);
    
    if (!predvidjeno && planirano) {
      predvidjeno = planirano;
    }

    // RAZLAŽENJE brlet NA IATA KOD I BROJ LETA
    let flightNumber = flight.brlet;
    
    // Ukloni airlineCode iz početka broja leta ako postoji
    if (flight.airlineCode && flight.brlet.startsWith(flight.airlineCode)) {
      flightNumber = flight.brlet.slice(flight.airlineCode.length);
    }

    // Konstruisanje identa (IATA kod + broj leta) za FlightAware link
    const ident = flight.airlineCode ? `${flight.airlineCode}${flightNumber}` : flightNumber;

    const result: FlightResponse = {
      ident, // Full ident za FlightAware (npr. "4O150")
      flightNumber, // Samo broj leta (npr. "150")
      status: mapStatus(statusEN, status),
      scheduled_out: formatTime(planirano),
      estimated_out: formatTime(predvidjeno),
      actual_out: formatTime(aktuelno),
      origin: { code: '' },
      destination: { code: '' },
      grad,
      Kompanija: flight.airlineCode || '',
      KompanijaICAO: flight.airlineICAO || '',
      KompanijaNaziv: flight.operlong || '',
      checkIn: flight.checkinDesk || '',
      gate: flight.gate || '',
      TipLeta: tipLeta,
    };

    // Postavi origin i destination
    if (tipLeta === 'O') {
      result.origin = { code: 'TIV' };
      result.destination = { code: flight.sifFromto || '' };
    } else {
      result.origin = { code: flight.sifFromto || '' };
      result.destination = { code: 'TIV' };
    }

    return result;
  } catch (error) {
    console.error('Error converting flight:', flight, error);
    return null;
  }
};

const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries = 3,
  initialDelay = 1000
): Promise<NaisApiFlight[]> => {
  for (let i = 0; i < retries; i++) {
    try {
      if (i > 0) {
        await delay(initialDelay * Math.pow(2, i - 1)); // Exponential backoff
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
          'Origin': 'https://tiv.nais.aero',
          ...(options.headers || {}),
        },
        redirect: 'follow',
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        console.error('Response not OK:', {
          status: response.status,
          statusText: response.statusText,
        });
        
        if (i === retries - 1) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        continue;
      }

      const text = await response.text();
      
      try {
        const data = JSON.parse(text);
        
        // Proveri da li je data niz
        if (Array.isArray(data)) {
          return data as NaisApiFlight[];
        }
        
        // Ako nije niz, možda je u objektu
        if (data && Array.isArray(data.flights)) {
          return data.flights as NaisApiFlight[];
        }
        
        // Ako nema očekivanog formata, vrati prazan niz
        console.warn('Unexpected API response format');
        return [];
        
      } catch (e) {
        console.error('Failed to parse JSON:', text.substring(0, 200));
        if (i === retries - 1) {
          throw new Error('Response was not valid JSON');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Attempt ${i + 1}/${retries} failed:`, errorMessage);
      if (i === retries - 1) throw error;
    }
  }
  
  throw new Error('All retry attempts failed');
};

// Mock podaci za fallback
const getMockFlights = (): ProcessedData => {
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMinute = now.getMinutes().toString().padStart(2, '0');
  
  return {
    departures: [
      {
        ident: "4O150",
        flightNumber: "150",
        status: "Scheduled",
        scheduled_out: `${currentHour}:${currentMinute}`,
        estimated_out: `${currentHour}:${(parseInt(currentMinute) + 15).toString().padStart(2, '0')}`,
        actual_out: "",
        origin: { code: "TIV" },
        destination: { code: "BEG" },
        grad: "Beograd",
        Kompanija: "4O",
        KompanijaICAO: "AAW",
        KompanijaNaziv: "Air Montenegro",
        checkIn: "1-3",
        gate: "2",
        TipLeta: "O"
      },
      {
        ident: "JU466",
        flightNumber: "466",
        status: "Boarding",
        scheduled_out: `${currentHour}:${(parseInt(currentMinute) + 30).toString().padStart(2, '0')}`,
        estimated_out: `${currentHour}:${(parseInt(currentMinute) + 35).toString().padStart(2, '0')}`,
        actual_out: "",
        origin: { code: "TIV" },
        destination: { code: "BEG" },
        grad: "Beograd",
        Kompanija: "JU",
        KompanijaICAO: "ASL",
        KompanijaNaziv: "Air Serbia",
        checkIn: "4-6",
        gate: "1",
        TipLeta: "O"
      }
    ],
    arrivals: [
      {
        ident: "JU465",
        flightNumber: "465",
        status: "Arrived",
        scheduled_out: `${currentHour}:${(parseInt(currentMinute) - 20).toString().padStart(2, '0')}`,
        estimated_out: `${currentHour}:${(parseInt(currentMinute) - 15).toString().padStart(2, '0')}`,
        actual_out: `${currentHour}:${(parseInt(currentMinute) - 10).toString().padStart(2, '0')}`,
        origin: { code: "BEG" },
        grad: "Beograd",
        destination: { code: "TIV" },
        Kompanija: "JU",
        KompanijaICAO: "ASL",
        KompanijaNaziv: "Air Serbia",
        checkIn: "",
        gate: "1",
        TipLeta: "I"
      },
      {
        ident: "W61832",
        flightNumber: "1832",
        status: "Delayed",
        scheduled_out: `${currentHour}:${(parseInt(currentMinute) - 10).toString().padStart(2, '0')}`,
        estimated_out: `${currentHour}:${(parseInt(currentMinute) + 5).toString().padStart(2, '0')}`,
        actual_out: "",
        origin: { code: "BEG" },
        grad: "Beograd",
        destination: { code: "TIV" },
        Kompanija: "W6",
        KompanijaICAO: "WZZ",
        KompanijaNaziv: "Wizz Air",
        checkIn: "",
        gate: "2",
        TipLeta: "I"
      }
    ]
  };
};

export async function GET(): Promise<NextResponse> {
  try {
    const url = 'https://tiv.nais.aero/as-frontend/schedule/current';
    
    const options: RequestInit = {
      method: 'GET',
      cache: 'no-store',
    };

    let flightsData: NaisApiFlight[] = [];
    
    try {
      // Prvo pokušaj da dobiješ Cloudflare challenge ako postoji
      const landingResponse = await fetch('https://tiv.nais.aero/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      
      console.log('Landing page status:', landingResponse.status);
      
      // Sačekaj malo pre nego što pokušaš API
      await delay(1000);
      
      // Pokušaj da dohvatiš prave podatke
      flightsData = await fetchWithRetry(url, options);
      
    } catch (apiError) {
      console.log('Real API failed, using mock data:', apiError);
      const mockData = getMockFlights();
      return NextResponse.json({
        ...mockData,
        timestamp: new Date().toISOString(),
        source: 'mock-data',
        note: 'API is currently unavailable'
      });
    }
    
    // Procesiraj prave podatke
    const allFlights = flightsData
      .map(convertToFlightResponse)
      .filter((flight): flight is FlightResponse => flight !== null);
    
    const processedData: ProcessedData = {
      departures: allFlights.filter(flight => flight.TipLeta === 'O'),
      arrivals: allFlights.filter(flight => flight.TipLeta === 'I'),
    };
    
    return NextResponse.json({
      ...processedData,
      timestamp: new Date().toISOString(),
      source: 'live-api',
      totalFlights: allFlights.length
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Critical error fetching flight data:', errorMessage);
    
    // Fallback na mock podatke
    const mockData = getMockFlights();
    return NextResponse.json({
      ...mockData,
      timestamp: new Date().toISOString(),
      source: 'fallback-mock',
      error: errorMessage,
      note: 'Using fallback data due to critical error'
    });
  }
}

// Cache strategija za Edge Functions
export const revalidate = 60; // Revalidiraj svakih 60 sekundi