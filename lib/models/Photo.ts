import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPhoto extends Document {
  couple: mongoose.Types.ObjectId;
  title?: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category: 'pre-wedding' | 'ceremony' | 'reception' | 'other';
  uploadedBy: 'admin' | 'guest';
  uploaderName?: string;
  featured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const photoSchema = new Schema<IPhoto>({
  couple: { type: Schema.Types.ObjectId, ref: 'Couple', required: true },
  title: String,
  description: String,
  imageUrl: { type: String, required: true },
  thumbnailUrl: String,
  category: {
    type: String,
    enum: ['pre-wedding', 'ceremony', 'reception', 'other'],
    default: 'other'
  },
  uploadedBy: { type: String, enum: ['admin', 'guest'], default: 'admin' },
  uploaderName: String,
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
}, { timestamps: true });

photoSchema.index({ couple: 1, category: 1 });
photoSchema.index({ couple: 1, createdAt: -1 });
photoSchema.index({ couple: 1, order: 1 });

// Delete the model from cache if it exists to ensure clean registration
if (mongoose.models.Photo) {
  delete mongoose.models.Photo;
}

const Photo: Model<IPhoto> = mongoose.model<IPhoto>('Photo', photoSchema);

export default Photo;
