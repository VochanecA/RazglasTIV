// import { NextResponse } from 'next/server';

// interface RawFlight {
//   Updateovano: string;
//   Datum: string;
//   Dan: string;
//   TipLeta: string;
//   KompanijaNaziv: string;
//   Kompanija: string;
//   KompanijaICAO: string;
//   BrojLeta: string;
//   IATA: string;
//   Grad: string;
//   Planirano: string;
//   Predvidjeno: string;
//   Aktuelno: string;
//   Terminal: string;
//   CheckIn: string;
//   Gate: string;
//   Aerodrom: string;
//   Status: string;
//   StatusEN: string;
// }

// const mapStatus = (statusEN: string, status: string): string => {
//   if (status === 'C01PRO') return 'Processing';
//   if (status === 'C02BRD') return 'Boarding';
//   if (status === 'C03LST') return 'Final Call';
//   if (status === 'A09DEP') return 'Departed';
//   if (status === 'A06ARR') return 'Arrived';
//   if (status === 'G02GCL') return 'Closed';
//   return statusEN || 'Scheduled';
// };

// const formatTime = (time: string): string => {
//   if (!time || time.trim() === '') return '';
//   return time.replace(/(\d{2})(\d{2})/, '$1:$2');
// };

// const fetchWithRetry = async (
//   url: string,
//   options: RequestInit,
//   retries = 10,
//   delay = 1000
// ): Promise<any> => {
//   for (let i = 0; i < retries; i++) {
//     try {
//       const response = await fetch(url, options);
//       if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`);
//       }
//       return response.json();
//     } catch (error) {
//       if (i === retries - 1) {
//         throw error;
//       }
//       console.warn(`Retrying fetch... (${i + 1}/${retries})`);
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// };

// export async function GET() {
//   try {
//     const url = `https://montenegroairports.com/aerodromixs/cache-flights.php?airport=tv&timestamp=${Date.now()}`;
//     const options = {
//       headers: {
//         'User-Agent':
//           'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
//       },
//       next: { revalidate: 60 }, // Cache for 1 minute
//     };

//     const rawData: RawFlight[] = await fetchWithRetry(url, options);

//     const processedData = {
//       departures: rawData
//         .filter((flight) => flight.TipLeta === 'O')
//         .map((flight) => ({
//           ident: `${flight.BrojLeta}`,
             
//           status: mapStatus(flight.StatusEN, flight.Status),
//           scheduled_out: formatTime(flight.Planirano),
//           estimated_out: formatTime(flight.Predvidjeno),
//           actual_out: formatTime(flight.Aktuelno),
//           origin: { code: 'TIV' },
//           destination: { code: flight.IATA },
//           grad: flight.Grad,
//           Kompanija: flight.Kompanija,
//           KompanijaICAO: flight.KompanijaICAO,
//           KompanijaNaziv: flight.KompanijaNaziv,
//           checkIn: flight.CheckIn,
//           gate: '2,3',
//           TipLeta: flight.TipLeta,
//         })),
//       arrivals: rawData
//         .filter((flight) => flight.TipLeta === 'I')
//         .map((flight) => ({
//           ident: `${flight.BrojLeta}`,
//           status: mapStatus(flight.StatusEN, flight.Status),
//           scheduled_out: formatTime(flight.Planirano),
//           estimated_out: formatTime(flight.Predvidjeno),
//           actual_out: formatTime(flight.Aktuelno),
//           origin: { code: flight.IATA },
//           grad: flight.Grad,
//           destination: { code: 'TIV' },
//           Kompanija: flight.Kompanija,
//           KompanijaICAO: flight.KompanijaICAO,
//           KompanijaNaziv: flight.KompanijaNaziv,
//           checkIn: flight.CheckIn,
//           gate: flight.Gate,
//           TipLeta: flight.TipLeta
//         })),
//     };

//     return NextResponse.json(processedData);
//   } catch (error) {
//     console.error('Error fetching flight data:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch flight data' },
//       { status: 500 }
//     );
//   }
// }





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

const mapStatus = (statusEN: string, status: string): string => {
  if (status === 'C01PRO') return 'Processing';
  if (status === 'C02BRD') return 'Boarding';
  if (status === 'C03LST') return 'Final Call';
  if (status === 'A09DEP') return 'Departed';
  if (status === 'A06ARR') return 'Arrived';
  if (status === 'G02GCL') return 'Close'; // Changed from 'Closed' to 'Close' to match the original code logic 08.07.2025
  if (status === 'A01DLY') return 'Delayed';
 
  return statusEN || 'Scheduled';
};

const formatTime = (time: string): string => {
  if (!time || time.trim() === '') return '';
  return time.replace(/(\d{2})(\d{2})/, '$1:$2');
};

// Generate a plausible browser fingerprint
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
  let cookies = '';
  const fingerprint = generateFingerprint();
  
  // Try to establish a session first
  try {
    // First visit the homepage
    const homeResponse = await fetch('https://montenegroairports.com/', {
      headers: {
        'User-Agent': `Mozilla/5.0 (${fingerprint.platform}) AppleWebKit/537.36 (KHTML, like Gecko) ${fingerprint.browser}`,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      }
    });

    // Get any cookies
    const setCookieHeader = homeResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      cookies = setCookieHeader.split(',').map(cookie => cookie.split(';')[0]).join('; ');
    }

    // Wait a bit to simulate human behavior
    await setTimeout(1000);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('Failed to establish initial session:', errorMessage);
  }

  for (let i = 0; i < retries; i++) {
    try {
      // Add a small random delay between attempts
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
          'Referer': 'https://montenegroairports.com/',
          'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
          'Cookie': cookies,
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
        
        // If we get a Cloudflare challenge, wait longer before retrying
        if (text.includes('Just a moment')) {
          await setTimeout(5000);
        }
        
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

export async function GET() {
  try {
    const timestamp = Date.now();
    const url = `https://montenegroairports.com/aerodromixs/cache-flights.php?airport=tv&timestamp=${timestamp}`;
    
    const options = {
      method: 'GET',
      cache: 'no-store' as RequestCache,
    };

    const rawData: RawFlight[] = await fetchWithRetry(url, options);

    const processedData = {
      departures: rawData
        .filter((flight) => flight.TipLeta === 'O')
        .map((flight) => ({
          ident: `${flight.BrojLeta}`,
          status: mapStatus(flight.StatusEN, flight.Status),
          scheduled_out: formatTime(flight.Planirano),
          estimated_out: formatTime(flight.Predvidjeno),
          actual_out: formatTime(flight.Aktuelno),
          origin: { code: 'TIV' },
          destination: { code: flight.IATA },
          grad: flight.Grad,
          Kompanija: flight.Kompanija,
          KompanijaICAO: flight.KompanijaICAO,
          KompanijaNaziv: flight.KompanijaNaziv,
          checkIn: flight.CheckIn,
          gate: flight.Gate,
          TipLeta: flight.TipLeta,
        })),
      arrivals: rawData
        .filter((flight) => flight.TipLeta === 'I')
        .map((flight) => ({
          ident: `${flight.BrojLeta}`,
          status: mapStatus(flight.StatusEN, flight.Status),
          scheduled_out: formatTime(flight.Planirano),
          estimated_out: formatTime(flight.Predvidjeno),
          actual_out: formatTime(flight.Aktuelno),
          origin: { code: flight.IATA },
          grad: flight.Grad,
          destination: { code: 'TIV' },
          Kompanija: flight.Kompanija,
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
