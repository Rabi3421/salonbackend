import { Schema, model, models, type InferSchemaType } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    subscriptionId: { type: String, required: true, unique: true, trim: true },
    salonId: { type: String, required: true, trim: true, index: true },
    planCode: { type: String, required: true, uppercase: true, trim: true },
    status: {
      type: String,
      enum: ["trial", "active", "expired", "suspended", "cancelled"],
      default: "trial",
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
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

SubscriptionSchema.index({ subscriptionId: 1 }, { unique: true });
SubscriptionSchema.index({ salonId: 1, status: 1 });

export type SubscriptionDocument = InferSchemaType<typeof SubscriptionSchema>;

export const Subscription =
  models.Subscription || model("Subscription", SubscriptionSchema);
