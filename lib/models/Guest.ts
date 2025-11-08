import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGuest extends Document {
  name: string;
  phoneNumber: string;
  rsvpStatus: boolean;
  uniqueId: string;
  code: string;
  qrCode?: string;
  isUsed: boolean;
  couple: mongoose.Types.ObjectId;
  tags: mongoose.Types.ObjectId[];
}

const guestSchema = new Schema<IGuest>({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  rsvpStatus: { type: Boolean, default: false },
  uniqueId: { type: String, unique: true },
  code: { type: String, unique: true },
  qrCode: String,
  isUsed: { type: Boolean, default: false },
  couple: { type: Schema.Types.ObjectId, ref: 'Couple', required: true },
  tags: [{
    type: Schema.Types.ObjectId,
    ref: 'Tag'
  }]
});

guestSchema.index({ phoneNumber: 1, couple: 1 }, { unique: true });

const Guest: Model<IGuest> = mongoose.models.Guest || mongoose.model<IGuest>('Guest', guestSchema);

export default Guest;
