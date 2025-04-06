import mongoose, { Schema, Document } from 'mongoose';

// Define the Session interface
export interface ISession extends Document {
  userId: string;
  groupId?: string;
  goal: string;
  status: 'active' | 'completed' | 'cancelled';
  deadline: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Session schema
const SessionSchema: Schema = new Schema({
  userId: { 
    type: String, 
    required: true
  },
  groupId: { 
    type: String
  },
  goal: { 
    type: String, 
    required: true
  },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  deadline: {
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
  timestamps: true
});

// Create and export the Session model
export default mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
