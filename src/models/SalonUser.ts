import { Schema, model, models, type InferSchemaType } from "mongoose";

const SalonUserSchema = new Schema(
  {
    salonId: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: [
        "salon_owner",
        "salon_admin",
        "manager",
        "receptionist",
        "stylist",
        "cashier",
      ],
      default: "salon_owner",
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

SalonUserSchema.index({ salonId: 1, email: 1 }, { unique: true });

export type SalonUserDocument = InferSchemaType<typeof SalonUserSchema>;

export const SalonUser =
  models.SalonUser || model("SalonUser", SalonUserSchema);
