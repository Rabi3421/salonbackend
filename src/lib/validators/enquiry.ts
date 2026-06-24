import {
  ENQUIRY_TYPES,
  ENQUIRY_STATUSES,
  ENQUIRY_PRIORITIES,
  type EnquiryType,
  type EnquiryStatus,
  type EnquiryPriority,
} from "@/src/constants/enquiry";

type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-+]/g, "").replace(/^91/, "");
}

export type CreateEnquiryInput = {
  salonId?: string;
  type: EnquiryType;
  name: string;
  phone: string;
  email: string;
  message: string;
  priority: EnquiryPriority;
  source: string;
  notes: string;
};

export type UpdateEnquiryInput = {
  type?: EnquiryType;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  priority?: EnquiryPriority;
  source?: string;
  notes?: string;
  assignedTo?: string;
};

export function validateCreateEnquiry(
  body: Record<string, unknown>,
): ValidationResult<CreateEnquiryInput> {
  if (!body.type || !ENQUIRY_TYPES.includes(body.type as EnquiryType)) {
    return { valid: false, error: `type is required. Allowed: ${ENQUIRY_TYPES.join(", ")}` };
  }

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return { valid: false, error: "name is required." };
  }

  const phone = body.phone ? cleanPhone(String(body.phone).trim()) : "";
  const email = body.email ? String(body.email).toLowerCase().trim() : "";

  if (!phone && !email) {
    return { valid: false, error: "At least one of phone or email is required." };
  }

  if (phone && !INDIAN_PHONE_REGEX.test(phone)) {
    return { valid: false, error: "Invalid phone number. Must be a 10-digit Indian mobile number." };
  }

  if (email && !EMAIL_REGEX.test(email)) {
    return { valid: false, error: "Invalid email format." };
  }

  const message = body.message ? String(body.message).trim() : "";
  if (!message) {
    return { valid: false, error: "message is required." };
  }
  if (message.length > 5000) {
    return { valid: false, error: "message is too long (max 5000 characters)." };
  }

  let priority: EnquiryPriority = "medium";
  if (body.priority) {
    if (!ENQUIRY_PRIORITIES.includes(body.priority as EnquiryPriority)) {
      return { valid: false, error: `Invalid priority. Allowed: ${ENQUIRY_PRIORITIES.join(", ")}` };
    }
    priority = body.priority as EnquiryPriority;
  }

  return {
    valid: true,
    data: {
      salonId: body.salonId ? String(body.salonId).trim() : undefined,
      type: body.type as EnquiryType,
      name: (body.name as string).trim(),
      phone,
      email,
      message,
      priority,
      source: body.source ? String(body.source).trim() : "unknown",
      notes: body.notes ? String(body.notes).trim() : "",
    },
  };
}

export function validateUpdateEnquiry(
  body: Record<string, unknown>,
): ValidationResult<UpdateEnquiryInput> {
  const data: UpdateEnquiryInput = {};

  if (body.type !== undefined) {
    if (!ENQUIRY_TYPES.includes(body.type as EnquiryType)) {
      return { valid: false, error: `Invalid type. Allowed: ${ENQUIRY_TYPES.join(", ")}` };
    }
    data.type = body.type as EnquiryType;
  }

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return { valid: false, error: "name cannot be empty." };
    }
    data.name = body.name.trim();
  }

  if (body.phone !== undefined) {
    const phone = cleanPhone(String(body.phone).trim());
    if (phone && !INDIAN_PHONE_REGEX.test(phone)) {
      return { valid: false, error: "Invalid phone number." };
    }
    data.phone = phone;
  }

  if (body.email !== undefined) {
    const email = String(body.email).toLowerCase().trim();
    if (email && !EMAIL_REGEX.test(email)) {
      return { valid: false, error: "Invalid email format." };
    }
    data.email = email;
  }

  if (body.message !== undefined) {
    data.message = String(body.message).trim();
  }

  if (body.priority !== undefined) {
    if (!ENQUIRY_PRIORITIES.includes(body.priority as EnquiryPriority)) {
      return { valid: false, error: `Invalid priority. Allowed: ${ENQUIRY_PRIORITIES.join(", ")}` };
    }
    data.priority = body.priority as EnquiryPriority;
  }

  if (body.source !== undefined) data.source = String(body.source).trim();
  if (body.notes !== undefined) data.notes = String(body.notes).trim();
  if (body.assignedTo !== undefined) data.assignedTo = String(body.assignedTo).trim();

  return { valid: true, data };
}

export function validateStatusUpdate(
  body: Record<string, unknown>,
): ValidationResult<{ status: EnquiryStatus; note?: string }> {
  if (!body.status || !ENQUIRY_STATUSES.includes(body.status as EnquiryStatus)) {
    return { valid: false, error: `status is required. Allowed: ${ENQUIRY_STATUSES.join(", ")}` };
  }

  return {
    valid: true,
    data: {
      status: body.status as EnquiryStatus,
      note: body.note ? String(body.note).trim() : undefined,
    },
  };
}
