'use server';

import { connectToDatabase } from '@/lib/db';
import User from '@/models/user.model';
import { v4 as uuidv4 } from 'uuid';
import Group from '@/models/group.model';

/**
 * Add a tick to a user with context about who added it and which group it's for
 */
export async function addTickToUser(
  targetUserEmail: string, 
  addedByUserEmail: string, 
  groupId: string, 
  tickContent: string
): Promise<{ success: boolean; message: string }> {
  try {
    await connectToDatabase();
    
    // Format the tick with metadata
    const formattedTick = JSON.stringify({
      content: tickContent,
      addedBy: addedByUserEmail,
      groupId: groupId,
      timestamp: new Date().toISOString()
    });
    
    // Find the user and add the tick
    const user = await User.findOne({ email: targetUserEmail });
    
    if (!user) {
      return { 
        success: false, 
        message: `User with email ${targetUserEmail} not found` 
      };
    }
    
    // Add the tick to the user's tickData array
    await User.findByIdAndUpdate(
      user._id,
      { $push: { tickData: formattedTick } },
      { new: true }
    );
    
    return { 
      success: true, 
      message: `Tick added to ${targetUserEmail}` 
    };
  } catch (error) {
    console.error('Error adding tick to user:', error);
    return { 
      success: false, 
      message: `Error adding tick: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Get all ticks for a specific group
 */
export async function getGroupTicks(groupId: string): Promise<{ 
  userEmail: string; 
  ticks: Array<{ 
    id?: string;
    content: string; 
    addedBy: string; 
    timestamp: string; 
    groupId?: string 
  }> 
}[]> {
  try {
    await connectToDatabase();
    
    // Get the group to find its members
    const group = await Group.findById(groupId);
    
    if (!group) {
      console.error(`Group with ID ${groupId} not found`);
      return [];
    }
    
    // Parse the members JSON string to get member emails
    let memberEmails: string[] = [];
    try {
      memberEmails = JSON.parse(group.members);
    } catch (e) {
      console.error('Error parsing group members:', e);
      return [];
    }
    
    // Find all users who are members of this group
    const groupUsers = await User.find({ email: { $in: memberEmails } });
    
    console.log(`Found ${groupUsers.length} users in group ${groupId}`);
    
    // For each user, get their ticks
    const groupTicks = groupUsers.map(user => {
      // Ensure tickData exists and is an array
      const tickData = user.tickData || [];
      
      // Parse all ticks and add an ID if they don't have one
      const parsedTicks = tickData
        .map((tick: string) => {
          try {
            const parsedTick = JSON.parse(tick);
            // Add an ID if it doesn't exist
            if (!parsedTick.id) {
              parsedTick.id = uuidv4();
            }
            return parsedTick;
          } catch (e) {
            // If the tick isn't in JSON format, ignore it
            console.error('Error parsing tick:', e);
            return null;
          }
        })
        .filter((tick: any) => tick !== null);
      
      console.log(`User ${user.email} has ${parsedTicks.length} ticks`);
      
      return {
        userEmail: user.email,
        ticks: parsedTicks
      };
    });
    
    return groupTicks;
  } catch (error) {
    console.error('Error getting group ticks:', error);
    return [];
  }
}

/**
 * Get all ticks for a specific user in a group
 */
export async function getUserTicksInGroup(userEmail: string, groupId: string): Promise<Array<{ 
  content: string; 
  addedBy: string; 
  timestamp: string; 
  groupId: string 
}>> {
  try {
    await connectToDatabase();
    
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      return [];
    }
    
    // Ensure tickData exists and is an array
    const tickData = user.tickData || [];
    
    // Filter ticks to only include those for this group
    const groupTicks = tickData
      .map((tick: string) => {
        try {
          return JSON.parse(tick);
        } catch (e) {
          // If the tick isn't in JSON format, ignore it
          return null;
        }
      })
      .filter((tick: any) => tick && tick.groupId === groupId);
    
    return groupTicks;
  } catch (error) {
    console.error('Error getting user ticks in group:', error);
    throw error;
  }
}

/**
 * Get all ticks for a specific user (regardless of group)
 */
export async function getUserTicks(userEmail: string): Promise<Array<{ 
  id: string;
  content: string; 
  addedBy: string; 
  timestamp: string; 
  groupId?: string;
}>> {
  try {
    await connectToDatabase();
    
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      return [];
    }
    
    // Ensure tickData exists and is an array
    const tickData = user.tickData || [];
    
    // Parse all ticks and add an ID if they don't have one
    const parsedTicks = tickData
      .map((tick: string) => {
        try {
          const parsedTick = JSON.parse(tick);
          // Add an ID if it doesn't exist
          if (!parsedTick.id) {
            parsedTick.id = uuidv4();
          }
          return parsedTick;
        } catch (e) {
          // If the tick isn't in JSON format, ignore it
          return null;
        }
      })
      .filter((tick: any) => tick !== null);
    
    return parsedTicks;
  } catch (error) {
    console.error('Error getting user ticks:', error);
    return [];
  }
}

/**
 * Add a tick to a user
 */
export async function addUserTick(
  userEmail: string,
  tickData: {
    content: string;
    addedBy: string;
    timestamp: string;
  }
): Promise<{ success: boolean; message: string; tickId?: string }> {
  try {
    await connectToDatabase();
    
    // Find the user
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      return { 
        success: false, 
        message: `User with email ${userEmail} not found` 
      };
    }
    
    // Generate a unique ID for the tick
    const tickId = uuidv4();
    
    // Format the tick with metadata
    const formattedTick = JSON.stringify({
      id: tickId,
      content: tickData.content,
      addedBy: tickData.addedBy,
      timestamp: tickData.timestamp
    });
    
    // Add the tick to the user's tickData array
    await User.findByIdAndUpdate(
      user._id,
      { $push: { tickData: formattedTick } },
      { new: true }
    );
    
    return { 
      success: true, 
      message: `Tick added to ${userEmail}`,
      tickId
    };
  } catch (error) {
    console.error('Error adding tick to user:', error);
    return { 
      success: false, 
      message: `Error adding tick: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Remove a tick from a user
 */
export async function removeUserTick(
  userEmail: string,
  tickId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await connectToDatabase();
    
    // Find the user
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      return { 
        success: false, 
        message: `User with email ${userEmail} not found` 
      };
    }
    
    // Get current ticks
    const tickData = user.tickData || [];
    
    // Filter out the tick with the matching ID
    const updatedTicks = tickData.filter((tick: string) => {
      try {
        const parsedTick = JSON.parse(tick);
        return parsedTick.id !== tickId;
      } catch (e) {
        // Keep ticks that can't be parsed
        return true;
      }
    });
    
    // Update the user with the filtered ticks
    await User.findByIdAndUpdate(
      user._id,
      { tickData: updatedTicks },
      { new: true }
    );
    
    return { 
      success: true, 
      message: `Tick removed from ${userEmail}` 
    };
  } catch (error) {
    console.error('Error removing tick from user:', error);
    return { 
      success: false, 
      message: `Error removing tick: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}
