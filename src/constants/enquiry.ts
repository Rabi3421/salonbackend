export const ENQUIRY_TYPES = [
  "contact",
  "demo_request",
  "appointment_request",
  "support",
  "platform_lead",
  "package_interest",
  "bridal_enquiry",
] as const;

export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

export const ENQUIRY_STATUSES = [
  "new",
  "in_progress",
  "contacted",
  "follow_up",
  "converted",
  "resolved",
  "closed",
  "lost",
  "spam",
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const ENQUIRY_PRIORITIES = [
  "low",
  "normal",
  "medium",
  "high",
  "urgent",
] as const;

export type EnquiryPriority = (typeof ENQUIRY_PRIORITIES)[number];
