import { Schema, model, models, type InferSchemaType } from "mongoose";

const AuditLogSchema = new Schema(
  {
    actorType: {
      type: String,
      enum: ["superadmin", "salon_user", "system"],
      required: true,
      index: true,
    },
    actorId: { type: String, default: "", trim: true },
    actorEmail: { type: String, default: "", lowercase: true, trim: true },
    action: { type: String, required: true, trim: true, index: true },
    entityType: { type: String, required: true, trim: true, index: true },
    entityId: { type: String, default: "", trim: true, index: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ip: { type: String, default: "", trim: true },
    userAgent: { type: String, default: "", trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AuditLogSchema.index({ createdAt: -1 });

export type AuditLogDocument = InferSchemaType<typeof AuditLogSchema>;

export const AuditLog =
  models.AuditLog || model("AuditLog", AuditLogSchema);
