"use server";

import { connectToDatabase } from "@/lib/db";
import Message, { IMessage } from "@/models/message.model";
import twilio from "twilio";

// We'll use email instead of SMS for notifications
import { sendEmail as sendEmailLib } from '@/lib/email';
/**
 * Get messages by group ID
 */
export async function getMessagesByGroupId(groupId: string): Promise<
  {
    _id: string;
    groupId: string;
    userId: string | null;
    content: string;
    createdAt: string;
  }[]
> {
  try {
    await connectToDatabase();
    const messages = await Message.find({ groupId }).sort({ createdAt: 1 });

    // Return serializable objects
    return messages.map((msg) => ({
      _id: msg._id.toString(),
      groupId: msg.groupId.toString(),
      userId: msg.userId ? msg.userId.toString() : null,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error getting messages by group ID:", error);
    throw error;
  }
}

/**
 * Create a new message
 */
export async function createMessage(messageData: {
  groupId: string;
  userId?: string | null;
  content: string;
}): Promise<{
  _id: string;
  groupId: string;
  userId: string | null;
  content: string;
  createdAt: string;
}> {
  try {
    await connectToDatabase();
    const message = new Message(messageData);
    const savedMessage = await message.save();

    // Return a serializable object
    return {
      _id: savedMessage._id.toString(),
      groupId: savedMessage.groupId.toString(),
      userId: savedMessage.userId ? savedMessage.userId.toString() : null,
      content: savedMessage.content,
      createdAt: savedMessage.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("Error creating message:", error);
    throw error;
  }
}

/**
 * Create a system message (no user ID)
 */
export async function createSystemMessage(
  groupId: string,
  content: string
): Promise<{
  _id: string;
  groupId: string;
  userId: string | null;
  content: string;
  createdAt: string;
}> {
  try {
    await connectToDatabase();
    const message = new Message({
      groupId,
      userId: null, // Null indicates system/bot message
      content,
    });
    const savedMessage = await message.save();

    // Return a serializable object
    return {
      _id: savedMessage._id.toString(),
      groupId: savedMessage.groupId.toString(),
      userId: null,
      content: savedMessage.content,
      createdAt: savedMessage.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("Error creating system message:", error);
    throw error;
  }
}

/**
 * Get recent messages by group ID
 */
export async function getRecentMessagesByGroupId(
  groupId: string,
  limit: number = 50
): Promise<
  {
    _id: string;
    groupId: string;
    userId: string | null;
    content: string;
    createdAt: string;
  }[]
> {
  try {
    await connectToDatabase();
    const messages = await Message.find({ groupId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .sort({ createdAt: 1 });

    // Return serializable objects
    return messages.map((msg) => ({
      _id: msg._id.toString(),
      groupId: msg.groupId.toString(),
      userId: msg.userId ? msg.userId.toString() : null,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error getting recent messages by group ID:", error);
    throw error;
  }
}

/**
 * Delete a message by ID
 */
export async function deleteMessage(messageId: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const result = await Message.findByIdAndDelete(messageId);
    return !!result;
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
}

/**
 * Send an email notification
 */
export async function sendEmail(
  message_content: string,
  receiver_email: string
): Promise<string | null> {
  try {
    // Trim message content to avoid any extra whitespace
    const trimmedMessage = message_content.trim();
    
    // Log the email attempt
    console.log(`Attempting to send email to ${receiver_email}`);
    
    // Send the email using the imported library function
    const result = await sendEmailLib({
      to: receiver_email,
      subject: "Duck Tracker Notification",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Duck Tracker Update</h2>
          <p>${trimmedMessage}</p>
          <p>- The Duck Tracker Team</p>
        </div>
      `
    });
    
    console.log(`Email result:`, result);
    return result.success ? 'sent' : null;
  } catch (error) {
    console.error("Error sending email:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    // Don't throw the error, just log it
    return null;
  }
}

/**
 * Send emails to multiple recipients
 */
export async function batchSendEmails(
  message_content: string,
  destination_emails: string[]
): Promise<number> {
  // Skip if there are no emails or no message content
  if (!destination_emails.length || !message_content) {
    console.log('No email addresses provided or empty message. Skipping email send.');
    return 0;
  }

  try {
    console.log(`Sending batch emails to ${destination_emails.length} recipients`);
    console.log('Email addresses:', destination_emails);
    
    // Process one message at a time 
    let successCount = 0;
    for (const email of destination_emails) {
      try {
        const result = await sendEmail(message_content, email);
        if (result) successCount++;
        // Add a small delay between sends
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (innerError) {
        console.error(`Failed to send to ${email}:`, innerError);
      }
    }
    
    console.log(`Successfully sent ${successCount} out of ${destination_emails.length} emails`);
    return successCount;
  } catch (error) {
    console.error("Error with sending batch emails:", error);
    return 0;
  }
}
