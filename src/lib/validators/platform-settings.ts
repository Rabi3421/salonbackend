import { PLAN_MODULES, type PlanModule } from "@/src/constants/modules";
import { type PlatformSettingsKey } from "@/src/constants/platform-settings";

type ValidationResult =
  | { valid: true; data: Partial<Record<PlatformSettingsKey, unknown>> }
  | { valid: false; error: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const URL_REGEX = /^https?:\/\/.+/;

function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-+]/g, "").replace(/^91/, "");
}

export function validatePlatformSettings(
  body: Record<string, unknown>,
): ValidationResult {
  const data: Partial<Record<PlatformSettingsKey, unknown>> = {};

  if (body.appName !== undefined) {
    if (typeof body.appName !== "string" || !body.appName.trim()) {
      return { valid: false, error: "appName must be a non-empty string." };
    }
    data.appName = body.appName.trim();
  }

  if (body.supportEmail !== undefined) {
    const email = String(body.supportEmail).trim();
    if (email && !EMAIL_REGEX.test(email)) {
      return { valid: false, error: "Invalid supportEmail format." };
    }
    data.supportEmail = email;
  }

  if (body.supportPhone !== undefined) {
    const phone = cleanPhone(String(body.supportPhone).trim());
    if (phone && !PHONE_REGEX.test(phone)) {
      return { valid: false, error: "Invalid supportPhone. Must be a 10-digit Indian mobile number." };
    }
    data.supportPhone = phone;
  }

  if (body.supportWhatsApp !== undefined) {
    const phone = cleanPhone(String(body.supportWhatsApp).trim());
    if (phone && !PHONE_REGEX.test(phone)) {
      return { valid: false, error: "Invalid supportWhatsApp. Must be a 10-digit Indian mobile number." };
    }
    data.supportWhatsApp = phone;
  }

  if (body.defaultTrialDays !== undefined) {
    const v = Number(body.defaultTrialDays);
    if (isNaN(v) || v < 0) return { valid: false, error: "defaultTrialDays must be 0 or positive." };
    data.defaultTrialDays = v;
  }

  if (body.currency !== undefined) {
    data.currency = String(body.currency).trim().toUpperCase() || "INR";
  }

  if (body.gstEnabled !== undefined) {
    data.gstEnabled = Boolean(body.gstEnabled);
  }

  if (body.gstNumber !== undefined) {
    data.gstNumber = String(body.gstNumber).trim();
  }

  if (body.invoicePrefix !== undefined) {
    data.invoicePrefix = String(body.invoicePrefix).trim().toUpperCase().slice(0, 20);
  }

  if (body.termsUrl !== undefined) {
    const url = String(body.termsUrl).trim();
    if (url && !URL_REGEX.test(url)) {
      return { valid: false, error: "termsUrl must be a valid URL starting with http(s)://." };
    }
    data.termsUrl = url;
  }

  if (body.privacyUrl !== undefined) {
    const url = String(body.privacyUrl).trim();
    if (url && !URL_REGEX.test(url)) {
      return { valid: false, error: "privacyUrl must be a valid URL starting with http(s)://." };
    }
    data.privacyUrl = url;
  }

  if (body.maintenanceMode !== undefined) {
    data.maintenanceMode = Boolean(body.maintenanceMode);
  }

  if (body.defaultModules !== undefined) {
    if (!Array.isArray(body.defaultModules)) {
      return { valid: false, error: "defaultModules must be an array." };
    }
    const invalid = (body.defaultModules as string[]).filter(
      (m) => !PLAN_MODULES.includes(m as PlanModule),
    );
    if (invalid.length > 0) {
      return { valid: false, error: `Invalid modules: ${invalid.join(", ")}` };
    }
    data.defaultModules = body.defaultModules;
  }

  if (body.publicLeadEnabled !== undefined) {
    data.publicLeadEnabled = Boolean(body.publicLeadEnabled);
  }

  if (body.salonSignupEnabled !== undefined) {
    data.salonSignupEnabled = Boolean(body.salonSignupEnabled);
  }

  return { valid: true, data };
}
