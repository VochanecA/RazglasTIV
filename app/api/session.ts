// app/api/session.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { cookies } from 'next/headers'; // This can only be used in server components or API routes
import { verifyToken } from '@/lib/auth/session'; // Ensure this path is correct

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const sessionCookie = (await cookies()).get('session'); // Access cookies here
    if (!sessionCookie || !sessionCookie.value) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const sessionData = await verifyToken(sessionCookie.value);
      return res.status(200).json(sessionData);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid session' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
