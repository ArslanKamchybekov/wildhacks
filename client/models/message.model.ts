import mongoose, { Schema, Document } from 'mongoose';

// Define the Message interface
export interface IMessage extends Document {
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId | null; // Null indicates system/bot message
  content: string;
  createdAt: Date;
}

// Define the Message schema
const MessageSchema: Schema = new Schema({
  groupId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Group', 
    required: true 
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    default: null // Null indicates system/bot message
  },
  content: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // Only track creation time for messages
});

// Create and export the Message model
export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
