import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { airlines } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET all airlines
// Modify the GET route in app/api/airlines/route.ts
export async function GET(req: NextRequest) {
  try {
    console.log('Fetching airlines...');
    const data = await db
      .select({
        id: airlines.id,
        name: airlines.name,
        fullName: airlines.fullName,
        code: airlines.code,
        icaoCode: airlines.icaoCode,
        country: airlines.country,
        state: airlines.state,
        logoUrl: airlines.logoUrl,
        defaultLanguage: airlines.defaultLanguage,
      })
      .from(airlines);
    
    console.log('Fetched airlines:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching airlines:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch airlines' },
      { status: 500 }
    );
  }
}

// GET single airline by ID
export async function GET_BY_ID(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await db
      .select()
      .from(airlines)
      .where(eq(airlines.id, parseInt(params.id)))
      .limit(1);

    if (!data.length) {
      return NextResponse.json(
        { success: false, message: 'Airline not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error fetching airline:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch airline' },
      { status: 500 }
    );
  }
}

// POST new airline
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || !body.code || !body.icaoCode) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newAirline = await db.insert(airlines).values({
      name: body.name,
      fullName: body.fullName,
      code: body.code,
      icaoCode: body.icaoCode,
      country: body.country,
      state: body.state,
      logoUrl: body.logoUrl,
      defaultLanguage: body.defaultLanguage || 'en',
    }).returning();

    return NextResponse.json(
      { success: true, data: newAirline[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating airline:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create airline' },
      { status: 500 }
    );
  }
}

// PUT update airline
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const id = parseInt(params.id);

    const updatedAirline = await db
      .update(airlines)
      .set({
        name: body.name,
        fullName: body.fullName,
        code: body.code,
        icaoCode: body.icaoCode,
        country: body.country,
        state: body.state,
        logoUrl: body.logoUrl,
        defaultLanguage: body.defaultLanguage,
      })
      .where(eq(airlines.id, id))
      .returning();

    if (!updatedAirline.length) {
      return NextResponse.json(
        { success: false, message: 'Airline not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedAirline[0] });
  } catch (error) {
    console.error('Error updating airline:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update airline' },
      { status: 500 }
    );
  }
}

// DELETE airline
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    
    const deletedAirline = await db
      .delete(airlines)
      .where(eq(airlines.id, id))
      .returning();

    if (!deletedAirline.length) {
      return NextResponse.json(
        { success: false, message: 'Airline not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Airline deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting airline:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete airline' },
      { status: 500 }
    );
  }
}