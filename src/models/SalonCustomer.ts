import { Schema, model, models, type InferSchemaType } from "mongoose";

const SalonCustomerSchema = new Schema(
  {
    salonId: { type: String, required: true, trim: true },
    customerNo: { type: String, default: "", trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    gender: {
      type: String,
      enum: ["female", "male", "other", "not_specified"],
      default: "not_specified",
    },
    dateOfBirth: { type: Date },
    anniversaryDate: { type: Date },
    address: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    source: {
      type: String,
      enum: ["dashboard", "website", "phone", "whatsapp", "walk_in", "referral"],
      default: "dashboard",
    },
    favoriteServices: { type: [String], default: [] },
    preferredStylistId: { type: String, default: "", trim: true },
    preferredStylistName: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    allergies: { type: String, default: "", trim: true },
    hairSkinNotes: { type: String, default: "", trim: true },
    totalVisits: { type: Number, default: 0, min: 0 },
    totalSpent: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, default: 0, min: 0 },
    lastVisitAt: { type: Date },
    nextAppointmentAt: { type: Date },
  },
  { timestamps: true },
);

SalonCustomerSchema.index({ salonId: 1, phone: 1 });
SalonCustomerSchema.index({ salonId: 1, email: 1 });
SalonCustomerSchema.index({ salonId: 1, name: 1 });
SalonCustomerSchema.index({ salonId: 1, status: 1 });
SalonCustomerSchema.index({ salonId: 1, source: 1 });
SalonCustomerSchema.index({ salonId: 1, createdAt: -1 });

export type SalonCustomerDocument = InferSchemaType<typeof SalonCustomerSchema>;

export const SalonCustomer =
  models.SalonCustomer || model("SalonCustomer", SalonCustomerSchema);
