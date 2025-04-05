import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API client
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

// Define types for tick data
type TickData = {
  content: string;
  addedBy: string;
  timestamp: string;
  groupId: string;
};

type UserWithTicks = {
  userEmail: string;
  name?: string;
  ticks: TickData[];
};

type GroupContext = {
  id: string;
  name: string;
  members: string[];
  goals?: string[];
};

/**
 * Generate a response from Gemini with group context and tick data
 */
export async function generateResponseWithContext(
  message: string,
  group: GroupContext,
  usersWithTicks: UserWithTicks[],
  chatHistory: { role: "user" | "model"; content: string }[] = [],
  roastLevel: number = 5
): Promise<string> {
  try {
    // Format the group context
    const groupContext = `Group Name: ${group.name}\nGroup Members: ${group.members.join(", ")}${
      group.goals ? `\nGroup Goals: ${group.goals.join(", ")}` : ""
    }\nRoast Level: ${roastLevel}/10`;

    // Format the tick data for each user
    const tickContext = usersWithTicks
      .map((user) => {
        if (user.ticks.length === 0)
          return `No observations about ${user.name || user.userEmail}.`;
        
        const ticksFormatted = user.ticks
          .map(
            (tick) =>
              `- ${tick.content} (observed by ${tick.addedBy} on ${new Date(
                tick.timestamp
              ).toLocaleDateString()})`
          )
          .join("\n");
        
        return `Observations about ${user.name || user.userEmail}:\n${ticksFormatted}`;
      })
      .join("\n\n");

    // Create a context message to send as the first user message
    let responseStyle = "";
    if (roastLevel <= 2) {
      responseStyle = "Be very gentle and supportive in your responses. Avoid any criticism or roasting.";
    } else if (roastLevel <= 4) {
      responseStyle = "Be mostly supportive with occasional light teasing. Keep criticism constructive and mild.";
    } else if (roastLevel <= 6) {
      responseStyle = "Balance support with moderate roasting. You can point out flaws in a humorous way.";
    } else if (roastLevel <= 8) {
      responseStyle = "Be more direct with roasts while maintaining some tact. Don't hold back too much.";
    } else {
      responseStyle = "Go all out with savage roasts. Be brutally honest but still funny.";
    }

    const contextMessage = `Here is important context about the group I'm assisting:
${groupContext}

Observations about group members:
${tickContext}

When responding, please:
1. Use these observations to personalize responses
2. Reference specific observations when relevant
3. ${responseStyle}
4. If asked about a specific member, use their observations for context
5. Keep responses focused on helping the group achieve their goals`;

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Start the chat with context in history instead of system instruction
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: contextMessage }] },
        {
          role: "model",
          parts: [
            {
              text: "Understood. I'll use the context and observations to assist supportively. How can I help today?"
            }
          ]
        },
        ...chatHistory.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }))
      ],
    });

    // Send the user message and get response
    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error("Error generating response from Gemini:", error);
    return "I'm sorry, I encountered an error while processing your request.";
  }
}

/**
 * Generate a response with just text context instead of structured data
 */
export async function generateResponseWithTextContext(
  message: string,
  contextText: string,
  groupName: string
): Promise<string> {
  try {
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Start the chat with context in history
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: `Here is important context about the group I'm assisting:\nGroup Name: ${groupName}\n\n${contextText}` }] },
        {
          role: "model",
          parts: [{ text: "Understood. I'll use this context to assist. How can I help today?" }]
        }
      ],
    });

    // Send the user message and get response
    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error("Error generating response from Gemini:", error);
    return "I'm sorry, I encountered an error while processing your request.";
  }
}

/**
 * Generate a simple response from Gemini without group context
 */
export async function generateSimpleResponse(message: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(message);
    return result.response.text();
  } catch (error) {
    console.error("Error generating simple response from Gemini:", error);
    return "I'm sorry, I encountered an error while processing your request.";
  }
}