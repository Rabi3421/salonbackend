import { Schema, model, models, type InferSchemaType } from "mongoose";

const WorkingDaySchema = new Schema(
  {
    day: { type: String, required: true, trim: true },
    isWorking: { type: Boolean, default: true },
    startTime: { type: String, default: "10:00", trim: true },
    endTime: { type: String, default: "19:00", trim: true },
    breakStart: { type: String, default: "", trim: true },
    breakEnd: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const SalonStaffSchema = new Schema(
  {
    salonId: { type: String, required: true, trim: true },
    staffNo: { type: String, default: "", trim: true },
    userId: { type: String, default: "", trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["owner", "manager", "receptionist", "stylist", "accountant"],
      default: "stylist",
    },
    designation: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive", "on_leave"],
      default: "active",
    },
    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "freelance", "contract"],
      default: "full_time",
    },
    avatar: { type: String, default: "", trim: true },
    experience: { type: String, default: "", trim: true },
    specialties: { type: [String], default: [] },
    assignedServiceIds: { type: [String], default: [] },
    assignedServiceNames: { type: [String], default: [] },
    workingDays: { type: [WorkingDaySchema], default: [] },
    joiningDate: { type: Date },
    address: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    salary: { type: Number, default: 0, min: 0 },
    commissionPercent: { type: Number, default: 0, min: 0, max: 100 },
    emergencyContactName: { type: String, default: "", trim: true },
    emergencyContactPhone: { type: String, default: "", trim: true },
    appointmentsToday: { type: Number, default: 0, min: 0 },
    completedServicesThisMonth: { type: Number, default: 0, min: 0 },
    revenueThisMonth: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
  },
  { timestamps: true },
);

SalonStaffSchema.index({ salonId: 1, phone: 1 });
SalonStaffSchema.index({ salonId: 1, email: 1 });
SalonStaffSchema.index({ salonId: 1, role: 1 });
SalonStaffSchema.index({ salonId: 1, status: 1 });
SalonStaffSchema.index({ salonId: 1, createdAt: -1 });

export type SalonStaffDocument = InferSchemaType<typeof SalonStaffSchema>;

export const SalonStaff =
  models.SalonStaff || model("SalonStaff", SalonStaffSchema);
