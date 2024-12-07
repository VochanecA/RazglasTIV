import { createMp3Play as createDbMp3Play } from './db/queries'; // Rename the imported function

// Extend the type of 'type' to include 'security'
type AnnouncementType = 'checkin' | 'boarding' | 'processing' | 'final' | 'arrived' | 'close' | 'security';

export async function serverLogMp3Play({
    flightIcaoCode,
    flightNumber,
    destinationCode,
    callType,
    gate,
    filename,
    playedAt,
}: {
    flightIcaoCode: string;
    flightNumber: string;
    destinationCode: string;
    callType: AnnouncementType;
    gate?: string;
    filename: string;
    playedAt: Date;
}) {
    // Ensure 'playedAt' is a Date object
    const playTime = playedAt instanceof Date ? playedAt : new Date(playedAt);

    // Dynamically generate filename based on callType
    const finalFilename = callType === 'security'  
        ? 'Security announcement.mp3' 
        : filename || `${flightNumber}_${callType}_${Date.now()}.mp3`;

    try {
        await createDbMp3Play({
            flightIcaoCode: callType === 'security' ? 'SEC' : flightIcaoCode || 'SEC',
            flightNumber: callType === 'security' ? 'SEC' : flightNumber || 'SEC',
            destinationCode: callType === 'security' ? 'SEC' : destinationCode || 'SEC',
            callType: callType,
            gate: callType === 'security' ? 'SEC' : gate || null, // 'null' if gate is not provided
            filename: finalFilename,
            playedAt: playTime,
        });
    } catch (error) {
        console.error('Error logging MP3 play:', error);
        throw new Error('Database logging failed');
    }
}
