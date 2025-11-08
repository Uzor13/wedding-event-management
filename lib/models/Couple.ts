import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICouple extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  name1: string;
  name2: string;
  weddingDate: Date;
  email?: string;
  username: string;
  password: string;
  eventTitle: string;
  createdAt: Date;
  updatedAt: Date;
}

const coupleSchema = new Schema<ICouple>({
  name: { type: String, required: true },
  name1: { type: String },
  name2: { type: String },
  weddingDate: { type: Date },
  email: { type: String },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  eventTitle: { type: String, default: 'Wedding Invitation' }
}, { timestamps: true });

declare global {
  var Couple: Model<ICouple> | undefined;
}

const Couple = global.Couple || (global.Couple = mongoose.model<ICouple>('Couple', coupleSchema));

export default Couple;
