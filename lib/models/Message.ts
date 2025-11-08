import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  couple: mongoose.Types.ObjectId;
  guestName: string;
  message: string;
  approved: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  couple: { type: Schema.Types.ObjectId, ref: 'Couple', required: true },
  guestName: { type: String, required: true },
  message: { type: String, required: true },
  approved: { type: Boolean, default: false },
  featured: { type: Boolean, default: false }
}, { timestamps: true });

messageSchema.index({ couple: 1, approved: 1 });
messageSchema.index({ couple: 1, createdAt: -1 });

let Message: Model<IMessage>;

try {
  Message = mongoose.model<IMessage>('Message');
} catch {
  Message = mongoose.model<IMessage>('Message', messageSchema);
}

export default Message;
