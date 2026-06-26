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
      enum: [
        "trial",
        "active",
        "unpaid",
        "blocked",
        "cancelled",
        "payment_due",
        "grace_period",
        "access_blocked",
        "expired",
        "suspended",
      ],
      default: "trial",
    },
    accessStatus: {
      type: String,
      enum: [
        "trial",
        "active",
        "unpaid",
        "blocked",
        "cancelled",
        "payment_due",
        "grace_period",
        "access_blocked",
        "expired",
        "suspended",
      ],
      default: "trial",
    },
    trialStartDate: { type: Date },
    trialEndDate: { type: Date },
    currentPlanCode: { type: String, default: "", trim: true },
    planCode: { type: String, default: "", trim: true },
    planName: { type: String, default: "", trim: true },
    subscriptionPlan: { type: String, default: "", trim: true },
    subscriptionStatus: {
      type: String,
      enum: [
        "trial",
        "active",
        "unpaid",
        "blocked",
        "cancelled",
        "payment_due",
        "grace_period",
        "access_blocked",
        "expired",
        "suspended",
        "",
      ],
      default: "trial",
    },
    monthlyPrice: { type: Number, min: 0, default: 0 },
    standardPrice: { type: Number, min: 0, default: 0 },
    minimumPrice: { type: Number, min: 0, default: 0 },
    nextBillingDate: { type: Date },
    nextDueDate: { type: Date },
    graceEndDate: { type: Date },
    finalMonthlyPrice: { type: Number, min: 0, default: 0 },
    lastPaymentDate: { type: Date },
    isActive: { type: Boolean, default: true },
    blockedAt: { type: Date },
    blockedReason: { type: String, default: "", trim: true },
    cancelledAt: { type: Date },
    negotiationNote: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

SalonSchema.index({ salonId: 1 }, { unique: true });
SalonSchema.index({ slug: 1 }, { unique: true, sparse: true });
SalonSchema.index({ accountStatus: 1 });

export type SalonDocument = InferSchemaType<typeof SalonSchema>;

export const Salon = models.Salon || model("Salon", SalonSchema);
