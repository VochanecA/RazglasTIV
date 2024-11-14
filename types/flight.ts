export interface Flight {
    ident: string;
    status: string;
    scheduled_out: string;
    estimated_out: string;
    actual_out: string | null;
    origin: { code: string };
    destination: { code: string };
    grad:  string ;
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