import { NextRequest, NextResponse } from 'next/server';
import { validateCVEvent, processCVEvent } from '@/app/actions/cv-event';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { event_type, event_value, timestamp, user_id, session_id } = body;
    
    // Validate required fields
    if (!event_type || !event_value || !user_id || !session_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate event type and value
    const validation = validateCVEvent(event_type, event_value);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errorMessage },
        { status: 400 }
      );
    }
    
    // Process the CV event and generate a roast if needed
    const result = await processCVEvent(
      session_id,
      user_id,
      event_type,
      event_value,
      timestamp
    );
    
    // Return the created event and roast if generated
    return NextResponse.json({
      event_id: result.event._id,
      session_id,
      user_id,
      event_type,
      event_value,
      timestamp: result.event.event_timestamp,
      roast: result.roast
    });
  } catch (error) {
    console.error('Error processing CV event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}