import { connectToDatabase } from '@/lib/db';
import CVEvent, { VALID_EVENT_TYPES, VALID_EVENT_VALUES } from '@/models/cv-event.model';
import GeminiRoast from '@/models/gemini-roast.model';
import User from '@/models/user.model';
import Group from '@/models/group.model';
import { generateRoastForUser } from '@/lib/gemini-roast';
import { createSystemMessage } from '@/app/actions/message';

/**
 * Validate a CV event
 */
export function validateCVEvent(
  event_type: string, 
  event_value: string
): { isValid: boolean; errorMessage?: string } {
  // Validate event type
  if (!VALID_EVENT_TYPES.includes(event_type)) {
    return {
      isValid: false,
      errorMessage: `Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`
    };
  }
  
  // Validate event value
  if (VALID_EVENT_VALUES[event_type as keyof typeof VALID_EVENT_VALUES] && 
      !VALID_EVENT_VALUES[event_type as keyof typeof VALID_EVENT_VALUES].includes(event_value)) {
    return {
      isValid: false,
      errorMessage: `Invalid event_value for ${event_type}. Must be one of: ${VALID_EVENT_VALUES[event_type as keyof typeof VALID_EVENT_VALUES].join(', ')}`
    };
  }
  
  return { isValid: true };
}

/**
 * Create a new CV event
 */
export async function createCVEvent(
  session_id: string,
  user_id: string,
  event_type: string,
  event_value: string,
  timestamp?: string
): Promise<any> {
  await connectToDatabase();
  
  // Create a new CV event
  const newEvent = new CVEvent({
    session_id,
    user_id,
    event_type,
    event_value,
    event_timestamp: timestamp ? new Date(timestamp) : new Date()
  });
  
  // Save the event
  await newEvent.save();
  
  return newEvent;
}

/**
 * Generate a roast based on the CV event
 */
export async function generateRoast(
  userId: string, 
  eventType: string, 
  eventValue: string
): Promise<string> {
  try {
    await connectToDatabase();
    
    // Find the user
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    console.log(user);
    
    // Find the user's group by checking all groups
    const allGroups = await Group.find({});
    let groupData = null;
    
    // Loop through all groups and check if the user's email is in the members array
    for (const group of allGroups) {
      try {
        const membersArray = JSON.parse(group.members);
        if (membersArray.includes(user.email)) {
          groupData = group;
          break;
        }
      } catch (e) {
        console.error('Error parsing group members:', e);
      }
    }
    
    if (!groupData) {
      throw new Error('Group not found for user: ' + user.email);
    }

    console.log(groupData);
    
    // Parse the members JSON string to get an array
    const members = JSON.parse(groupData.members);
    
    // Create group context for Gemini
    const group = {
      id: groupData._id.toString(),
      name: groupData.name,
      members: members
    };

    console.log(group);
    
    // Only use the current user's tick data
    let ticks: any[] = [];
    if (user.tickData && user.tickData.length > 0) {
      try {
        ticks = user.tickData.map((tickJson: string) => JSON.parse(tickJson));
      } catch (e) {
        console.error('Error parsing tick data:', e);
      }
    }
    
    const usersWithTicks = [
      {
        userEmail: user.email,
        name: user.name,
        ticks: ticks
      }
    ];

    console.log(usersWithTicks);
    
    // Generate the roast using the specialized roast function
    const roastContent = await generateRoastForUser(
      user.name || user.email.split('@')[0], // Use name or first part of email
      eventType,
      eventValue,
      ticks
    );

    console.log(roastContent);
    
    return roastContent;
  } catch (error) {
    console.error('Error generating roast:', error);
    return 'Hey, I noticed you got distracted. Let\'s get back to focusing on your work!';
  }
}

/**
 * Save a generated roast
 */
export async function saveRoast(
  group_id: string,
  target_user_id: string,
  roast_content: string,
  roast_level: number = 5
): Promise<any> {
  await connectToDatabase();
  
  // Create a new roast
  const newRoast = new GeminiRoast({
    group_id,
    target_user_id,
    roast_content,
    roast_level
  });
  
  // Save the roast
  await newRoast.save();
  
  return newRoast;
}

/**
 * Process a CV event and generate a roast if needed
 */
export async function processCVEvent(
  session_id: string,
  user_id: string,
  event_type: string,
  event_value: string,
  timestamp?: string
): Promise<{ event: any; roast: string | null }> {
  // Create the CV event
  const newEvent = await createCVEvent(
    session_id,
    user_id,
    event_type,
    event_value,
    timestamp
  );
  
  // Generate a roast if the event indicates distraction
  let roastContent = null;
  if (
    (event_type === 'eye_movement' && event_value === 'looking_away') ||
    (event_type === 'emotion' && ['frustrated', 'angry'].includes(event_value)) ||
    (event_type === 'face_movement' && event_value === 'nodding')
  ) {
    // Generate a roast
    roastContent = await generateRoast(user_id, event_type, event_value);
    
    // Find the user
    const user = await User.findOne({ _id: user_id });
    if (!user) {
      console.error('User not found for roast saving');
      return { event: newEvent, roast: roastContent };
    }
    
    // Find the user's group by checking all groups
    const allGroups = await Group.find({});
    let groupData = null;
    
    // Loop through all groups and check if the user's email is in the members array
    for (const group of allGroups) {
      try {
        const membersArray = JSON.parse(group.members);
        if (membersArray.includes(user.email)) {
          groupData = group;
          break;
        }
      } catch (e) {
        console.error('Error parsing group members:', e);
      }
    }
    
    if (groupData) {
      // Save the roast
      await saveRoast(
        groupData._id,
        user_id,
        roastContent
      );
      
      // Send the roast to the chat as a system message
      try {
        await createSystemMessage(groupData._id.toString(), roastContent);
        console.log('Roast sent to chat:', roastContent);
      } catch (error) {
        console.error('Error sending roast to chat:', error);
      }
    }
  }
  
  return {
    event: newEvent,
    roast: roastContent
  };
}
