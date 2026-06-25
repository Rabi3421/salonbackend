import { Schema, model, models, type InferSchemaType } from "mongoose";

const InternalNoteSchema = new Schema(
  {
    note: { type: String, required: true, trim: true },
    addedBy: { type: String, default: "", trim: true },
    addedByEmail: { type: String, default: "", trim: true },
    addedAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const EnquirySchema = new Schema(
  {
    enquiryId: { type: String, required: true, unique: true, trim: true },
    salonId: { type: String, default: "", trim: true, index: true },
    type: {
      type: String,
      enum: ["contact", "demo_request", "appointment_request", "support", "platform_lead"],
      default: "contact",
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    message: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["new", "in_progress", "contacted", "follow_up", "converted", "resolved", "closed", "lost", "spam"],
      default: "new",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "medium", "high", "urgent"],
      default: "medium",
    },
    source: { type: String, default: "unknown", trim: true },
    notes: { type: String, default: "", trim: true },
    internalNotes: { type: [InternalNoteSchema], default: [] },
    assignedTo: { type: String, default: "", trim: true },
    preferredService: { type: String, default: "", trim: true },
    preferredDate: { type: Date },
    preferredTime: { type: String, default: "", trim: true },
    nextFollowUpAt: { type: Date },
    convertedCustomerId: { type: String, default: "", trim: true },
    convertedAppointmentId: { type: String, default: "", trim: true },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true },
);

EnquirySchema.index({ enquiryId: 1 }, { unique: true });
EnquirySchema.index({ status: 1, createdAt: -1 });

export type EnquiryDocument = InferSchemaType<typeof EnquirySchema>;

export const Enquiry = models.Enquiry || model("Enquiry", EnquirySchema);
