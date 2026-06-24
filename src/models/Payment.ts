import { Schema, model, models, type InferSchemaType } from "mongoose";

const PaymentSchema = new Schema(
  {
    paymentId: { type: String, required: true, unique: true, trim: true },
    salonId: { type: String, required: true, trim: true, index: true },
    subscriptionId: { type: String, default: "", trim: true },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ["cash", "upi", "bank_transfer", "card", "gateway", "other"],
      default: "other",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    transactionId: { type: String, default: "", trim: true },
    referenceNote: { type: String, default: "", trim: true },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

PaymentSchema.index({ paymentId: 1 }, { unique: true });
PaymentSchema.index({ salonId: 1, status: 1 });
PaymentSchema.index({ paidAt: -1 });

export type PaymentDocument = InferSchemaType<typeof PaymentSchema>;

export const Payment = models.Payment || model("Payment", PaymentSchema);
