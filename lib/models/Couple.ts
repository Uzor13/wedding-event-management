import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICouple extends Document {
  name: string;
  email?: string;
  username: string;
  password: string;
  eventTitle: string;
  createdAt: Date;
  updatedAt: Date;
}

const coupleSchema = new Schema<ICouple>({
  name: { type: String, required: true },
  email: { type: String },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  eventTitle: { type: String, default: 'Wedding Invitation' }
}, { timestamps: true });

const Couple: Model<ICouple> = mongoose.models.Couple || mongoose.model<ICouple>('Couple', coupleSchema);

export default Couple;
