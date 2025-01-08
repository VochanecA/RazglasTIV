import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { airlines } from '@/lib/db/schema';

// GET all airlines
export async function GET() {
  try {
    const data = await db.select().from(airlines);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching airlines:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch airlines' },
      { status: 500 }
    );
  }
}

// POST new airline
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newAirline = await db.insert(airlines).values(body).returning();
    return NextResponse.json({ success: true, data: newAirline[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating airline:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create airline' },
      { status: 500 }
    );
  }
}