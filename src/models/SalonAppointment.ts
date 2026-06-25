import { Schema, model, models, type InferSchemaType } from "mongoose";

const AppointmentCustomerSchema = new Schema(
  {
    id: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const AppointmentServiceSchema = new Schema(
  {
    id: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 0 },
    category: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const AppointmentStylistSchema = new Schema(
  {
    id: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "", trim: true },
    avatar: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const StatusHistorySchema = new Schema(
  {
    status: { type: String, required: true, trim: true },
    note: { type: String, default: "", trim: true },
    changedBy: { type: String, default: "", trim: true },
    changedAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const SalonAppointmentSchema = new Schema(
  {
    salonId: { type: String, required: true, trim: true },
    appointmentNo: { type: String, required: true, trim: true },
    customer: { type: AppointmentCustomerSchema, required: true },
    services: { type: [AppointmentServiceSchema], required: true },
    stylist: { type: AppointmentStylistSchema },
    date: { type: Date, required: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: [
        "requested",
        "confirmed",
        "checked_in",
        "in_service",
        "completed",
        "cancelled",
        "no_show",
      ],
      default: "requested",
    },
    source: {
      type: String,
      enum: ["dashboard", "website", "phone", "whatsapp", "walk_in"],
      default: "dashboard",
    },
    totalAmount: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    billId: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    internalNotes: { type: String, default: "", trim: true },
    createdBy: { type: String, default: "", trim: true },
    updatedBy: { type: String, default: "", trim: true },
    statusHistory: { type: [StatusHistorySchema], default: [] },
  },
  { timestamps: true },
);

SalonAppointmentSchema.index({ salonId: 1, date: 1 });
SalonAppointmentSchema.index({ salonId: 1, status: 1 });
SalonAppointmentSchema.index({ salonId: 1, "customer.phone": 1 });
SalonAppointmentSchema.index({ salonId: 1, "stylist.id": 1 });
SalonAppointmentSchema.index({ salonId: 1, createdAt: -1 });
SalonAppointmentSchema.index({ salonId: 1, appointmentNo: 1 });

export type SalonAppointmentDocument = InferSchemaType<
  typeof SalonAppointmentSchema
>;

export const SalonAppointment =
  models.SalonAppointment ||
  model("SalonAppointment", SalonAppointmentSchema);
