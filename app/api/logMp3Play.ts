// pages/api/logMp3Play.ts
import { serverLogMp3Play } from '@/lib/serverLogMp3Play';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        // Destructure the required fields from req.body
        const { flight_icao_code, flight_number, destination_code, call_type, gate, filename, played_at } = req.body;

        // Check if all required fields are provided
        if (!flight_icao_code || !flight_number || !destination_code || !call_type || !filename || !played_at) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        try {
            // Pass the required parameters to serverLogMp3Play
            await serverLogMp3Play({
                flightIcaoCode: flight_icao_code,
                flightNumber: flight_number,
                destinationCode: destination_code,
                callType: call_type,  // It should match the 'checkin' | 'boarding' | etc.
                gate: gate,
                filename: filename,
                playedAt: new Date(played_at),  // Ensure playedAt is a Date object
            });

            // Respond with success
            res.status(200).json({ message: 'Logged successfully' });
        } catch (error) {
            console.error('Error logging MP3 play:', error);
            res.status(500).json({ error: 'Failed to log MP3 play' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
