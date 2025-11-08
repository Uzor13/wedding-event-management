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
  // Plus-One/Companion fields
  plusOneAllowed: boolean;
  plusOneName?: string;
  plusOnePhone?: string;
  plusOneRsvp?: boolean;
  // Meal preferences
  mealPreference?: string;
  plusOneMealPreference?: string;
  dietaryRestrictions?: string;
  plusOneDietaryRestrictions?: string;
  // Additional fields
  tableNumber?: number;
  seatNumber?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const guestSchema = new Schema<IGuest>({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  rsvpStatus: { type: Boolean, default: false },
  uniqueId: { type: String },
  code: { type: String },
  qrCode: String,
  isUsed: { type: Boolean, default: false },
  couple: { type: Schema.Types.ObjectId, ref: 'Couple', required: true },
  tags: [{
    type: Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  // Plus-One/Companion fields
  plusOneAllowed: { type: Boolean, default: false },
  plusOneName: String,
  plusOnePhone: String,
  plusOneRsvp: { type: Boolean, default: false },
  // Meal preferences
  mealPreference: String,
  plusOneMealPreference: String,
  dietaryRestrictions: String,
  plusOneDietaryRestrictions: String,
  // Additional fields
  tableNumber: Number,
  seatNumber: Number,
  notes: String
}, { timestamps: true });

// Indexes for performance optimization
guestSchema.index({ phoneNumber: 1, couple: 1 }, { unique: true });
guestSchema.index({ couple: 1 }); // For fetching all guests for a couple
guestSchema.index({ uniqueId: 1 }); // For RSVP lookups
guestSchema.index({ code: 1 }); // For verification lookups
guestSchema.index({ rsvpStatus: 1, couple: 1 }); // For filtering by RSVP status
guestSchema.index({ isUsed: 1, couple: 1 }); // For filtering verified guests
guestSchema.index({ name: 1, couple: 1 }); // For search and sorting by name
guestSchema.index({ tags: 1 }); // For tag-based queries

const Guest: Model<IGuest> = (mongoose.models.Guest as Model<IGuest>) || mongoose.model<IGuest>('Guest', guestSchema);

export default Guest;
