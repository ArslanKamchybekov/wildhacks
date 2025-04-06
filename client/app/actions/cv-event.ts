import { connectToDatabase } from '@/lib/db';
import User from '@/models/user.model';
import Group from '@/models/group.model';
import { generateRoastForUser } from '@/lib/gemini-roast';
import GeminiRoast from '@/models/gemini-roast.model';
import { getCurrentActiveSession } from '@/app/actions/session';

/**
 * Generate a roast based on the CV event data
 */
export async function generateRoast(
  userId: string, 
  emotion: string,
  focus: string,
  current_tab_url?: string
): Promise<string> {
  try {
    await connectToDatabase();
    
    // Find the user
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    // Get the active session for this user
    const activeSession = await getCurrentActiveSession(userId);
    console.log('Active session:', activeSession);
    
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
    
    // Check if the current URL aligns with the session goal
    let shouldRoast = true;
    let alignmentReason = '';
    let isEmptyUrl = !current_tab_url || current_tab_url === '' || current_tab_url === 'null';
    
    // Skip URL alignment check if URL is empty or null (CV-only data)
    if (!isEmptyUrl && activeSession && activeSession.goal) {
      console.log('Checking URL alignment with session goal...');
      console.log('Current URL:', current_tab_url);
      console.log('Session goal:', activeSession.goal);
      
      // Use Gemini to determine if the URL aligns with the session goal
      try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        const prompt = `
          I'm currently studying with the goal: "${activeSession.goal}"
          I'm browsing this website: "${current_tab_url}"
          
          Analyze if this website is aligned with my study goal. 
          Respond with ONLY "yes" or "no" followed by a very brief reason in parentheses.
          Example: "yes (educational content about the topic)" or "no (social media distraction)"
        `;
        
        const result = await model.generateContent(prompt);
        const response = result.response.text().trim().toLowerCase();
        console.log('Alignment check result:', response);
        
        // Parse the response
        if (response.startsWith('yes')) {
          shouldRoast = false; // URL aligns with goal, don't roast
          alignmentReason = response.includes('(') ? response.substring(response.indexOf('(')) : '';
        } else {
          // Extract the reason if available
          alignmentReason = response.includes('(') ? response.substring(response.indexOf('(')) : '';
        }
      } catch (error) {
        console.error('Error checking URL alignment:', error);
        // If there's an error, default to creating a roast
        shouldRoast = true;
      }
    }
    
    // Generate a roast based on conditions
    let roastContent = null;
    
    // Always generate a roast for CV data (empty URL) or if URL doesn't align with goals
    if (shouldRoast || isEmptyUrl) {
      // Log appropriate message based on source
      if (isEmptyUrl) {
        console.log('Generating roast based on computer vision data (no URL)...');
      } else {
        console.log('URL does not align with session goal. Generating roast...');
      }
      
      // Generate roast with appropriate context
      roastContent = await generateRoastForUser(
        user.name || user.email.split('@')[0], // Use name or first part of email
        'distracted', // Behavior description
        focus === 'distracted' ? 'looking away from the screen' : emotion, // Details based on focus/emotion
        ticks,
        isEmptyUrl ? undefined : current_tab_url, // Only pass URL if it's valid
        isEmptyUrl ? undefined : alignmentReason // Only pass alignment reason if URL is valid
      );
    } else {
      console.log('URL aligns with session goal. No roast needed.');
      return ''; // Return empty string to indicate no roast needed
    }

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
