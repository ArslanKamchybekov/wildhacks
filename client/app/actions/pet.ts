'use server';

import { connectToDatabase } from '@/lib/db';
import Pet, { IPet, getPetGifByHealth } from '@/models/pet.model';

/**
 * Get a pet by ID
 */
export async function getPetById(petId: string): Promise<IPet | null> {
  try {
    await connectToDatabase();
    return await Pet.findById(petId);
  } catch (error) {
    console.error('Error getting pet by ID:', error);
    throw error;
  }
}

/**
 * Get a pet by group ID
 */
export async function getPetByGroupId(groupId: string): Promise<IPet | null> {
  try {
    await connectToDatabase();
    return await Pet.findOne({ groupId });
  } catch (error) {
    console.error('Error getting pet by group ID:', error);
    throw error;
  }
}

/**
 * Update pet health
 */
export async function updatePetHealth(petId: string, health: number): Promise<IPet | null> {
  try {
    await connectToDatabase();
    
    // Ensure health is within valid range (0-100)
    const validHealth = Math.max(0, Math.min(100, health));
    
    return await Pet.findByIdAndUpdate(
      petId,
      { health: validHealth },
      { new: true }
    );
  } catch (error) {
    console.error('Error updating pet health:', error);
    throw error;
  }
}

/**
 * Decrease pet health by a specific amount
 */
export async function decreasePetHealth(petId: string, amount: number): Promise<IPet | null> {
  try {
    await connectToDatabase();
    
    const pet = await Pet.findById(petId);
    if (!pet) return null;
    
    // Calculate new health and ensure it doesn't go below 0
    const newHealth = Math.max(0, pet.health - amount);
    
    return await Pet.findByIdAndUpdate(
      petId,
      { health: newHealth },
      { new: true }
    );
  } catch (error) {
    console.error('Error decreasing pet health:', error);
    throw error;
  }
}

/**
 * Increase pet health by a specific amount
 */
export async function increasePetHealth(petId: string, amount: number): Promise<IPet | null> {
  try {
    await connectToDatabase();
    
    const pet = await Pet.findById(petId);
    if (!pet) return null;
    
    // Calculate new health and ensure it doesn't go above 100
    const newHealth = Math.min(100, pet.health + amount);
    
    return await Pet.findByIdAndUpdate(
      petId,
      { health: newHealth },
      { new: true }
    );
  } catch (error) {
    console.error('Error increasing pet health:', error);
    throw error;
  }
}

// Removed updatePetMood function as we no longer use mood

/**
 * Get pet data for display (including image URL)
 */
export async function getPetDisplayData(groupId: string): Promise<{
  petId: string;
  health: number;
  imageUrl: string;
} | null> {
  try {
    await connectToDatabase();
    
    const pet = await Pet.findOne({ groupId });
    if (!pet) return null;
    
    // Get the appropriate GIF based on health
    const imageUrl = getPetGifByHealth(pet.health);
    
    return {
      petId: pet._id.toString(),
      health: pet.health,
      imageUrl: imageUrl
    };
  } catch (error) {
    console.error('Error getting pet display data:', error);
    return null;
  }
}
