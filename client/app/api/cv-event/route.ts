import { NextRequest, NextResponse } from 'next/server';
import { generateRoast } from '@/app/actions/cv-event';
import { getCurrentActiveSession } from '@/app/actions/session';
import { getUserByEmail } from '@/app/actions/user';
import { getSession } from '@auth0/nextjs-auth0';
import { createSystemMessage } from '@/app/actions/message';
import Group from '@/models/group.model';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { emotion, focus, thumbs_up, wave, timestamp, user_email, current_tab_url } = body;

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

    // Only generate a roast if focus is not 'focused'
    let roastContent = null;
    let urlAligned = false;
    
    if (focus !== 'focused') {
      // Generate a roast directly without storing the event
      // Pass emotion, focus, and URL data from the request body
      roastContent = await generateRoast(dbUser._id, emotion, focus, current_tab_url);
      
      // If roastContent is empty string, it means the URL aligns with the session goal
      if (roastContent === '') {
        urlAligned = true;
        roastContent = null;
        console.log('URL aligns with session goal, no roast generated');
      }
      
      // Find the user's group to send the roast to the group chat
      if (roastContent) {
        try {
          // Find all groups
          const allGroups = await Group.find({});
          let groupData = null;
          
          // Find the user's group
          for (const group of allGroups) {
            try {
              const membersArray = JSON.parse(group.members);
              if (membersArray.includes(dbUser.email)) {
                groupData = group;
                break;
              }
            } catch (e) {
              console.error('Error parsing group members:', e);
            }
          }
          
          // If a group is found, send the roast as a system message
          if (groupData) {
            await createSystemMessage(groupData._id.toString(), roastContent);
            console.log('Roast sent to group chat:', roastContent);
          }
        } catch (error) {
          console.error('Error sending roast to group chat:', error);
        }
      }
    }
    
    // Return the response with roast and URL alignment status
    return NextResponse.json({
      status: 'ok',
      user_id: dbUser._id,
      session_id: activeSession._id,
      emotion,
      focus,
      thumbs_up,
      wave,
      timestamp: timestamp || new Date().toISOString(),
      roast: roastContent,
      url_aligned: urlAligned,
      current_tab_url
    });
  } catch (error) {
    console.error('Error processing CV event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}