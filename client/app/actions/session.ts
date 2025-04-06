'use server';

import { connectToDatabase } from "@/lib/db";
import Session, { ISession } from "@/models/session.model";

// Helper function to serialize a session document
function serializeSession(session: any): any {
  if (!session) return null;
  
  // Convert Mongoose document to plain object
  const sessionObj = session.toObject ? session.toObject() : session;
  
  // Ensure _id is converted to string
  if (sessionObj._id) {
    sessionObj._id = sessionObj._id.toString();
  }
  
  // Convert any other ObjectIds to strings
  if (sessionObj.userId && typeof sessionObj.userId !== 'string') {
    sessionObj.userId = sessionObj.userId.toString();
  }
  
  if (sessionObj.groupId && typeof sessionObj.groupId !== 'string') {
    sessionObj.groupId = sessionObj.groupId.toString();
  }
  
  return sessionObj;
}

/**
 * Create a new session
 */
export async function createSession(sessionData: { 
  userId: string; 
  groupId?: string; 
  goal: string;
  deadline: string;
}): Promise<any> {
  try {
    await connectToDatabase();
    const session = new Session(sessionData);
    const savedSession = await session.save();
    return serializeSession(savedSession);
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Get a session by ID
 */
export async function getSessionById(sessionId: string): Promise<any> {
  try {
    await connectToDatabase();
    const session = await Session.findById(sessionId);
    return serializeSession(session);
  } catch (error) {
    console.error('Error getting session by ID:', error);
    throw error;
  }
}

/**
 * Get active sessions for a user
 */
export async function getActiveSessionsByUserId(userId: string): Promise<any[]> {
  try {
    await connectToDatabase();
    const sessions = await Session.find({ 
      userId, 
      status: 'active' 
    }).sort({ createdAt: -1 });
    return sessions.map(session => serializeSession(session));
  } catch (error) {
    console.error('Error getting active sessions for user:', error);
    throw error;
  }
}

/**
 * Get all sessions for a user
 */
export async function getAllSessionsByUserId(userId: string): Promise<any[]> {
  try {
    await connectToDatabase();
    const sessions = await Session.find({ userId }).sort({ createdAt: -1 });
    return sessions.map(session => serializeSession(session));
  } catch (error) {
    console.error('Error getting all sessions for user:', error);
    throw error;
  }
}

/**
 * Update session status
 */
export async function updateSessionStatus(sessionId: string, status: 'active' | 'completed' | 'cancelled'): Promise<any> {
  try {
    await connectToDatabase();
    const updatedSession = await Session.findByIdAndUpdate(
      sessionId, 
      { status, updatedAt: new Date() }, 
      { new: true }
    );
    return serializeSession(updatedSession);
  } catch (error) {
    console.error('Error updating session status:', error);
    throw error;
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    await connectToDatabase();
    await Session.findByIdAndDelete(sessionId);
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}

/**
 * Get the current active session for a user
 * This is used by the CV event endpoint to associate events with the current session
 */
export async function getCurrentActiveSession(userId: string): Promise<any> {
  try {
    await connectToDatabase();
    const activeSessions = await Session.find({ 
      userId, 
      status: 'active' 
    }).sort({ createdAt: -1 }).limit(1);
    
    if (activeSessions.length === 0) {
      return null;
    }
    
    return serializeSession(activeSessions[0]);
  } catch (error) {
    console.error('Error getting current active session:', error);
    throw error;
  }
}
