import { NextResponse } from 'next/server';
import { createMp3Play } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate required fields
    const { flightIcaoCode, flightNumber, destinationCode, callType, gate, filename } = body;

    if (!flightIcaoCode || !flightNumber || !destinationCode || !callType || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the MP3 play record using the new queries
    const result = await createMp3Play({
      flightIcaoCode,
      flightNumber,
      destinationCode,
      callType,
      gate,
      filename,
      // Note: 'playedAt' is used in queries.ts, not 'played_at'
    });

    // Return the newly created MP3 play record
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating MP3 play record:', error);
    return NextResponse.json(
      { error: 'Failed to create MP3 play record' },
      { status: 500 }
    );
  }
}