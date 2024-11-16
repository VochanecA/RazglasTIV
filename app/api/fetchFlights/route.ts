import { NextResponse } from 'next/server';

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
  if (status === 'G02GCL') return 'Close';
  return statusEN || 'Scheduled';
};

const formatTime = (time: string): string => {
  if (!time || time.trim() === '') return '';
  return time.replace(/(\d{2})(\d{2})/, '$1:$2');
};

export async function GET() {
  try {
    const response = await fetch('https://montenegroairports.com/aerodromixs/cache-flights.php?airport=tv', {
      next: { revalidate: 60 } // Cache for 1 minute
    });

    if (!response.ok) {
      throw new Error('Failed to fetch flight data');
    }

    const rawData: RawFlight[] = await response.json();

    const processedData = {
      departures: rawData
        .filter(flight => flight.TipLeta === 'O')
        .map(flight => ({
          ident: `${flight.BrojLeta}`,
          status: mapStatus(flight.StatusEN, flight.Status),
          scheduled_out: formatTime(flight.Planirano),
          estimated_out: formatTime(flight.Predvidjeno),
          actual_out: formatTime(flight.Aktuelno),
          origin: { code: 'TIV' },
          destination: { code: flight.IATA },
          grad:  flight.Grad ,
          Kompanija: flight.Kompanija,
          KompanijaICAO: flight.KompanijaICAO,
          KompanijaNaziv: flight.KompanijaNaziv,
          checkIn: flight.CheckIn,
          gate: flight.Gate
        })),
      arrivals: rawData
        .filter(flight => flight.TipLeta === 'I')
        .map(flight => ({
          ident: `${flight.BrojLeta}`,
          status: mapStatus(flight.StatusEN, flight.Status),
          scheduled_out: formatTime(flight.Planirano),
          estimated_out: formatTime(flight.Predvidjeno),
          actual_out: formatTime(flight.Aktuelno),
          origin: { code: flight.IATA },
          grad:  flight.Grad ,
          destination: { code: 'TIV' },
          Kompanija: flight.Kompanija,
          KompanijaICAO: flight.KompanijaICAO,
          KompanijaNaziv: flight.KompanijaNaziv,
          checkIn: flight.CheckIn,
          gate: flight.Gate
        }))
    };

    return NextResponse.json(processedData);
  } catch (error) {
    console.error('Error fetching flight data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flight data' },
      { status: 500 }
    );
  }
}