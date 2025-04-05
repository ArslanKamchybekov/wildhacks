'use server';

import { connectToDatabase } from '@/lib/db';
import Pet, { IPet, PetMood } from '@/models/pet.model';

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
    
    // Determine mood based on health
    let mood: PetMood = 'neutral';
    if (validHealth > 80) {
      mood = 'happy';
    } else if (validHealth > 60) {
      mood = 'excited';
    } else if (validHealth < 20) {
      mood = 'sad';
    } else if (validHealth < 50) {
      mood = 'angry';
    }
    
    return await Pet.findByIdAndUpdate(
      petId,
      { health: validHealth, mood },
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
    
    // Determine mood based on health
    let mood: PetMood = 'neutral';
    if (newHealth < 20) {
      mood = 'sad';
    } else if (newHealth < 50) {
      mood = 'angry';
    } else if (newHealth < 80) {
      mood = 'sleepy';
    }
    
    return await Pet.findByIdAndUpdate(
      petId,
      { health: newHealth, mood },
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
    
    // Determine mood based on health
    let mood: PetMood = 'neutral';
    if (newHealth > 80) {
      mood = 'happy';
    } else if (newHealth > 60) {
      mood = 'excited';
    }
    
    return await Pet.findByIdAndUpdate(
      petId,
      { health: newHealth, mood },
      { new: true }
    );
  } catch (error) {
    console.error('Error increasing pet health:', error);
    throw error;
  }
}

/**
 * Update pet mood directly
 */
export async function updatePetMood(petId: string, mood: PetMood): Promise<IPet | null> {
  try {
    await connectToDatabase();
    
    return await Pet.findByIdAndUpdate(
      petId,
      { mood },
      { new: true }
    );
  } catch (error) {
    console.error('Error updating pet mood:', error);
    throw error;
  }
}

/**
 * Get pet data for display (including image URL)
 */
export async function getPetDisplayData(groupId: string): Promise<{
  petId: string;
  health: number;
  mood: PetMood;
  imageUrl: string;
} | null> {
  try {
    await connectToDatabase();
    
    const pet = await Pet.findOne({ groupId });
    if (!pet) return null;
    
    // Import the mood images mapping
    const { PET_MOOD_IMAGES } = await import('@/models/pet.model');
    
    // Ensure pet.mood is a valid key for PET_MOOD_IMAGES
    const mood = pet.mood as PetMood;
    
    return {
      petId: pet._id.toString(),
      health: pet.health,
      mood: mood,
      imageUrl: PET_MOOD_IMAGES[mood]
    };
  } catch (error) {
    console.error('Error getting pet display data:', error);
    return null;
  }
}
