import { Schema, model, models, type InferSchemaType } from "mongoose";

const BusinessHourSchema = new Schema(
  {
    day: { type: String, required: true, trim: true },
    isOpen: { type: Boolean, default: true },
    openTime: { type: String, default: "10:00", trim: true },
    closeTime: { type: String, default: "20:00", trim: true },
    breakStart: { type: String, default: "", trim: true },
    breakEnd: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const BookingRulesSchema = new Schema(
  {
    allowOnlineBooking: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: true },
    advanceBookingDays: { type: Number, default: 30, min: 0, max: 365 },
    minAdvanceHours: { type: Number, default: 2, min: 0, max: 168 },
    slotIntervalMinutes: { type: Number, default: 30, min: 5, max: 240 },
    cancellationWindowHours: { type: Number, default: 4, min: 0, max: 168 },
    allowWalkIns: { type: Boolean, default: true },
  },
  { _id: false },
);

const NotificationsSchema = new Schema(
  {
    appointmentConfirmation: { type: Boolean, default: true },
    appointmentReminder: { type: Boolean, default: true },
    paymentReceipt: { type: Boolean, default: true },
    enquiryAlert: { type: Boolean, default: true },
    lowStockAlert: { type: Boolean, default: false },
    whatsappEnabled: { type: Boolean, default: false },
    smsEnabled: { type: Boolean, default: false },
    emailEnabled: { type: Boolean, default: true },
  },
  { _id: false },
);

const SalonSettingsSchema = new Schema(
  {
    salonId: { type: String, required: true, unique: true, trim: true },
    businessName: { type: String, default: "", trim: true },
    displayName: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    address: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    state: { type: String, default: "", trim: true },
    pincode: { type: String, default: "", trim: true },
    logo: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    businessHours: {
      type: [BusinessHourSchema],
      default: [
        { day: "Monday", isOpen: true, openTime: "10:00", closeTime: "20:00" },
        { day: "Tuesday", isOpen: true, openTime: "10:00", closeTime: "20:00" },
        { day: "Wednesday", isOpen: true, openTime: "10:00", closeTime: "20:00" },
        { day: "Thursday", isOpen: true, openTime: "10:00", closeTime: "20:00" },
        { day: "Friday", isOpen: true, openTime: "10:00", closeTime: "20:00" },
        { day: "Saturday", isOpen: true, openTime: "10:00", closeTime: "20:00" },
        { day: "Sunday", isOpen: false, openTime: "10:00", closeTime: "18:00" },
      ],
    },
    bookingRules: { type: BookingRulesSchema, default: () => ({}) },
    notifications: { type: NotificationsSchema, default: () => ({}) },
    aboutTitle: { type: String, default: "", trim: true },
    aboutParagraphs: { type: [String], default: [] },
    aboutStats: {
      type: [{ value: { type: String }, label: { type: String }, _id: false }],
      default: [],
    },
    whyChooseUs: {
      type: [
        {
          icon: { type: String, default: "" },
          title: { type: String, default: "" },
          description: { type: String, default: "" },
          _id: false,
        },
      ],
      default: [],
    },
    gallery: {
      type: [
        {
          title: { type: String, default: "" },
          category: { type: String, default: "" },
          image: { type: String, default: "" },
          height: { type: String, default: "h-64" },
          _id: false,
        },
      ],
      default: [],
    },
    reviews: {
      type: [
        {
          name: { type: String, default: "" },
          rating: { type: Number, default: 5 },
          service: { type: String, default: "" },
          review: { type: String, default: "" },
          initials: { type: String, default: "" },
          _id: false,
        },
      ],
      default: [],
    },
    faqs: {
      type: [
        {
          question: { type: String, default: "" },
          answer: { type: String, default: "" },
          category: { type: String, default: "General" },
          _id: false,
        },
      ],
      default: [],
    },
    socialLinks: {
      type: [
        {
          label: { type: String, default: "" },
          href: { type: String, default: "#" },
          _id: false,
        },
      ],
      default: [],
    },
    privacyPolicy: { type: Schema.Types.Mixed, default: null },
    termsOfService: { type: Schema.Types.Mixed, default: null },
    cancellationPolicy: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

SalonSettingsSchema.index({ salonId: 1 }, { unique: true });

export type SalonSettingsDocument = InferSchemaType<
  typeof SalonSettingsSchema
>;

export const SalonSettings =
  models.SalonSettings || model("SalonSettings", SalonSettingsSchema);
