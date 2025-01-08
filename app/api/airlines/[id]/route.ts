import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { airlines, announcementTemplates } from '@/lib/db/schema'; // Added the import for announcementTemplates
import { eq } from 'drizzle-orm';

// Helper function to validate params.id
const validateId = (idString: string | null): number | null => {
  if (!idString) return null;
  const id = parseInt(idString, 10);
  return isNaN(id) || id < 1 ? null : id;
};

// GET single airline by ID
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params;  // No need to await here
    const validatedId = validateId(id);

    if (!validatedId) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing ID' },
        { status: 400 }
      );
    }

    const data = await db
      .select()
      .from(airlines)
      .where(eq(airlines.id, validatedId))
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
export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params;  // No need to await here
    const validatedId = validateId(id);

    if (!validatedId) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID parameter' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const existingAirline = await db
      .select()
      .from(airlines)
      .where(eq(airlines.id, validatedId))
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
      .where(eq(airlines.id, validatedId))
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
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params;  // No need to await here
    const validatedId = validateId(id);

    if (!validatedId) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID parameter' },
        { status: 400 }
      );
    }

    const deletedAirline = await db
      .delete(airlines)
      .where(eq(airlines.id, validatedId))
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
