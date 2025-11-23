import { NextResponse } from 'next/server';
import { getAnnouncementTemplate, getAirlineIdByCode } from '@/lib/db/queries';
import { AnnouncementType } from '@/lib/db/schema';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const airlineCode = searchParams.get('airlineCode');
  const type = searchParams.get('type');
  const language = searchParams.get('language') || 'en'; // Default to 'en' if language is not provided

  console.log('Received query:', { airlineCode, type, language });

  if (
    typeof airlineCode !== 'string' || 
    typeof type !== 'string' || 
    typeof language !== 'string'
  ) {
    console.log('Invalid parameters:', { airlineCode, type, language });
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  try {
    const airlineId = await getAirlineIdByCode(airlineCode);
    console.log('Airline ID result:', airlineId);

    if (!airlineId) {
      console.log('Airline not found:', { airlineCode });
      return NextResponse.json({ error: 'Airline not found' }, { status: 404 });
    }

    const template = await getAnnouncementTemplate(
      airlineId, 
      type as AnnouncementType, 
      language
    );
    console.log('Template result:', template);

    if (!template) {
      console.log('Template not found:', { airlineId, type, language });
      return NextResponse.json({ error: 'Announcement template not found' }, { status: 404 });
    }

    return NextResponse.json(template, { status: 200 });
  } catch (error) {
    console.error('Error details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
