'use server';

import { connectToDatabase } from "@/lib/db";
import UserConnection, { IUserConnection } from "@/models/user-connection.model";

// Helper function to serialize a user connection document
function serializeConnection(connection: any): any {
  if (!connection) return null;
  
  // Convert Mongoose document to plain object
  const connectionObj = connection.toObject ? connection.toObject() : connection;
  
  // Ensure _id is converted to string
  if (connectionObj._id) {
    connectionObj._id = connectionObj._id.toString();
  }
  
  return connectionObj;
}

/**
 * Create a new user connection
 */
export async function createUserConnection(connectionData: { 
  userId: string;
  email: string;
  connectionLabel: string;
}): Promise<any> {
  try {
    await connectToDatabase();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(connectionData.email)) {
      throw new Error("Invalid email format");
    }
    
    // Create connection
    const connection = new UserConnection({
      ...connectionData,
      email: connectionData.email.trim().toLowerCase() // Normalize email
    });
    
    const savedConnection = await connection.save();
    return serializeConnection(savedConnection);
  } catch (error) {
    console.error('Error creating user connection:', error);
    throw error;
  }
}

/**
 * Get all connections for a user
 */
export async function getUserConnections(userId: string): Promise<any[]> {
  try {
    await connectToDatabase();
    const connections = await UserConnection.find({ userId }).sort({ createdAt: -1 });
    return connections.map(connection => serializeConnection(connection));
  } catch (error) {
    console.error('Error getting user connections:', error);
    throw error;
  }
}

/**
 * Delete a connection
 */
export async function deleteUserConnection(connectionId: string): Promise<boolean> {
  try {
    await connectToDatabase();
    await UserConnection.findByIdAndDelete(connectionId);
    return true;
  } catch (error) {
    console.error('Error deleting user connection:', error);
    throw error;
  }
}

/**
 * Update a user connection
 */
export async function updateUserConnection(
  connectionId: string, 
  updates: {
    email?: string;
    connectionLabel?: string;
  }
): Promise<any> {
  try {
    await connectToDatabase();
    
    // Validate email if provided
    if (updates.email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        throw new Error("Invalid email format");
      }
      
      // Normalize email
      updates.email = updates.email.trim().toLowerCase();
    }
    
    const updatedConnection = await UserConnection.findByIdAndUpdate(
      connectionId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    
    return serializeConnection(updatedConnection);
  } catch (error) {
    console.error('Error updating user connection:', error);
    throw error;
  }
}
