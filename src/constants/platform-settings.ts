export const PLATFORM_SETTINGS_KEYS = [
  "appName",
  "supportEmail",
  "supportPhone",
  "supportWhatsApp",
  "defaultTrialDays",
  "currency",
  "gstEnabled",
  "gstNumber",
  "invoicePrefix",
  "termsUrl",
  "privacyUrl",
  "maintenanceMode",
  "defaultModules",
  "publicLeadEnabled",
  "salonSignupEnabled",
] as const;

export type PlatformSettingsKey = (typeof PLATFORM_SETTINGS_KEYS)[number];

export const DEFAULT_PLATFORM_SETTINGS: Record<PlatformSettingsKey, unknown> = {
  appName: "Salon Management",
  supportEmail: "",
  supportPhone: "",
  supportWhatsApp: "",
  defaultTrialDays: 14,
  currency: "INR",
  gstEnabled: false,
  gstNumber: "",
  invoicePrefix: "SALON",
  termsUrl: "",
  privacyUrl: "",
  maintenanceMode: false,
  defaultModules: ["website", "appointments", "customers", "staff", "services"],
  publicLeadEnabled: true,
  salonSignupEnabled: false,
};
