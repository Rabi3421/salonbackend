export const ENQUIRY_TYPES = [
  "contact",
  "demo_request",
  "appointment_request",
  "support",
  "platform_lead",
] as const;

export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

export const ENQUIRY_STATUSES = [
  "new",
  "in_progress",
  "resolved",
  "closed",
  "spam",
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const ENQUIRY_PRIORITIES = [
  "low",
  "medium",
  "high",
  "urgent",
] as const;

export type EnquiryPriority = (typeof ENQUIRY_PRIORITIES)[number];
