import { NextRequest, NextResponse } from 'next/server';
import { generateRoast } from '@/app/actions/cv-event';
import { getCurrentActiveSession } from '@/app/actions/session';
import { getUserByEmail } from '@/app/actions/user';
import { getSession } from '@auth0/nextjs-auth0';
import { batchSendEmails, createSystemMessage, sendEmail } from '@/app/actions/message';
import Group from '@/models/group.model';
import { getPetByGroupId, decreasePetHealth, increasePetHealth } from '@/app/actions/pet';
import UserConnection from '@/models/user-connection.model';

// Email rate limiting - track last notification time per user
const emailCooldowns = new Map<string, number>();
const EMAIL_COOLDOWN_PERIOD = 10000; // 10 seconds in milliseconds

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { emotion, focus, thumbs_up, wave, timestamp, user_email, current_tab_url } = body;

    console.log('CV event received:', { emotion, focus, thumbs_up, wave, timestamp, user_email, current_tab_url });

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
    if (focus !== 'focused') {
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
    
    // Find the user's group to send the message to the group chat and update pet health
    try {
      // Find all groups
      const allGroups = await Group.find({});
      const allConnections = await UserConnection.find({ userId: dbUser._id });
      console.log('All connections:', allConnections);
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
      
      // If a group is found and user is distracted
      if (groupData && focus !== 'focused') {
        // 1. Send the message to the group chat
        if (messageToSend) {
          console.log('Sending message to group chat:', messageToSend);
          await createSystemMessage(groupData._id.toString(), messageToSend);
          
          // Check if we're within the email cooldown period
          const userId = dbUser._id.toString();
          const now = Date.now();
          const lastEmailTime = emailCooldowns.get(userId) || 0;
          const timeElapsed = now - lastEmailTime;
          
          if (timeElapsed >= EMAIL_COOLDOWN_PERIOD) {
            // It's been long enough since the last email, send a new one
            console.log(`Sending email notification (last was ${timeElapsed}ms ago)`);
            
            if(allConnections.length === 1) {
              await sendEmail(messageToSend, allConnections[0].email);
            } else {
              await batchSendEmails(messageToSend, allConnections.map(conn => conn.email));
            }
            
            // Update the cooldown timestamp
            emailCooldowns.set(userId, now);
            console.log(`Email sent and cooldown updated for user ${userId}`);
          } else {
            console.log(`Skipping email - cooldown active (${timeElapsed}ms elapsed, need ${EMAIL_COOLDOWN_PERIOD}ms)`);
          }
          
          console.log('Message sent to group chat:', messageToSend);
        }
        
        // 2. Update the group pet's health (only based on focus)
        const groupPet = await getPetByGroupId(groupData._id.toString());
        if (groupPet) {
          // For group pet: only focus affects health, and at a slower rate than personal pet
          if (focus === 'distracted') {
            // Decrease group pet health at a slower rate (5 points)
            await decreasePetHealth(groupPet._id as string, 5);
            console.log('Group pet health decreased by 5 due to distraction');
          } else if (focus === 'focused') {
            // Increase group pet health at a slower rate (2 points)
            await increasePetHealth(groupPet._id as string, 2);
            console.log('Group pet health increased by 2 due to focus');
          }
        }
      }
    } catch (error) {
      console.error('Error processing group data:', error);
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