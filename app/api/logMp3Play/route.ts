import { NextRequest, NextResponse } from 'next/server';
import { createMp3Play } from '@/lib/db/queries'; // Ensure this import path is correct

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Destructure the required fields from the request body
        const { flight, type, filename } = body;

        // Prepare the data for database insertion
        const playData = {
            flightIcaoCode: type === 'security' ? 'SEC' : flight?.KompanijaICAO || 'SEC',
            flightNumber: type === 'security' ? 'SEC' : flight?.ident || 'SEC',
            destinationCode: type === 'security' ? 'SEC' : flight?.destination.code || 'SEC',
            callType: type,
            gate: type === 'security' ? 'SEC' : flight?.gate || undefined,
            filename: filename || `${flight?.ident}_${type}_${Date.now()}.mp3`, // Default filename if not provided
            playedAt: new Date() // Set current date and time
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