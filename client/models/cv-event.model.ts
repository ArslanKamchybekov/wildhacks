import mongoose, { Schema, Document } from 'mongoose';

// Define the CV Event interface
export interface ICVEvent extends Document {
  session_id: string;
  user_id: string;
  event_type: string;
  event_value: string;
  event_timestamp: Date;
}

// Define the CV Event schema
const CVEventSchema: Schema = new Schema({
  session_id: { 
    type: String, 
    required: true 
  },
  user_id: { 
    type: String, 
    required: true 
  },
  event_type: { 
    type: String, 
    required: true 
  },
  event_value: { 
    type: String, 
    required: true 
  },
  event_timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Create and export the CV Event model
export default mongoose.models.CVEvent || mongoose.model<ICVEvent>('CVEvent', CVEventSchema);

// Valid event types and values
export const VALID_EVENT_TYPES = [
  'emotion', 'eye_movement', 'face_movement', 'thumbs_up', 'wave'
];

export const VALID_EVENT_VALUES: Record<string, string[]> = {
  'emotion': ['happy', 'sad', 'angry', 'neutral', 'surprised', 'frustrated'],
  'eye_movement': ['looking_at_screen', 'looking_away', 'rapid_blink', 'normal'],
  'face_movement': ['nodding', 'shaking', 'turning_left', 'turning_right', 'stable'],
  'thumbs_up': ['detected', 'not_detected'],
  'wave': ['detected', 'not_detected']
};
