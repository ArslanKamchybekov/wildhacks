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
  IDLE: '/pet/duckidle.gif',
  HAPPY: '/pet/duckhappy.gif',
  SAD: '/pet/duckdamage.gif',
  DANCING: '/pet/duckthumb.gif',
  SLEEPING: '/pet/duckdeath.gif'
};

// Function to get appropriate pet GIF based on health
export const getPetGifByHealth = (health: number): string => {
  if (health > 80) return PET_GIFS.HAPPY;
  if (health > 50) return PET_GIFS.IDLE;
  if (health > 30) return PET_GIFS.SLEEPING;
  return PET_GIFS.SAD;
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
