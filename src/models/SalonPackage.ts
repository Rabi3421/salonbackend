import { Schema, model, models, type InferSchemaType } from "mongoose";

const SalonPackageSchema = new Schema(
  {
    salonId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, default: "", lowercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    tag: { type: String, default: "", trim: true },
    bestFor: { type: String, default: "", trim: true },
    includedServiceIds: { type: [String], default: [] },
    includedServices: { type: [String], default: [] },
    validityDays: { type: Number, default: 0, min: 0 },
    isHighlighted: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

SalonPackageSchema.index({ salonId: 1, name: 1 });
SalonPackageSchema.index({ salonId: 1, status: 1 });
SalonPackageSchema.index({ salonId: 1, slug: 1 }, { unique: true, sparse: true });

export type SalonPackageDocument = InferSchemaType<typeof SalonPackageSchema>;

export const SalonPackage =
  models.SalonPackage || model("SalonPackage", SalonPackageSchema);
