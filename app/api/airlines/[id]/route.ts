import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { airlines } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Helper function to validate params.id
const validateId = (id: string) => {
  const parsedId = parseInt(id);
  return isNaN(parsedId) ? null : parsedId;
};

// GET single airline by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = validateId(params.id);
  if (!id) {
    return NextResponse.json(
      { success: false, message: 'Invalid ID parameter' },
      { status: 400 }
    );
  }

  try {
    const data = await db
      .select()
      .from(airlines)
      .where(eq(airlines.id, id))
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

// PUT update airline
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = validateId(params.id);
  if (!id) {
    return NextResponse.json(
      { success: false, message: 'Invalid ID parameter' },
      { status: 400 }
    );
  }

  try {
    const body: Partial<{
      name: string;
      fullName: string;
      code: string;
      icaoCode: string;
      country: string;
      state: string;
      logoUrl: string;
      defaultLanguage: string;
    }> = await req.json();

    const existingAirline = await db
      .select()
      .from(airlines)
      .where(eq(airlines.id, id))
      .limit(1);

    if (!existingAirline.length) {
      return NextResponse.json(
        { success: false, message: 'Airline not found' },
        { status: 404 }
      );
    }

    const updatedAirline = await db
      .update(airlines)
      .set({
        name: body.name ?? existingAirline[0].name,
        fullName: body.fullName ?? existingAirline[0].fullName,
        code: body.code ?? existingAirline[0].code,
        icaoCode: body.icaoCode ?? existingAirline[0].icaoCode,
        country: body.country ?? existingAirline[0].country,
        state: body.state ?? existingAirline[0].state,
        logoUrl: body.logoUrl ?? existingAirline[0].logoUrl,
        defaultLanguage: body.defaultLanguage ?? existingAirline[0].defaultLanguage,
      })
      .where(eq(airlines.id, id))
      .returning();

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
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = validateId(params.id);
  if (!id) {
    return NextResponse.json(
      { success: false, message: 'Invalid ID parameter' },
      { status: 400 }
    );
  }

  try {
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
