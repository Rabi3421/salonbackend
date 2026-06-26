import { Schema, model, models, type InferSchemaType } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    subscriptionId: { type: String, required: true, unique: true, trim: true },
    salonId: { type: String, required: true, trim: true, index: true },
    planCode: { type: String, required: true, uppercase: true, trim: true },
    planName: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: [
        "trial",
        "active",
        "payment_due",
        "grace_period",
        "access_blocked",
        "expired",
        "suspended",
        "cancelled",
      ],
      default: "trial",
    },
    accessStatus: {
      type: String,
      enum: [
        "trial",
        "active",
        "payment_due",
        "grace_period",
        "access_blocked",
        "expired",
        "suspended",
        "cancelled",
      ],
      default: "trial",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly", "trial"],
      default: "trial",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    nextBillingDate: { type: Date },
    amount: { type: Number, required: true, min: 0, default: 0 },
    standardMonthlyPrice: { type: Number, min: 0, default: 0 },
    negotiatedMonthlyPrice: { type: Number, min: 0 },
    finalMonthlyPrice: { type: Number, min: 0, default: 0 },
    minimumMonthlyPrice: { type: Number, min: 0, default: 0 },
    negotiationNote: { type: String, default: "", trim: true },
    priceLockedBySuperadmin: { type: Boolean, default: false },
    billingCollectionDay: { type: Number, default: 5 },
    graceEndDay: { type: Number, default: 10 },
    trialStartDate: { type: Date },
    trialEndDate: { type: Date },
    currentDueDate: { type: Date },
    currentGraceEndDate: { type: Date },
    nextDueDate: { type: Date },
    nextGraceEndDate: { type: Date },
    lastPaidAt: { type: Date },
    lastPaymentId: { type: String, default: "", trim: true },
    cancelledAt: { type: Date },
    suspendedAt: { type: Date },
    suspensionReason: { type: String, default: "", trim: true },
    reactivatedAt: { type: Date },
    reactivationReason: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

SubscriptionSchema.index({ subscriptionId: 1 }, { unique: true });
SubscriptionSchema.index({ salonId: 1, status: 1 });

export type SubscriptionDocument = InferSchemaType<typeof SubscriptionSchema>;

export const Subscription =
  models.Subscription || model("Subscription", SubscriptionSchema);
