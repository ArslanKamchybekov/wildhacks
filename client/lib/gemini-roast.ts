import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API client
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

// Define types for user data
type UserData = {
  name: string;
  email: string;
  tickData: any[];
};

/**
 * Generate a roast for a specific user based on their behavior
 * @param userName The name of the user to roast
 * @param eventType The type of event that triggered the roast (e.g., 'eye_movement')
 * @param eventValue The specific behavior detected (e.g., 'looking_away')
 * @param userTicks Array of previous observations about the user
 * @returns A personalized roast message
 */
export async function generateRoastForUser(
  userName: string,
  eventType: string,
  eventValue: string,
  userTicks: any[] = [],
  currentUrl?: string,
  alignmentReason?: string
): Promise<string> {
  try {
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Format the user's previous tick data if available
    let tickContext = "";
    if (userTicks && userTicks.length > 0) {
      const ticksFormatted = userTicks.map(
        (tick) => `- ${tick.content} (observed on ${new Date(tick.timestamp).toLocaleDateString()})`
      ).join("\n");
      
      tickContext = `\n\nPrevious observations about ${userName}:\n${ticksFormatted}`;
    }
    
    // Create a prompt that focuses specifically on generating a roast
    // Include the current URL and alignment reason if available
    let urlContext = currentUrl ? `They are currently browsing: ${currentUrl}` : '';
    if (alignmentReason) {
      urlContext += `\nReason this is distracting: ${alignmentReason}`;
    }
    
    const prompt = `Generate a funny, light-hearted roast for ${userName} who is studying.
The computer vision system detected that they were "${eventValue}" (event type: ${eventType}).
${urlContext}
${tickContext}

Create a playful and motivational roast that:
1. References their specific behavior (${eventValue})
2. ${currentUrl ? 'Mentions the website they are visiting if appropriate' : 'Is personalized to them'}
3. Is humorous but not mean-spirited
4. Encourages them to stay focused on their studies
5. Is 1-2 sentences maximum
6. Has a clever or witty tone

The roast should be personalized to ${userName} and their specific behavior.`;

    // Generate the roast
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating roast from Gemini:", error);
    return `Hey ${userName}, I noticed you got distracted. Let's get back to focusing!`;
  }
}
