"use server";

import { connectToDatabase } from "@/lib/db";
import Message, { IMessage } from "@/models/message.model";
import twilio from "twilio";

const accountSID = "AC59cdce9d3c1bf57b08638f8adac95221";
const authToken = "12e87697c96629ba1fa27ddd98d84445";

const client = twilio(accountSID, authToken);
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

export async function sendSms(
  message_content: string,
  reciever_number: string
) {
  try {
    const message = await client.messages.create({
      body: message_content,
      from: "+18779561287",
      to: `+${reciever_number}`,
    });
    console.log(`Message sent with SID: ${message.sid}`);
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
}

export async function batchSendSMS(
  message_content: string,
  destination_numbers: string[]
) {
  try {
    destination_numbers.map((destination_number: string) => {
      sendSms(message_content, destination_number);
    });
  } catch (error) {
    console.log("Error with sending batch SMS");
  }
}
