import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITag extends Document {
  name: string;
  color: string;
  couple: mongoose.Types.ObjectId;
  users: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const tagSchema = new Schema<ITag>({
  name: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  couple: {
    type: Schema.Types.ObjectId,
    ref: 'Couple',
    required: true
  },
  users: [{
    type: Schema.Types.ObjectId,
    ref: 'Guest'
  }]
}, { timestamps: true });

tagSchema.index({ name: 1, couple: 1 }, { unique: true });

const Tag: Model<ITag> = mongoose.models.Tag || mongoose.model<ITag>('Tag', tagSchema);

export default Tag;
