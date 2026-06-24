import { Schema, model, models, type InferSchemaType } from "mongoose";

const PlatformSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Schema.Types.Mixed },
    updatedBy: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

PlatformSettingsSchema.index({ key: 1 }, { unique: true });

export type PlatformSettingsDocument = InferSchemaType<
  typeof PlatformSettingsSchema
>;

export const PlatformSettings =
  models.PlatformSettings ||
  model("PlatformSettings", PlatformSettingsSchema);
