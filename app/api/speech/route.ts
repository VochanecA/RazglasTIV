// app/api/speech/route.ts
import { NextResponse } from 'next/server';

interface PlayHTResponse {
  audioData?: string;
  error?: string;
}

interface PlayHTRequestBody {
  voice: string;
  text: string;
  output_format: string;
  speed: string;
  sample_rate: string;
  quality: 'draft' | 'low' | 'medium' | 'high' | 'premium';
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid text input' },
        { status: 400 }
      );
    }

    if (!process.env.PLAYHT_SECRET_KEY || !process.env.PLAYHT_USER_ID) {
      throw new Error('Missing PlayHT credentials');
    }

    const url = 'https://api.play.ht/api/v2/tts/stream';
    
    const requestBody: PlayHTRequestBody = {
      voice: 's3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json',
      text,
      output_format: 'mp3',
      speed: '1',         // Speed of speech (0.5 to 2.0)
      sample_rate: '16000', // Sample rate in Hz
      quality: 'medium'   // Audio quality level
    };

    const options = {
      method: 'POST',
      headers: {
        accept: 'audio/mpeg',
        'content-type': 'application/json',
        AUTHORIZATION: process.env.PLAYHT_SECRET_KEY,
        'X-USER-ID': process.env.PLAYHT_USER_ID
      },
      body: JSON.stringify(requestBody)
    };

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`PlayHT API error: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    return NextResponse.json({ audioData: base64Audio });
  } catch (error) {
    console.error('Error generating speech:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error generating speech' },
      { status: 500 }
    );
  }
}