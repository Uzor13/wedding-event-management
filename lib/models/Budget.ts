import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBudgetItem extends Document {
  couple: mongoose.Types.ObjectId;
  category: string; // e.g., "Venue", "Catering", "Decor", "Photography"
  itemName: string;
  vendor?: string;
  estimatedCost: number;
  actualCost?: number;
  paid: boolean;
  paidDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const budgetItemSchema = new Schema<IBudgetItem>({
  couple: { type: Schema.Types.ObjectId, ref: 'Couple', required: true },
  category: { type: String, required: true },
  itemName: { type: String, required: true },
  vendor: String,
  estimatedCost: { type: Number, required: true, default: 0 },
  actualCost: Number,
  paid: { type: Boolean, default: false },
  paidDate: Date,
  notes: String
}, { timestamps: true });

budgetItemSchema.index({ couple: 1 });
budgetItemSchema.index({ category: 1, couple: 1 });
budgetItemSchema.index({ paid: 1, couple: 1 });

declare global {
  var BudgetItem: Model<IBudgetItem> | undefined;
}

const BudgetItem = global.BudgetItem || mongoose.models.BudgetItem || (global.BudgetItem = mongoose.model<IBudgetItem>('BudgetItem', budgetItemSchema));

export default BudgetItem;
