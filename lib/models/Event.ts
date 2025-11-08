import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEvent extends Document {
  couple: mongoose.Types.ObjectId;
  eventName: string; // e.g., "Rehearsal Dinner", "Ceremony", "Reception"
  eventType: 'rehearsal' | 'ceremony' | 'reception' | 'after-party' | 'other';
  date: Date;
  time: string;
  venueName: string;
  venueAddress: string;
  description?: string;
  dressCode?: string;
  guestList: mongoose.Types.ObjectId[]; // References to Guest model
  isMainEvent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>({
  couple: { type: Schema.Types.ObjectId, ref: 'Couple', required: true },
  eventName: { type: String, required: true },
  eventType: {
    type: String,
    enum: ['rehearsal', 'ceremony', 'reception', 'after-party', 'other'],
    default: 'other'
  },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  venueName: { type: String, required: true },
  venueAddress: { type: String, required: true },
  description: String,
  dressCode: String,
  guestList: [{
    type: Schema.Types.ObjectId,
    ref: 'Guest'
  }],
  isMainEvent: { type: Boolean, default: false }
}, { timestamps: true });

eventSchema.index({ couple: 1 });
eventSchema.index({ date: 1, couple: 1 });
eventSchema.index({ eventType: 1, couple: 1 });

// Delete the model from cache if it exists to ensure clean registration
if (mongoose.models.Event) {
  delete mongoose.models.Event;
}

const Event: Model<IEvent> = mongoose.model<IEvent>('Event', eventSchema);

export default Event;
