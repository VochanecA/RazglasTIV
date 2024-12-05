// lib/serverLogMp3Play.ts
import { createMp3Play } from './db/queries'; // Ensure this import is correct

export async function serverLogMp3Play(
    flight: any, // Adjust type as necessary
    type: 'checkin' | 'boarding' | 'processing' | 'final' | 'arrived' | 'close' | 'security',
    announcementText?: string
) {
    const filename = type === 'security' 
        ? 'Security announcement' 
        : `${flight?.ident}_${type}_${Date.now()}.mp3`;

    await createMp3Play({
        flightIcaoCode: type === 'security' ? 'SEC' : flight?.KompanijaICAO || 'SEC',
        flightNumber: type === 'security' ? 'SEC' : flight?.ident || 'SEC',
        destinationCode: type === 'security' ? 'SEC' : flight?.destination.code || 'SEC',
        callType: type,
        gate: type === 'security' ? 'SEC' : flight?.gate || undefined,
        filename: filename,
        playedAt: new Date(), // Explicitly set current date and time
       /// announcementText: announcementText // Include this if needed
    });
}