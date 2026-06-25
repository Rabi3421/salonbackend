import { Schema, model, models, type InferSchemaType } from "mongoose";

const BillCustomerSchema = new Schema(
  {
    id: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const BillLineItemSchema = new Schema(
  {
    id: { type: String, default: "" },
    type: {
      type: String,
      enum: ["service", "package", "product", "adjustment"],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    total: { type: Number, required: true },
  },
  { _id: false },
);

const SalonBillSchema = new Schema(
  {
    salonId: { type: String, required: true, trim: true },
    billNo: { type: String, required: true, trim: true },
    source: {
      type: String,
      enum: ["appointment", "walk_in", "manual"],
      default: "manual",
    },
    customer: { type: BillCustomerSchema, required: true },
    items: { type: [BillLineItemSchema], required: true },
    appointmentId: { type: String, default: "", trim: true },
    subtotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    taxTotal: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, default: 0, min: 0 },
    paymentMode: {
      type: String,
      enum: ["cash", "upi", "card", "bank_transfer", "wallet", "other", ""],
      default: "",
    },
    status: {
      type: String,
      enum: [
        "draft",
        "unpaid",
        "partially_paid",
        "paid",
        "cancelled",
        "refunded",
      ],
      default: "unpaid",
    },
    notes: { type: String, default: "", trim: true },
    createdBy: { type: String, default: "", trim: true },
    updatedBy: { type: String, default: "", trim: true },
    cancelledAt: { type: Date },
    cancelledBy: { type: String, default: "", trim: true },
    cancelReason: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

SalonBillSchema.index({ salonId: 1, billNo: 1 });
SalonBillSchema.index({ salonId: 1, status: 1 });
SalonBillSchema.index({ salonId: 1, source: 1 });
SalonBillSchema.index({ salonId: 1, "customer.phone": 1 });
SalonBillSchema.index({ salonId: 1, appointmentId: 1 });
SalonBillSchema.index({ salonId: 1, createdAt: -1 });

export type SalonBillDocument = InferSchemaType<typeof SalonBillSchema>;

export const SalonBill =
  models.SalonBill || model("SalonBill", SalonBillSchema);
