export const AUDIT_ENTITY_TYPES = [
  "Superadmin",
  "Salon",
  "SalonUser",
  "Plan",
  "Subscription",
  "Payment",
  "Enquiry",
  "PlatformSettings",
] as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

export const AUDIT_CATEGORIES = [
  "auth",
  "salon",
  "plan",
  "subscription",
  "payment",
  "enquiry",
  "settings",
  "system",
] as const;

export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

const ACTION_CATEGORY_MAP: Record<string, AuditCategory> = {
  SALON_CREATED: "salon",
  SALON_UPDATED: "salon",
  SALON_CANCELLED: "salon",
  SALON_STATUS_UPDATED: "salon",
  SALON_USER_CREATED: "salon",
  SALON_USER_PASSWORD_RESET: "salon",
  PLAN_CREATED: "plan",
  PLAN_UPDATED: "plan",
  PLAN_DEACTIVATED: "plan",
  DEFAULT_PLANS_SEEDED: "plan",
  SUBSCRIPTION_ASSIGNED: "subscription",
  SUBSCRIPTION_UPDATED: "subscription",
  SUBSCRIPTION_RENEWED: "subscription",
  SUBSCRIPTION_CANCELLED: "subscription",
  SUBSCRIPTION_PLAN_CHANGED: "subscription",
  SUBSCRIPTION_EXPIRED_CHECK: "subscription",
  PAYMENT_CREATED: "payment",
  PAYMENT_UPDATED: "payment",
  PAYMENT_MARKED_PAID: "payment",
  PAYMENT_FAILED: "payment",
  PAYMENT_REFUNDED: "payment",
  PAYMENT_CANCELLED: "payment",
  ENQUIRY_CREATED: "enquiry",
  ENQUIRY_UPDATED: "enquiry",
  ENQUIRY_STATUS_UPDATED: "enquiry",
  ENQUIRY_NOTE_ADDED: "enquiry",
  ENQUIRY_CLOSED: "enquiry",
  ENQUIRY_MARKED_SPAM: "enquiry",
  PLATFORM_SETTINGS_UPDATED: "settings",
  PLATFORM_SETTINGS_DEFAULTS_ENSURED: "settings",
};

export function getAuditCategory(action: string): AuditCategory {
  return ACTION_CATEGORY_MAP[action] ?? "system";
}

export function getAuditActionLabel(action: string): string {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
