import { Schema, model, models, type InferSchemaType } from "mongoose";

const SalonSchema = new Schema(
  {
    salonId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    ownerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    ownerPhone: { type: String, required: true, trim: true },
    businessType: { type: String, default: "salon", trim: true },
    address: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    state: { type: String, default: "", trim: true },
    pincode: { type: String, default: "", trim: true },
    gstNumber: { type: String, default: "", trim: true },
    logoUrl: { type: String, default: "", trim: true },
    websiteStatus: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "inactive",
    },
    accountStatus: {
      type: String,
      enum: ["trial", "active", "expired", "suspended", "cancelled"],
      default: "trial",
    },
    trialStartDate: { type: Date },
    trialEndDate: { type: Date },
    currentPlanCode: { type: String, default: "", trim: true },
    subscriptionStatus: {
      type: String,
      enum: ["trial", "active", "expired", "suspended", "cancelled", ""],
      default: "trial",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

SalonSchema.index({ salonId: 1 }, { unique: true });
SalonSchema.index({ slug: 1 }, { unique: true, sparse: true });
SalonSchema.index({ accountStatus: 1 });

export type SalonDocument = InferSchemaType<typeof SalonSchema>;

export const Salon = models.Salon || model("Salon", SalonSchema);
