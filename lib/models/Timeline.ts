import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITimelineItem extends Document {
  couple: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  time: string; // e.g., "2:00 PM"
  duration?: number; // in minutes
  order: number;
  category: 'pre-ceremony' | 'ceremony' | 'reception' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

const timelineItemSchema = new Schema<ITimelineItem>({
  couple: { type: Schema.Types.ObjectId, ref: 'Couple', required: true },
  title: { type: String, required: true },
  description: String,
  time: { type: String, required: true },
  duration: Number,
  order: { type: Number, required: true },
  category: {
    type: String,
    enum: ['pre-ceremony', 'ceremony', 'reception', 'other'],
    default: 'other'
  }
}, { timestamps: true });

timelineItemSchema.index({ couple: 1, order: 1 });

const TimelineItem: Model<ITimelineItem> = (mongoose.models.TimelineItem as Model<ITimelineItem>) || mongoose.model<ITimelineItem>('TimelineItem', timelineItemSchema);

export default TimelineItem;
