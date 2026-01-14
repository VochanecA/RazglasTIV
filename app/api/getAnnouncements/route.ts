// import { NextResponse } from 'next/server';
// import { getAnnouncementTemplate, getAirlineIdByCode } from '@/lib/db/queries';
// import { AnnouncementType } from '@/lib/db/schema';

// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const airlineCode = searchParams.get('airlineCode');
//   const type = searchParams.get('type');
//   const language = searchParams.get('language') || 'en'; // Default to 'en' if language is not provided

//   console.log('Received query:', { airlineCode, type, language });

//   if (
//     typeof airlineCode !== 'string' || 
//     typeof type !== 'string' || 
//     typeof language !== 'string'
//   ) {
//     console.log('Invalid parameters:', { airlineCode, type, language });
//     return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
//   }

//   try {
//     const airlineId = await getAirlineIdByCode(airlineCode);
//     console.log('Airline ID result:', airlineId);

//     if (!airlineId) {
//       console.log('Airline not found:', { airlineCode });
//       return NextResponse.json({ error: 'Airline not found' }, { status: 404 });
//     }

//     const template = await getAnnouncementTemplate(
//       airlineId, 
//       type as AnnouncementType, 
//       language
//     );
//     console.log('Template result:', template);

//     if (!template) {
//       console.log('Template not found:', { airlineId, type, language });
//       return NextResponse.json({ error: 'Announcement template not found' }, { status: 404 });
//     }

//     return NextResponse.json(template, { status: 200 });
//   } catch (error) {
//     console.error('Error details:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }

import { NextResponse } from 'next/server';
import { getAnnouncementTemplate, getAirlineIdByCode } from '@/lib/db/queries';
import { AnnouncementType } from '@/lib/db/schema';

// Import the function from announcementQueue
import { generateDefaultOnTimeAnnouncement } from '@/lib/announcementQueue';
import type { Flight } from '@/lib/flightTTS';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const airlineCode = searchParams.get('airlineCode');
  const type = searchParams.get('type');
  const language = searchParams.get('language') || 'en'; // Default to 'en' if language is not provided
  
  // Additional parameters for on-time announcements
  const flightNumber = searchParams.get('flightNumber');
  const airlineName = searchParams.get('airlineName');
  const destination = searchParams.get('destination');
  const scheduledTime = searchParams.get('scheduledTime');
  const estimatedTime = searchParams.get('estimatedTime');

  console.log('Received query:', { 
    airlineCode, 
    type, 
    language,
    flightNumber,
    airlineName,
    destination,
    scheduledTime,
    estimatedTime
  });

  if (
    typeof airlineCode !== 'string' || 
    typeof type !== 'string' || 
    typeof language !== 'string'
  ) {
    console.log('Invalid parameters:', { airlineCode, type, language });
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  try {
    // Normalize the type for consistency
    const normalizedType = normalizeAnnouncementType(type);
    
    // Check if it's an on-time related type
    const isOnTimeType = isOnTimeAnnouncementType(type);

    // Try to get template from database first
    const airlineId = await getAirlineIdByCode(airlineCode);
    console.log('Airline ID result:', airlineId);

    let template;
    let isDefaultTemplate = false;

    if (airlineId) {
      template = await getAnnouncementTemplate(
        airlineId, 
        normalizedType as AnnouncementType, 
        language
      );
      console.log('Template result from DB:', template);
    }

    // If template not found in database and it's an on-time announcement
    if (!template && isOnTimeType) {
      console.log('No template found in DB, checking if we can generate default on-time announcement');
      
      // Check if we have required parameters for generating default announcement
      const hasRequiredParams = flightNumber && airlineName && destination && scheduledTime;
      
      if (hasRequiredParams) {
        // Create a mock flight object for the generateDefaultOnTimeAnnouncement function
        const mockFlight: Flight = {
          ident: flightNumber,
          Kompanija: airlineCode,
          KompanijaICAO: airlineCode,
          KompanijaNaziv: airlineName || airlineCode,
          grad: destination,
          origin: { code: 'UNK' }, // Unknown origin code
          destination: { code: 'UNK' }, // Unknown destination code
          scheduled_out: scheduledTime,
          estimated_out: estimatedTime || scheduledTime,
          actual_out: '',
          status: 'on-time',
          gate: '',
          checkIn: '',
          TipLeta: 'I', // Default to arrival
          delay: undefined,
        };

        try {
          // Generate default on-time announcement
          const defaultText = generateDefaultOnTimeAnnouncement(mockFlight);
          
          // Create a template object with the generated text
          template = {
            template: defaultText,
            language: 'en',
            type: normalizedType,
          };
          isDefaultTemplate = true;
          
          console.log('Generated default on-time announcement:', defaultText);
        } catch (error) {
          console.error('Error generating default on-time announcement:', error);
        }
      } else {
        console.log('Missing parameters for default on-time announcement:', {
          flightNumber,
          airlineName,
          destination,
          scheduledTime
        });
      }
    }

    // If still no template (either from DB or default)
    if (!template) {
      console.log('Template not found:', { 
        airlineId, 
        airlineCode,
        type: normalizedType, 
        language,
        isOnTimeType 
      });
      
      return NextResponse.json({ 
        error: 'Announcement template not found',
        details: {
          airlineCode,
          type: normalizedType,
          language,
          isOnTimeType,
          hasRequiredParamsForDefault: !!(flightNumber && airlineName && destination && scheduledTime)
        }
      }, { status: 404 });
    }

    // Return template (either from DB or default)
    return NextResponse.json({
      ...template,
      isDefault: isDefaultTemplate,
      ...(isDefaultTemplate && { 
        message: 'Using default on-time announcement template',
        generatedFrom: {
          flightNumber,
          airlineName,
          destination,
          scheduledTime,
          estimatedTime
        }
      })
    }, { status: 200 });
  } catch (error) {
    console.error('Error details:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      ...(error instanceof Error && { details: error.message })
    }, { status: 500 });
  }
}

// Helper function to normalize announcement type
function normalizeAnnouncementType(type: string): string {
  const typeMap: Record<string, string> = {
    // On-time variations
    'on time': 'on-time',
    'on Time': 'on-time',
    'ON TIME': 'on-time',
    'on_time': 'on-time',
    'On time': 'on-time',
    
    // Check-in variations
    'check in open': 'checkinopen',
    'check in': 'checkin',
    'check-in': 'checkin',
    'Check-In': 'checkin',
    'CHECK-IN': 'checkin',
    
    // Other variations
    'dangerous goods': 'dangerous_goods',
    'dangerous-goods': 'dangerous_goods',
    'special assistance': 'special-assistance',
    'special-assistance': 'special-assistance',
    'special_assistance': 'special-assistance',
    'gate change': 'gate_change',
    'gate-change': 'gate_change',
    'gate_change': 'gate_change',
  };

  const lowerType = type.toLowerCase();
  return typeMap[lowerType] || lowerType.replace(/\s+/g, '_');
}

// Helper function to check if type is an on-time announcement
function isOnTimeAnnouncementType(type: string): boolean {
  const onTimeVariations = [
    'on-time',
    'on time',
    'on Time',
    'ON TIME',
    'on_time',
    'On time'
  ];
  
  const normalized = normalizeAnnouncementType(type);
  return onTimeVariations.includes(normalized) || 
         type.toLowerCase().includes('on') && type.toLowerCase().includes('time');
}