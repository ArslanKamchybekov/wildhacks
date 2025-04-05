import mongoose, { Schema, Document } from 'mongoose';

// Define the User interface
export interface IUser extends Document {
  name: string;
  email: string;
  tickData: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Define the User schema
const UserSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true, 
    maxlength: 100 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    maxlength: 100 
  },
  tickData: { 
    type: [String], 
    default: [] 
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

// Create and export the User model
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
