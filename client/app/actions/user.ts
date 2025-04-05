'use server';

import { connectToDatabase } from "@/lib/db";
import User, { IUser } from "@/models/user.model";

// Helper function to serialize a user document
function serializeUser(user: any): any {
  if (!user) return null;
  
  // Convert Mongoose document to plain object
  const userObj = user.toObject ? user.toObject() : user;
  
  // Ensure _id is converted to string
  if (userObj._id) {
    userObj._id = userObj._id.toString();
  }
  
  // Convert any other ObjectIds to strings
  if (userObj.groupId && typeof userObj.groupId !== 'string') {
    userObj.groupId = userObj.groupId.toString();
  }
  
  return userObj;
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string): Promise<any> {
  try {
    await connectToDatabase();
    const user = await User.findOne({ email });
    return serializeUser(user);
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

/**
 * Get a user by ID
 */
export async function getUserById(userId: string): Promise<any> {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);
    return serializeUser(user);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

/**
 * Create a new user
 */
export async function createUser(userData: { name: string; email: string; tickData?: string[] }): Promise<any> {
  try {
    await connectToDatabase();
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return serializeUser(existingUser);
    }
    const user = new User(userData);
    const savedUser = await user.save();
    return serializeUser(savedUser);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Update a user
 */
export async function updateUser(userId: string, userData: Partial<IUser>): Promise<any> {
  try {
    await connectToDatabase();
    const updatedUser = await User.findByIdAndUpdate(userId, userData, { new: true });
    return serializeUser(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Add tick data to a user
 */
export async function addTickData(userId: string, tickItem: string): Promise<any> {
  try {
    await connectToDatabase();
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { tickData: tickItem } },
      { new: true }
    );
    return serializeUser(updatedUser);
  } catch (error) {
    console.error('Error adding tick data:', error);
    throw error;
  }
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<any[]> {
  try {
    await connectToDatabase();
    const users = await User.find({});
    return users.map(user => serializeUser(user));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}