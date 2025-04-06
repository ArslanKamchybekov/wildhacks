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
    
    // Find a group where the user is a member
    // Since members is stored as a JSON string, we need to query all groups
    // and check if the user's email is in the parsed members array
    const allGroups = await Group.find({});
    let group = null;
    let groupContext = ``;
    let roastLevel = 5; // Default roast level if not specified
    
    for (const g of allGroups) {
      try {
        const membersArray = JSON.parse(g.members);
        if (membersArray.includes(user.email)) {
          group = g;
          // Get the roast level if available
          if (g.geminiRoastLevel !== undefined) {
            roastLevel = g.geminiRoastLevel;
            console.log(`Using group roast level: ${roastLevel}`);
          }
          
          groupContext = `
            Group Name: ${g.name}
            Group Members: ${membersArray.join(', ')}
            Roast Level: ${roastLevel}
          `;
          break;
        }
      } catch (error) {
        console.error('Error parsing group members:', error);
      }
    }
    
    if (!group) {
      console.log('No group found for user:', user.email);
      // Instead of throwing an error, create a personal roast without group context
      console.log('Using personal roast without group context');
    }
    
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
      const userName = user.name || user.email.split('@')[0];
      roastContent = await generateRoastForUser(
        userName,
        emotion,
        focus,
        ticks,
        isEmptyUrl ? undefined : current_tab_url, // Only pass URL if it's valid
        isEmptyUrl ? undefined : alignmentReason, // Only pass alignment reason if URL is valid
        activeSession?.goal, // Pass the active session goal if available
        roastLevel // Pass the roast level (default or from group)
      );
    } else {
      console.log('URL aligns with session goal. No roast needed.');
      return ''; // Return empty string to indicate no roast needed
    }

    // Save the roast if we have a group
    if (group) {
      await saveRoast(
        group._id.toString(),
        user._id,
        roastContent,
        group.geminiRoastLevel // Use geminiRoastLevel from the group model
      );
    } else {
      // Save roast without group context
      await saveRoast(
        'personal', // Use 'personal' as groupId for personal roasts
        user._id,
        roastContent,
        5 // Default roast level
      );
    }
      
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
  roast_level: number
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
