import { Schema, model, models, type InferSchemaType } from "mongoose";

const ImageSchema = new Schema(
  {
    key: { type: String, required: true },
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    title: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false },
);

const ButtonSchema = new Schema(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
    type: {
      type: String,
      enum: ["primary", "secondary", "whatsapp", "phone", "link"],
      default: "primary",
    },
    enabled: { type: Boolean, default: true },
  },
  { _id: false },
);

const SectionSchema = new Schema(
  {
    sectionKey: { type: String, required: true },
    sectionType: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    content: { type: Schema.Types.Mixed, default: {} },
    images: { type: [ImageSchema], default: [] },
    buttons: { type: [ButtonSchema], default: [] },
    items: { type: [Schema.Types.Mixed], default: [] },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const SeoSchema = new Schema(
  {
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    keywords: { type: [String], default: [] },
    ogImageUrl: { type: String, default: "" },
  },
  { _id: false },
);

const PageSchema = new Schema(
  {
    pageKey: {
      type: String,
      required: true,
      enum: ["home", "services", "about", "gallery", "contact", "booking"],
    },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    seo: { type: SeoSchema, default: () => ({}) },
    sections: { type: [SectionSchema], default: [] },
  },
  { _id: false },
);

const ThemeSchema = new Schema(
  {
    primaryColor: { type: String, default: "#0f766e" },
    secondaryColor: { type: String, default: "#f59e0b" },
    accentColor: { type: String, default: "#ec4899" },
    backgroundColor: { type: String, default: "#fffaf7" },
    textColor: { type: String, default: "#111827" },
    fontFamily: { type: String, default: "" },
  },
  { _id: false },
);

const GlobalSchema = new Schema(
  {
    salonName: { type: String, default: "" },
    tagline: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    faviconUrl: { type: String, default: "" },
    phone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    instagramUrl: { type: String, default: "" },
    facebookUrl: { type: String, default: "" },
    googleMapUrl: { type: String, default: "" },
    openingHours: { type: String, default: "" },
  },
  { _id: false },
);

const SalonWebsiteContentSchema = new Schema(
  {
    salonId: { type: String, required: true, trim: true, unique: true },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
    version: { type: Number, default: 1 },
    theme: { type: ThemeSchema, default: () => ({}) },
    global: { type: GlobalSchema, default: () => ({}) },
    pages: { type: [PageSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, default: null },
    updatedBy: { type: Schema.Types.ObjectId, default: null },
    publishedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

SalonWebsiteContentSchema.index({ salonId: 1 }, { unique: true });
SalonWebsiteContentSchema.index({ status: 1 });
SalonWebsiteContentSchema.index({ "pages.pageKey": 1 });
SalonWebsiteContentSchema.index({ isDeleted: 1 });

export type SalonWebsiteContentDocument = InferSchemaType<
  typeof SalonWebsiteContentSchema
>;

export const SalonWebsiteContent =
  models.SalonWebsiteContent ||
  model("SalonWebsiteContent", SalonWebsiteContentSchema);
