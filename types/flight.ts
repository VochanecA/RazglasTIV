// types/flight.ts

export interface Flight {
  ident: string;
  status: string;
  scheduled_out: string;
  scheduled_in: string;
  estimated_out: string;
  estimated_in: string;
  actual_out: string | null;
  actual_in: string | null;
  origin: { code: string };
  destination: { code: string };
  grad: string;
  Kompanija: string;
  KompanijaICAO: string;
  KompanijaNaziv: string;
  checkIn: string;
  gate: string;
}

export interface FlightData {
  departures: Flight[];
  arrivals: Flight[];
}

export interface FlightTTSEngine {
  shouldAnnounce: (flight: Flight, status: string) => boolean;
  queueAnnouncement: (flight: Flight, type: 'checkin' | 'boarding' | 'final' | 'close' | 'arrived') => void;
  queueCustomAnnouncement: (message: string) => void;
  setAnnouncementInterval: (seconds: number) => void;
  startScheduledAnnouncements: () => void;
  stop: () => void;
}