import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { announcementTemplates, AnnouncementType } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';


// Helper function to validate params.id
const validateId = (idString: string | null): number | null => {
    if (!idString) return null; // Return null if idString is null or empty
    const id = parseInt(idString, 10); // Parse the string to an integer
    return isNaN(id) || id < 1 ? null : id; // Return null if NaN or less than 1
};

// Helper function to create a standardized JSON response
const jsonResponse = (status: string, data: any, statusCode = 200) => 
    NextResponse.json({ status, data }, { status: statusCode });

// GET: Fetch all announcement templates
export async function GET(): Promise<NextResponse> {
    try {
        const templates = await db.select().from(announcementTemplates);
        return jsonResponse('success', templates);
    } catch (error) {
        console.error('Error fetching announcement templates:', error);
        return jsonResponse('error', 'Failed to fetch templates', 500);
    }
}

// POST: Create a new announcement template
export async function POST(request: Request): Promise<NextResponse> {
    try {
        const { airlineId, type, language, template } = await request.json();
        
        // Validate announcement type
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

// PUT: Update an existing announcement template
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Use Promise for params
): Promise<NextResponse> {
    try {
        const { id } = await params; // Await params to resolve it

        // Validate ID
        const numericId = validateId(id);
        if (!numericId) {
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
            .where(eq(announcementTemplates.id, numericId))
            .returning();

        if (!updatedTemplate) {
            return jsonResponse('error', 'Template not found', 404);
        }

        return jsonResponse('success', updatedTemplate);
    } catch (error) {
        console.error('Error updating announcement template:', error);
        return jsonResponse('error', 'Failed to update template', 500);
    }
}

// DELETE: Delete an announcement template
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Use Promise for params
): Promise<NextResponse> {
    try {
        const { id } = await params; // Await params to resolve it

        // Validate ID
        const numericId = validateId(id);
        if (!numericId) {
            return jsonResponse('error', 'Invalid template ID', 400);
        }

        const deletedRows = await db
            .delete(announcementTemplates)
            .where(eq(announcementTemplates.id, numericId))
            .returning();

        if (deletedRows.length === 0) {
            return jsonResponse('error', 'Template not found', 404);
        }

        return jsonResponse('success', { message: 'Template deleted successfully', deletedTemplate: deletedRows[0] });
    } catch (error) {
        console.error('Error deleting announcement template:', error);
        return jsonResponse('error', 'Failed to delete template', 500);
    }
}