import mongoose, { Schema, Document } from 'mongoose';

// Define the Group interface
export interface IGroup extends Document {
  name: string;
  description: string;
  members: string; // JSON array of user emails as described in the schema
  petId: mongoose.Types.ObjectId;
  geminiRoastLevel: number;
  createdBy: string; // email of the group creator
  createdAt: Date;
  updatedAt: Date;
}

// Define the Group schema
const GroupSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true, 
    maxlength: 100 
  },
  description: {
    type: String,
    default: ''
  },
  members: { 
    type: String, 
    required: true 
  },
  petId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Pet'
  },
  geminiRoastLevel: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  createdBy: {
    type: String,
    required: true
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

// Create and export the Group model
export default mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);
