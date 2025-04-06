import { NextRequest, NextResponse } from 'next/server';
import { validateCVEvent, processCVEvent } from '@/app/actions/cv-event';
import { getCurrentActiveSession } from '@/app/actions/session';
import { getUserByEmail } from '@/app/actions/user';
import { getUserProfileDataSafe } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { emotion, focus, thumbs_up, wave, timestamp } = body;

    // Get user from Auth0 session
    const user = await getUserProfileDataSafe();
    console.log('User from Auth0 session:', user);
    
    // Get user email from Auth0 session
    const user_email = user?.email;
    
    // Check if user email is available
    if (!user_email) {
      return NextResponse.json(
        { error: 'User not authenticated or email not available' },
        { status: 401 }
      );
    }
    
    // Get the user from the database
    const dbUser = await getUserByEmail(user_email);
    if (!dbUser?._id) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }
    
    // Get the current active session for the user
    const activeSession = await getCurrentActiveSession(dbUser._id);
    if (!activeSession?._id) {
      return NextResponse.json(
        { error: 'No active session found for user' },
        { status: 404 }
      );
    }
    
    // Map the incoming data to our event types and values
    let event_type = '';
    let event_value = '';
    
    // Determine the most significant event to process
    if (focus === 'distracted') {
      event_type = 'eye_movement';
      event_value = 'looking_away';
    } else if (wave === 'detected') {
      event_type = 'wave';
      event_value = 'detected';
    } else if (thumbs_up === 'detected') {
      event_type = 'thumbs_up';
      event_value = 'detected';
    } else if (emotion && emotion !== 'neutral') {
      event_type = 'emotion';
      event_value = emotion;
    }
    
    // If no significant event was detected, return early
    if (!event_type || !event_value) {
      return NextResponse.json({
        message: 'No significant event detected',
        status: 'ok'
      });
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
      activeSession._id,
      dbUser._id,
      event_type,
      event_value,
      timestamp
    );
    
    // Return the created event and roast if generated
    return NextResponse.json({
      event_id: result.event._id,
      session_id: activeSession._id,
      user_id: dbUser._id,
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