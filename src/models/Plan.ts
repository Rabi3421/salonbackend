import { Schema, model, models, type InferSchemaType } from "mongoose";

const PlanModulesSchema = new Schema(
  {
    website: { type: Boolean, default: true },
    appointments: { type: Boolean, default: true },
    customers: { type: Boolean, default: true },
    staff: { type: Boolean, default: true },
    services: { type: Boolean, default: true },
    packages: { type: Boolean, default: false },
    pos: { type: Boolean, default: false },
    inventory: { type: Boolean, default: false },
    expenses: { type: Boolean, default: false },
    marketing: { type: Boolean, default: false },
    reports: { type: Boolean, default: false },
    multi_branch: { type: Boolean, default: false },
  },
  { _id: false },
);

const PlanSchema = new Schema(
  {
    planCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    monthlyPrice: { type: Number, required: true, min: 0, default: 0 },
    yearlyPrice: { type: Number, required: true, min: 0, default: 0 },
    trialDays: { type: Number, required: true, min: 0, default: 14 },
    maxStaff: { type: Number, required: true, min: 0, default: 5 },
    maxBranches: { type: Number, required: true, min: 1, default: 1 },
    maxAppointmentsPerMonth: { type: Number, required: true, min: 0, default: 0 },
    modules: { type: PlanModulesSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

PlanSchema.index({ planCode: 1 }, { unique: true });

export type PlanDocument = InferSchemaType<typeof PlanSchema>;

export const Plan = models.Plan || model("Plan", PlanSchema);
