// app/api/announcements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { announcementTemplates, AnnouncementType } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Common response format
const jsonResponse = (status: string, data: any, statusCode = 200) =>
  NextResponse.json({ status, data }, { status: statusCode });

// GET: Fetch all announcement templates or single by ID
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      // Get single template
      const [template] = await db
        .select()
        .from(announcementTemplates)
        .where(eq(announcementTemplates.id, Number(id)));
      
      if (!template) {
        return jsonResponse('error', 'Template not found', 404);
      }
      
      return jsonResponse('success', template);
    } else {
      // Get all templates
      const templates = await db.select().from(announcementTemplates);
      return jsonResponse('success', templates);
    }
  } catch (error) {
    console.error('Error fetching announcement templates:', error);
    return jsonResponse('error', 'Failed to fetch templates', 500);
  }
}

// POST: Create a new announcement template
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { airlineId, type, language, template } = await request.json();

    if (!Object.values(AnnouncementType).includes(type)) {
      return jsonResponse('error', 'Invalid announcement type', 400);
    }

    const [newTemplate] = await db
      .insert(announcementTemplates)
      .values({ airlineId: Number(airlineId), type, language, template })
      .returning();

    return jsonResponse('success', newTemplate, 201);
  } catch (error) {
    console.error('Error creating announcement template:', error);
    return jsonResponse('error', 'Failed to create template', 500);
  }
}

// PUT: Update an existing announcement template (using query param)
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(Number(id))) {
      return jsonResponse('error', 'Invalid template ID', 400);
    }

    const body = await request.json();
    const { airlineId, type, language, template } = body;

    // Validate required fields
    if (!airlineId || !type || !language || !template) {
      return jsonResponse('error', 'Missing required fields', 400);
    }

    // Validate announcement type
    if (!Object.values(AnnouncementType).includes(type)) {
      return jsonResponse('error', 'Invalid announcement type', 400);
    }

    const [updatedTemplate] = await db
      .update(announcementTemplates)
      .set({
        airlineId: Number(airlineId),
        type,
        language,
        template,
      })
      .where(eq(announcementTemplates.id, Number(id)))
      .returning();

    if (!updatedTemplate) {
      return jsonResponse('error', 'Template not found or could not be updated', 404);
    }

    return jsonResponse('success', updatedTemplate);
  } catch (error) {
    console.error('Error updating announcement template:', error);
    return jsonResponse('error', 'Failed to update template', 500);
  }
}

// DELETE: Delete an announcement template (using query param)
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(Number(id))) {
      return jsonResponse('error', 'Invalid template ID', 400);
    }

    const deletedRows = await db
      .delete(announcementTemplates)
      .where(eq(announcementTemplates.id, Number(id)))
      .returning();

    if (deletedRows.length === 0) {
      return jsonResponse('error', 'Template not found or could not be deleted', 404);
    }

    return jsonResponse('success', { deletedTemplate: deletedRows[0] });
  } catch (error) {
    console.error('Error deleting announcement template:', error);
    return jsonResponse('error', 'Failed to delete template', 500);
  }
}