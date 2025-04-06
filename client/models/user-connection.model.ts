import mongoose, { Schema, Document } from 'mongoose';

// Define the UserConnection interface
export interface IUserConnection extends Document {
  userId: string;
  email: string;
  connectionLabel: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the UserConnection schema
const UserConnectionSchema: Schema = new Schema({
  userId: { 
    type: String, 
    required: true,
    index: true
  },
  email: { 
    type: String, 
    required: true,
    maxlength: 100
  },
  connectionLabel: { 
    type: String, 
    required: true,
    maxlength: 50
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
  timestamps: true
});

// Create and export the UserConnection model
export default mongoose.models.UserConnection || 
  mongoose.model<IUserConnection>('UserConnection', UserConnectionSchema);
