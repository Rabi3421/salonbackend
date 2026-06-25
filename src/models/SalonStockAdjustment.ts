import { Schema, model, models, type InferSchemaType } from "mongoose";

const SalonStockAdjustmentSchema = new Schema(
  {
    salonId: { type: String, required: true, trim: true },
    adjustmentNo: { type: String, required: true, trim: true },
    productId: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["stock_in", "stock_out", "sale", "usage", "damage", "expired", "correction"],
      required: true,
    },
    quantity: { type: Number, required: true, min: 0 },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: { type: String, default: "", trim: true },
    referenceNo: { type: String, default: "", trim: true },
    adjustedBy: { type: String, default: "", trim: true },
    adjustedByName: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    adjustedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

SalonStockAdjustmentSchema.index({ salonId: 1, productId: 1 });
SalonStockAdjustmentSchema.index({ salonId: 1, type: 1 });
SalonStockAdjustmentSchema.index({ salonId: 1, adjustedAt: -1 });
SalonStockAdjustmentSchema.index({ salonId: 1, adjustmentNo: 1 });

export type SalonStockAdjustmentDocument = InferSchemaType<
  typeof SalonStockAdjustmentSchema
>;

export const SalonStockAdjustment =
  models.SalonStockAdjustment ||
  model("SalonStockAdjustment", SalonStockAdjustmentSchema);
