import { Schema, model, models, type InferSchemaType } from "mongoose";

const SalonServiceSchema = new Schema(
  {
    salonId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, default: "", lowercase: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 5 },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    image: { type: String, default: "", trim: true },
    assignedStaffIds: { type: [String], default: [] },
    assignedStaffNames: { type: [String], default: [] },
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

SalonServiceSchema.index({ salonId: 1, name: 1 });
SalonServiceSchema.index({ salonId: 1, category: 1 });
SalonServiceSchema.index({ salonId: 1, status: 1 });
SalonServiceSchema.index({ salonId: 1, slug: 1 }, { unique: true, sparse: true });

export type SalonServiceDocument = InferSchemaType<typeof SalonServiceSchema>;

export const SalonService =
  models.SalonService || model("SalonService", SalonServiceSchema);
