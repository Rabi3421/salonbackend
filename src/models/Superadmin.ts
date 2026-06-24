import { Schema, model, models, type InferSchemaType } from "mongoose";

const SuperadminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, default: "superadmin", enum: ["superadmin"] },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

SuperadminSchema.index({ email: 1 }, { unique: true });

export type SuperadminDocument = InferSchemaType<typeof SuperadminSchema>;

export const Superadmin =
  models.Superadmin || model("Superadmin", SuperadminSchema);
