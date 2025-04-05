'use server';

import { connectToDatabase } from '@/lib/db';
import Group, { IGroup } from '@/models/group.model';
import Pet from '@/models/pet.model';
import mongoose from 'mongoose';

/**
 * Get a group by ID
 */
export async function getGroupById(groupId: string): Promise<{ 
  id: string; 
  name: string; 
  description: string;
  members: string; 
  petId: string;
  geminiRoastLevel: number;
  createdBy: string;
} | null> {
  try {
    await connectToDatabase();
    const group = await Group.findById(groupId);
    
    if (!group) return null;
    
    // Return a plain serializable object
    return {
      id: group._id.toString(),
      name: group.name,
      description: group.description || '',
      members: group.members,
      petId: group.petId ? group.petId.toString() : '',
      geminiRoastLevel: group.geminiRoastLevel || 5,
      createdBy: group.createdBy || ''
    };
  } catch (error) {
    console.error('Error getting group by ID:', error);
    throw error;
  }
}

/**
 * Create a new group with a pet
 */
export async function createGroup(groupData: { 
  name: string; 
  description?: string;
  members: string[];
  createdBy: string;
  geminiRoastLevel?: number;
}): Promise<{ 
  id: string; 
  name: string; 
  description: string;
  members: string; 
  petId: string;
  geminiRoastLevel: number;
  createdBy: string;
}> {
  try {
    // Connect to the database first
    await connectToDatabase();
    
    // Convert members array to JSON string
    const membersJson = JSON.stringify(groupData.members);
    
    // Create a new group without petId initially
    const group = new Group({
      name: groupData.name,
      description: groupData.description || '',
      members: membersJson,
      geminiRoastLevel: groupData.geminiRoastLevel || 5,
      createdBy: groupData.createdBy
    });
    
    await group.save();
    
    // Create a new pet for the group
    const pet = new Pet({
      groupId: group._id,
      health: 100 // Starting health
    });
    
    await pet.save();
    
    // Update the group with the pet ID
    group.petId = pet._id;
    await group.save();
    
    // Return a plain serializable object instead of the Mongoose document
    return {
      id: group._id.toString(),
      name: group.name,
      description: group.description || '',
      members: group.members,
      petId: group.petId ? group.petId.toString() : '',
      geminiRoastLevel: group.geminiRoastLevel || 5,
      createdBy: group.createdBy || ''
    };
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
}

/**
 * Update a group
 */
export async function updateGroup(groupId: string, groupData: Partial<IGroup>): Promise<{ 
  id: string; 
  name: string; 
  description: string;
  members: string; 
  petId: string;
  geminiRoastLevel: number;
  createdBy: string;
} | null> {
  try {
    await connectToDatabase();
    const group = await Group.findByIdAndUpdate(groupId, groupData, { new: true });
    
    if (!group) return null;
    
    // Return a plain serializable object
    return {
      id: group._id.toString(),
      name: group.name,
      description: group.description || '',
      members: group.members,
      petId: group.petId ? group.petId.toString() : '',
      geminiRoastLevel: group.geminiRoastLevel || 5,
      createdBy: group.createdBy || ''
    };
  } catch (error) {
    console.error('Error updating group:', error);
    throw error;
  }
}

/**
 * Update Gemini roast level for a group
 */
export async function updateGeminiRoastLevel(groupId: string, level: number): Promise<{ 
  id: string; 
  name: string; 
  description: string;
  members: string; 
  petId: string;
  geminiRoastLevel: number;
  createdBy: string;
} | null> {
  try {
    await connectToDatabase();
    
    // Ensure level is within valid range (1-10)
    const validLevel = Math.max(1, Math.min(10, level));
    
    const group = await Group.findByIdAndUpdate(
      groupId, 
      { geminiRoastLevel: validLevel },
      { new: true }
    );
    
    if (!group) return null;
    
    // Return a plain serializable object
    return {
      id: group._id.toString(),
      name: group.name,
      description: group.description || '',
      members: group.members,
      petId: group.petId ? group.petId.toString() : '',
      geminiRoastLevel: group.geminiRoastLevel || 5,
      createdBy: group.createdBy || ''
    };
  } catch (error) {
    console.error('Error updating Gemini roast level:', error);
    throw error;
  }
}

/**
 * Add a member to a group
 */
export async function addMemberToGroup(groupId: string, userId: string): Promise<{ 
  id: string; 
  name: string; 
  description: string;
  members: string; 
  petId: string;
  geminiRoastLevel: number;
  createdBy: string;
} | null> {
  try {
    await connectToDatabase();
    
    // Get the current group
    const group = await Group.findById(groupId);
    if (!group) return null;
    
    // Parse the current members
    const members = JSON.parse(group.members);
    
    // Add the new member if not already in the group
    if (!members.includes(userId)) {
      members.push(userId);
      group.members = JSON.stringify(members);
      await group.save();
    }
    
    // Return a plain serializable object
    return {
      id: group._id.toString(),
      name: group.name,
      description: group.description || '',
      members: group.members,
      petId: group.petId ? group.petId.toString() : '',
      geminiRoastLevel: group.geminiRoastLevel || 5,
      createdBy: group.createdBy || ''
    };
  } catch (error) {
    console.error('Error adding member to group:', error);
    throw error;
  }
}

/**
 * Remove a member from a group
 */
export async function removeMemberFromGroup(groupId: string, userId: string): Promise<{ 
  id: string; 
  name: string; 
  description: string;
  members: string; 
  petId: string;
  geminiRoastLevel: number;
  createdBy: string;
} | null> {
  try {
    await connectToDatabase();
    
    // Get the current group
    const group = await Group.findById(groupId);
    if (!group) return null;
    
    // Parse the current members
    const members = JSON.parse(group.members);
    
    // Remove the member
    const updatedMembers = members.filter((id: string) => id !== userId);
    group.members = JSON.stringify(updatedMembers);
    
    await group.save();
    
    // Return a plain serializable object
    return {
      id: group._id.toString(),
      name: group.name,
      description: group.description || '',
      members: group.members,
      petId: group.petId ? group.petId.toString() : '',
      geminiRoastLevel: group.geminiRoastLevel || 5,
      createdBy: group.createdBy || ''
    };
  } catch (error) {
    console.error('Error removing member from group:', error);
    throw error;
  }
}

/**
 * Get all groups
 */
export async function getAllGroups(): Promise<{ 
  id: string; 
  name: string; 
  description: string;
  members: string; 
  petId: string;
  geminiRoastLevel: number;
  createdBy: string;
}[]> {
  try {
    await connectToDatabase();
    const groups = await Group.find({});
    
    // Return an array of plain serializable objects
    return groups.map(group => ({
      id: group._id.toString(),
      name: group.name,
      description: group.description || '',
      members: group.members,
      petId: group.petId ? group.petId.toString() : '',
      geminiRoastLevel: group.geminiRoastLevel || 5,
      createdBy: group.createdBy || ''
    }));
  } catch (error) {
    console.error('Error getting all groups:', error);
    throw error;
  }
}

/**
 * Get groups by member
 */
export async function getGroupsByMember(userId: string): Promise<{ 
  id: string; 
  name: string; 
  description: string;
  members: string; 
  petId: string;
  geminiRoastLevel: number;
  createdBy: string;
}[]> {
  try {
    await connectToDatabase();
    
    // Find groups where the userId is in the members array
    // This requires a more complex query since members is stored as a JSON string
    const allGroups = await Group.find({});
    
    // Filter groups that contain the user ID in their members
    const filteredGroups = allGroups.filter(group => {
      try {
        const members = JSON.parse(group.members);
        return members.includes(userId);
      } catch {
        return false;
      }
    });
    
    // Return an array of plain serializable objects
    return filteredGroups.map(group => ({
      id: group._id.toString(),
      name: group.name,
      description: group.description || '',
      members: group.members,
      petId: group.petId ? group.petId.toString() : '',
      geminiRoastLevel: group.geminiRoastLevel || 5,
      createdBy: group.createdBy || ''
    }));
  } catch (error) {
    console.error('Error getting groups by member:', error);
    throw error;
  }
}