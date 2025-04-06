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

    // Always generate a message for any CV event
    let roastContent = null;
    let urlAligned = false;
    let messageToSend = null;
    
    // Determine the appropriate message based on focus state
    if (focus === 'focused') {
      // For focused state, send a positive message
      messageToSend = `${dbUser.name || dbUser.email.split('@')[0]} is focused and ${emotion === 'happy' ? 'happy' : 'working hard'}! 🦆`;
      console.log('User is focused, sending positive message');
    } else {
      // For distracted state, generate a roast or positive message
      roastContent = await generateRoast(dbUser._id, emotion, focus, current_tab_url);
      
      // If roastContent is empty string, it means the URL aligns with the session goal
      if (roastContent === '') {
        urlAligned = true;
        // Create a positive message instead of a roast
        messageToSend = `Great job ${dbUser.name || dbUser.email.split('@')[0]}! You're staying focused on your ${current_tab_url ? 'study materials' : 'work'}. Keep it up!`;
        console.log('URL aligns with session goal, sending positive message');
      } else {
        // Use the roast as the message
        messageToSend = roastContent;
      }
    }
    
    // Find the user's group to send the message to the group chat
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
      
      console.log('Group data:', groupData);
      console.log('Message to send:', messageToSend);
      // If a group is found, send the message as a system message
      if (groupData && messageToSend) {
        console.log('Sending message to group chat:', messageToSend);
        await createSystemMessage(groupData._id.toString(), messageToSend);
        console.log('Message sent to group chat:', messageToSend);
      }
    } catch (error) {
      console.error('Error sending message to group chat:', error);
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