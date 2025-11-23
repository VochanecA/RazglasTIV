// api/getAnnouncementsTimes/route.ts
import { NextResponse } from 'next/server';
import { getAnnouncementSchedule } from '@/lib/db/queries'; // Ensure this returns the correct data structure
import { AnnouncementType } from '@/lib/db/schema'; 

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const airlineId = Number(url.searchParams.get('airlineId'));
    const type = url.searchParams.get('type') as AnnouncementType;

    const schedules = await getAnnouncementSchedule(airlineId, type);

    if (schedules.length === 0) {
      return NextResponse.json({ error: 'No announcements found' }, { status: 404 });
    }

    // Ensure you're returning the expected data
    return NextResponse.json(schedules[0]); // Assuming schedule[0] has the correct template structure
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
