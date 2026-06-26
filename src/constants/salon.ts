export const ACCOUNT_STATUSES = [
  "trial",
  "active",
  "payment_due",
  "grace_period",
  "access_blocked",
  "expired",
  "suspended",
  "cancelled",
] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const WEBSITE_STATUSES = [
  "active",
  "inactive",
  "maintenance",
] as const;

export type WebsiteStatus = (typeof WEBSITE_STATUSES)[number];

export const SUBSCRIPTION_STATUSES = [
  "trial",
  "active",
  "payment_due",
  "grace_period",
  "access_blocked",
  "expired",
  "suspended",
  "cancelled",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const BUSINESS_TYPES = [
  "salon",
  "spa",
  "beauty_parlour",
  "unisex_salon",
  "barber_shop",
  "wellness_center",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const SALON_USER_ROLES = [
  "salon_owner",
  "salon_admin",
  "manager",
  "receptionist",
  "stylist",
  "cashier",
  "staff",
  "beautician",
  "accountant",
  "inventory_manager",
] as const;

export type SalonUserRole = (typeof SALON_USER_ROLES)[number];

export const BILLING_CYCLES = ["monthly", "yearly", "trial"] as const;

export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const PAYMENT_METHODS = [
  "cash",
  "upi",
  "bank_transfer",
  "card",
  "cheque",
  "gateway",
  "other",
] as const;

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;

export const DEFAULT_TRIAL_DAYS = 30;
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;
