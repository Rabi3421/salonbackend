import { Schema, model, models, type InferSchemaType } from "mongoose";

const SalonBillPaymentSchema = new Schema(
  {
    salonId: { type: String, required: true, trim: true },
    paymentNo: { type: String, required: true, trim: true },
    billId: { type: String, required: true, trim: true },
    billNo: { type: String, default: "", trim: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, default: "", trim: true },
    amount: { type: Number, required: true, min: 0 },
    mode: {
      type: String,
      enum: ["cash", "upi", "card", "bank_transfer", "wallet", "other"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed",
    },
    paidAt: { type: Date, default: () => new Date() },
    referenceNo: { type: String, default: "", trim: true },
    collectedBy: { type: String, default: "", trim: true },
    collectedByName: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    refundedAt: { type: Date },
    refundReason: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

SalonBillPaymentSchema.index({ salonId: 1, paymentNo: 1 });
SalonBillPaymentSchema.index({ salonId: 1, billId: 1 });
SalonBillPaymentSchema.index({ salonId: 1, mode: 1 });
SalonBillPaymentSchema.index({ salonId: 1, status: 1 });
SalonBillPaymentSchema.index({ salonId: 1, paidAt: -1 });

export type SalonBillPaymentDocument = InferSchemaType<
  typeof SalonBillPaymentSchema
>;

export const SalonBillPayment =
  models.SalonBillPayment ||
  model("SalonBillPayment", SalonBillPaymentSchema);
