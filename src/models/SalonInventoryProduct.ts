import { Schema, model, models, type InferSchemaType } from "mongoose";

const SalonInventoryProductSchema = new Schema(
  {
    salonId: { type: String, required: true, trim: true },
    productNo: { type: String, default: "", trim: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, default: "", trim: true },
    brand: { type: String, default: "", trim: true },
    category: {
      type: String,
      enum: ["hair_care", "skin_care", "makeup", "nails", "tools", "consumables", "retail", "other"],
      required: true,
    },
    description: { type: String, default: "", trim: true },
    unit: { type: String, default: "pcs", trim: true },
    currentStock: { type: Number, default: 0, min: 0 },
    minStockLevel: { type: Number, default: 0, min: 0 },
    purchasePrice: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, default: 0, min: 0 },
    stockState: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock"],
      default: "in_stock",
    },
    inventoryValue: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["active", "inactive", "discontinued"],
      default: "active",
    },
    supplierName: { type: String, default: "", trim: true },
    supplierPhone: { type: String, default: "", trim: true },
    supplierWhatsapp: { type: String, default: "", trim: true },
    expiryDate: { type: Date },
    lastStockedAt: { type: Date },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

SalonInventoryProductSchema.index({ salonId: 1, name: 1 });
SalonInventoryProductSchema.index({ salonId: 1, sku: 1 });
SalonInventoryProductSchema.index({ salonId: 1, category: 1 });
SalonInventoryProductSchema.index({ salonId: 1, status: 1 });
SalonInventoryProductSchema.index({ salonId: 1, stockState: 1 });
SalonInventoryProductSchema.index({ salonId: 1, expiryDate: 1 });
SalonInventoryProductSchema.index({ salonId: 1, createdAt: -1 });

export type SalonInventoryProductDocument = InferSchemaType<
  typeof SalonInventoryProductSchema
>;

export const SalonInventoryProduct =
  models.SalonInventoryProduct ||
  model("SalonInventoryProduct", SalonInventoryProductSchema);
