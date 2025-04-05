import mongoose, { Schema, Document } from 'mongoose';

// Pet mood types
export type PetMood = 'happy' | 'sad' | 'angry' | 'excited' | 'sleepy' | 'neutral';

// Pet image URLs for different moods
export const PET_MOOD_IMAGES: Record<PetMood, string> = {
  'happy': '/images/pet_happy.png',
  'sad': '/images/pet_sad.png',
  'angry': '/images/pet_angry.png',
  'excited': '/images/pet_excited.png',
  'sleepy': '/images/pet_sleepy.png',
  'neutral': '/images/pet_neutral.png'
};

// Define the Pet interface
export interface IPet extends Document {
  groupId: mongoose.Types.ObjectId;
  health: number;
  mood: PetMood;
  createdAt: Date;
  updatedAt: Date;
}

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
  mood: {
    type: String,
    enum: ['happy', 'sad', 'angry', 'excited', 'sleepy', 'neutral'],
    default: 'neutral'
  },
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
