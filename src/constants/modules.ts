export const PLAN_MODULES = [
  "website",
  "appointments",
  "customers",
  "staff",
  "services",
  "packages",
  "pos",
  "inventory",
  "expenses",
  "marketing",
  "reports",
  "multi_branch",
] as const;

export type PlanModule = (typeof PLAN_MODULES)[number];

export const MODULE_META: Record<PlanModule, { label: string; description: string }> = {
  website: { label: "Salon Website", description: "Public-facing salon website with services and booking" },
  appointments: { label: "Appointment Booking", description: "Online and walk-in appointment scheduling" },
  customers: { label: "Customer CRM", description: "Customer profiles, history and loyalty tracking" },
  staff: { label: "Staff Management", description: "Staff profiles, schedules and commission tracking" },
  services: { label: "Services & Categories", description: "Service catalog with pricing and duration" },
  packages: { label: "Packages & Memberships", description: "Service bundles and recurring memberships" },
  pos: { label: "POS & Billing", description: "Point of sale, invoicing and payment collection" },
  inventory: { label: "Product Inventory", description: "Stock management for retail products" },
  expenses: { label: "Expense Tracking", description: "Business expense recording and categorization" },
  marketing: { label: "WhatsApp/SMS Marketing", description: "Automated campaigns and promotional messages" },
  reports: { label: "Reports & Analytics", description: "Business performance dashboards and exports" },
  multi_branch: { label: "Multi-Branch Support", description: "Manage multiple salon locations from one account" },
};

export const AUDIT_ACTIONS = {
  SALON_CREATED: "SALON_CREATED",
  SALON_UPDATED: "SALON_UPDATED",
  SALON_CANCELLED: "SALON_CANCELLED",
  SALON_STATUS_UPDATED: "SALON_STATUS_UPDATED",
  SALON_USER_CREATED: "SALON_USER_CREATED",
  SALON_USER_PASSWORD_RESET: "SALON_USER_PASSWORD_RESET",
  PLAN_CREATED: "PLAN_CREATED",
  PLAN_UPDATED: "PLAN_UPDATED",
  PLAN_DEACTIVATED: "PLAN_DEACTIVATED",
  DEFAULT_PLANS_SEEDED: "DEFAULT_PLANS_SEEDED",
  SUBSCRIPTION_ASSIGNED: "SUBSCRIPTION_ASSIGNED",
  SUBSCRIPTION_UPDATED: "SUBSCRIPTION_UPDATED",
  SUBSCRIPTION_RENEWED: "SUBSCRIPTION_RENEWED",
  SUBSCRIPTION_CANCELLED: "SUBSCRIPTION_CANCELLED",
  SUBSCRIPTION_PLAN_CHANGED: "SUBSCRIPTION_PLAN_CHANGED",
  SUBSCRIPTION_EXPIRED_CHECK: "SUBSCRIPTION_EXPIRED_CHECK",
  PAYMENT_CREATED: "PAYMENT_CREATED",
  PAYMENT_UPDATED: "PAYMENT_UPDATED",
  PAYMENT_MARKED_PAID: "PAYMENT_MARKED_PAID",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  PAYMENT_REFUNDED: "PAYMENT_REFUNDED",
  PAYMENT_CANCELLED: "PAYMENT_CANCELLED",
  ENQUIRY_CREATED: "ENQUIRY_CREATED",
  ENQUIRY_UPDATED: "ENQUIRY_UPDATED",
  ENQUIRY_STATUS_UPDATED: "ENQUIRY_STATUS_UPDATED",
  ENQUIRY_NOTE_ADDED: "ENQUIRY_NOTE_ADDED",
  ENQUIRY_CLOSED: "ENQUIRY_CLOSED",
  ENQUIRY_MARKED_SPAM: "ENQUIRY_MARKED_SPAM",
  PLATFORM_SETTINGS_UPDATED: "PLATFORM_SETTINGS_UPDATED",
  PLATFORM_SETTINGS_DEFAULTS_ENSURED: "PLATFORM_SETTINGS_DEFAULTS_ENSURED",
} as const;

export const ACTOR_TYPES = ["superadmin", "salon_user", "system"] as const;

export type ActorType = (typeof ACTOR_TYPES)[number];
