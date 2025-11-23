import { NextRequest, NextResponse } from 'next/server';
import { createMp3Play } from '@/lib/db/queries'; // Ensure this import path is correct

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Destructure the required fields from the request body
        const { flightIcaoCode, flightNumber, destinationCode, callType, gate, filename, playedAt } = body;

        // Prepare the data for database insertion
        const playData = {
            flightIcaoCode: callType === 'security' ? 'SEC' : flightIcaoCode || 'SEC',
            flightNumber: callType === 'security' ? 'SEC' : flightNumber || 'SEC',
            destinationCode: callType === 'security' ? 'SEC' : destinationCode || 'SEC',
            callType: callType,
            gate: callType === 'security' ? 'SEC' : gate || undefined,
            filename: filename || `${flightNumber}_${callType}_${Date.now()}.mp3`, // Default filename if not provided
            playedAt: new Date(playedAt) // Ensure playedAt is a Date object
        };

        // Call the createMp3Play function to insert data into the database
        await createMp3Play(playData);

        // Return a success response
        return NextResponse.json({ message: 'Logged successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error logging MP3 play:', error);
        return NextResponse.json({ error: 'Failed to log MP3 play' }, { status: 500 });
    }
}
