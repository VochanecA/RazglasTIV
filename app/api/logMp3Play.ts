// pages/api/logMp3Play.ts
import { serverLogMp3Play } from '@/lib/serverLogMp3Play';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { flight, type, announcementText } = req.body;

        try {
            await serverLogMp3Play(flight, type, announcementText);
            res.status(200).json({ message: 'Logged successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to log MP3 play' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}