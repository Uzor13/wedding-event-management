import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGiftRegistry extends Document {
  couple: mongoose.Types.ObjectId;
  itemName: string;
  category: string; // e.g., "Kitchen", "Bedroom", "Cash Gift"
  description?: string;
  price?: number;
  quantity: number;
  quantityReceived: number;
  purchaseLink?: string;
  imageUrl?: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  updatedAt: Date;
}

const giftRegistrySchema = new Schema<IGiftRegistry>({
  couple: { type: Schema.Types.ObjectId, ref: 'Couple', required: true },
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  description: String,
  price: Number,
  quantity: { type: Number, default: 1 },
  quantityReceived: { type: Number, default: 0 },
  purchaseLink: String,
  imageUrl: String,
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' }
}, { timestamps: true });

giftRegistrySchema.index({ couple: 1 });
giftRegistrySchema.index({ category: 1, couple: 1 });

declare global {
  var GiftRegistry: Model<IGiftRegistry> | undefined;
}

const GiftRegistry = global.GiftRegistry || mongoose.models.GiftRegistry || (global.GiftRegistry = mongoose.model<IGiftRegistry>('GiftRegistry', giftRegistrySchema));

export default GiftRegistry;
