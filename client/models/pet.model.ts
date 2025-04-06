import mongoose, { Schema, Document } from 'mongoose';

// Define the Pet interface
export interface IPet extends Document {
  groupId: mongoose.Types.ObjectId;
  health: number;
  createdAt: Date;
  updatedAt: Date;
}

// Pet GIF paths
export const PET_GIFS = {
  IDLE: '/pet/duckidle.gif',     // For normal state
  HAPPY: '/pet/duckhappy.gif',   // For happy/good health
  DAMAGE: '/pet/duckdamage.gif', // For medium damage
  CRITICAL: '/pet/duckcritical.gif', // For critical health
  DEATH: '/pet/duckdeath.gif',   // For death/no health
  THUMBS_UP: '/pet/duckthumb.gif', // For thumbs up gesture
  WAVE: '/pet/duckwave.gif'      // For wave gesture
};

// Function to get appropriate group pet GIF based on health
// Group pet only uses health, not other CV data
export const getPetGifByHealth = (health: number): string => {
  if (health <= 0) return PET_GIFS.DEATH;    // Duck death for health <= 0
  if (health < 30) return PET_GIFS.CRITICAL;  // Duck critical for health 0-30
  if (health < 80) return PET_GIFS.IDLE;      // Duck idle for health 30-80
  return PET_GIFS.HAPPY;                     // Duck happy for health > 80
};

// Define the Pet schema
const PetSchema: Schema = new Schema({
  groupId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Group', 
    required: true 
  },
  health: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100,
    default: 100
  },
  // Mood field removed as we'll use GIFs for different pet states
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true, // This will automatically update the createdAt and updatedAt fields
});

// Create and export the Pet model
export default mongoose.models.Pet || mongoose.model<IPet>('Pet', PetSchema);
