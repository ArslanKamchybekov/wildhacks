import mongoose, { Schema, Document } from 'mongoose';

// Define the Gemini Roast interface
export interface IGeminiRoast extends Document {
  group_id: string;
  target_user_id: string;
  roast_content: string;
  roast_level: number;
  created_at: Date;
}

// Define the Gemini Roast schema
const GeminiRoastSchema: Schema = new Schema({
  group_id: { 
    type: String, 
    required: true 
  },
  target_user_id: { 
    type: String, 
    required: true 
  },
  roast_content: { 
    type: String, 
    required: true 
  },
  roast_level: { 
    type: Number, 
    default: 5 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Create and export the Gemini Roast model
export default mongoose.models.GeminiRoast || mongoose.model<IGeminiRoast>('GeminiRoast', GeminiRoastSchema);
