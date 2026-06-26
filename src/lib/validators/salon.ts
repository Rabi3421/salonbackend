import {
  BUSINESS_TYPES,
  WEBSITE_STATUSES,
  type BusinessType,
  type WebsiteStatus,
} from "@/src/constants/salon";
import type { CreateSalonInput, UpdateSalonInput } from "@/src/types/superadmin";

type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const PINCODE_REGEX = /^\d{6}$/;

function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-+]/g, "").replace(/^91/, "");
}

export function validateCreateSalon(
  body: Record<string, unknown>,
): ValidationResult<CreateSalonInput> {
  const errors: string[] = [];

  const required = [
    "name",
    "ownerName",
    "ownerEmail",
    "ownerPhone",
    "businessType",
    "city",
    "state",
  ] as const;

  for (const field of required) {
    if (!body[field] || typeof body[field] !== "string" || !(body[field] as string).trim()) {
      errors.push(`${field} is required.`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join(" ") };
  }

  const email = (body.ownerEmail as string).toLowerCase().trim();

  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: "Invalid email format." };
  }

  const phone = cleanPhone((body.ownerPhone as string).trim());

  if (!INDIAN_PHONE_REGEX.test(phone)) {
    return {
      valid: false,
      error: "Invalid phone number. Must be a 10-digit Indian mobile number.",
    };
  }

  const businessType = (body.businessType as string).trim().toLowerCase();

  if (!BUSINESS_TYPES.includes(businessType as BusinessType)) {
    return {
      valid: false,
      error: `Invalid businessType. Allowed: ${BUSINESS_TYPES.join(", ")}`,
    };
  }

  if (body.pincode) {
    const pincode = String(body.pincode).trim();

    if (pincode && !PINCODE_REGEX.test(pincode)) {
      return { valid: false, error: "Pincode must be 6 digits." };
    }
  }

  if (body.trialDays !== undefined && body.trialDays !== null) {
    const trialDays = Number(body.trialDays);

    if (isNaN(trialDays) || trialDays < 0) {
      return { valid: false, error: "trialDays must be a positive number." };
    }
  }

  const data: CreateSalonInput = {
    name: (body.name as string).trim(),
    ownerName: (body.ownerName as string).trim(),
    ownerEmail: email,
    ownerPhone: phone,
    businessType: businessType as BusinessType,
    city: (body.city as string).trim(),
    state: (body.state as string).trim(),
    address: body.address ? (body.address as string).trim() : undefined,
    pincode: body.pincode ? String(body.pincode).trim() : undefined,
    gstNumber: body.gstNumber ? (body.gstNumber as string).trim() : undefined,
    logoUrl: body.logoUrl ? (body.logoUrl as string).trim() : undefined,
    trialDays:
      body.trialDays !== undefined && body.trialDays !== null
        ? Number(body.trialDays)
        : undefined,
    planCode: body.planCode ? (body.planCode as string).trim() : undefined,
    ownerPassword: body.ownerPassword
      ? (body.ownerPassword as string)
      : undefined,
  };

  return { valid: true, data };
}

export function validateUpdateSalon(
  body: Record<string, unknown>,
): ValidationResult<UpdateSalonInput> {
  const data: UpdateSalonInput = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return { valid: false, error: "name cannot be empty." };
    }

    data.name = body.name.trim();
  }

  if (body.ownerName !== undefined) {
    if (typeof body.ownerName !== "string" || !body.ownerName.trim()) {
      return { valid: false, error: "ownerName cannot be empty." };
    }

    data.ownerName = body.ownerName.trim();
  }

  if (body.ownerEmail !== undefined) {
    const email = (body.ownerEmail as string).toLowerCase().trim();

    if (!EMAIL_REGEX.test(email)) {
      return { valid: false, error: "Invalid email format." };
    }

    data.ownerEmail = email;
  }

  if (body.ownerPhone !== undefined) {
    const phone = cleanPhone((body.ownerPhone as string).trim());

    if (!INDIAN_PHONE_REGEX.test(phone)) {
      return {
        valid: false,
        error: "Invalid phone number. Must be a 10-digit Indian mobile number.",
      };
    }

    data.ownerPhone = phone;
  }

  if (body.businessType !== undefined) {
    const bt = (body.businessType as string).trim().toLowerCase();

    if (!BUSINESS_TYPES.includes(bt as BusinessType)) {
      return {
        valid: false,
        error: `Invalid businessType. Allowed: ${BUSINESS_TYPES.join(", ")}`,
      };
    }

    data.businessType = bt as BusinessType;
  }

  if (body.address !== undefined) data.address = String(body.address).trim();
  if (body.city !== undefined) data.city = String(body.city).trim();
  if (body.state !== undefined) data.state = String(body.state).trim();

  if (body.pincode !== undefined) {
    const pincode = String(body.pincode).trim();

    if (pincode && !PINCODE_REGEX.test(pincode)) {
      return { valid: false, error: "Pincode must be 6 digits." };
    }

    data.pincode = pincode;
  }

  if (body.gstNumber !== undefined)
    data.gstNumber = String(body.gstNumber).trim();
  if (body.logoUrl !== undefined) data.logoUrl = String(body.logoUrl).trim();

  if (body.websiteStatus !== undefined) {
    if (
      !WEBSITE_STATUSES.includes(body.websiteStatus as WebsiteStatus)
    ) {
      return {
        valid: false,
        error: `Invalid websiteStatus. Allowed: ${WEBSITE_STATUSES.join(", ")}`,
      };
    }

    data.websiteStatus = body.websiteStatus as WebsiteStatus;
  }

  if (body.currentPlanCode !== undefined) {
    data.currentPlanCode = String(body.currentPlanCode).trim();
  }

  return { valid: true, data };
}
