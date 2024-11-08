import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://montenegroairports.com/aerodromixs/cache-flights.php?airport=tv', {
      headers: {
        'User-Agent': 'Mozilla/5.0', // This can sometimes help with Cloudflare-protected routes.
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();

    // Filter departures: TipLeta "O" (Outbound flights)
    const departures = data.filter((flight: any) => flight.TipLeta === 'O').map((flight: any) => ({
      ident: flight.BrojLeta,              // Flight number
      status: flight.StatusEN,             // Status (e.g., Departed, Delayed)
      scheduled_out: flight.Planirano,     // Scheduled departure time
      actual_out: flight.Aktuelno || null, // Actual departure time (nullable)
      origin: { code: flight.IATA },       // Origin airport code
      destination: { code: flight.Grad },  // Destination airport code
      Kompanija: flight.Kompanija,         // Airline IATA code
      KompanijaICAO: flight.KompanijaICAO, // Airline ICAO code
      KompanijaNaziv: flight.KompanijaNaziv, // Airline name
      checkIn: flight.CheckIn || 'Not Available', // CheckIn (example field, adapt to actual data)
      gate: flight.Gate || 'Not Assigned'        // Gate (example field, adapt to actual data)
    }));

    // Filter arrivals: TipLeta "I" (Inbound flights)
    const arrivals = data.filter((flight: any) => flight.TipLeta === 'I').map((flight: any) => ({
      ident: flight.BrojLeta,              // Flight number
      status: flight.StatusEN,             // Status (e.g., Arrived, Delayed)
      scheduled_out: flight.Planirano,     // Scheduled arrival time
      actual_out: flight.Aktuelno || null, // Actual arrival time (nullable)
      origin: { code: flight.IATA },       // Origin airport code
      destination: { code: flight.Grad },  // Destination airport code
      Kompanija: flight.Kompanija,         // Airline IATA code
      KompanijaICAO: flight.KompanijaICAO, // Airline ICAO code
      KompanijaNaziv: flight.KompanijaNaziv // Airline name
    }));

    // Return both departures and arrivals as an object
    return NextResponse.json({ departures, arrivals });
  } catch (error: unknown) { // Explicitly type `error` as `unknown`
    if (error instanceof Error) { // Narrow the type to `Error`
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Unknown error occurred' }, { status: 500 });
    }
  }
}
