type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string };

const APPOINTMENT_STATUSES = [
  "requested",
  "confirmed",
  "checked_in",
  "in_service",
  "completed",
  "cancelled",
  "no_show",
] as const;
type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

const APPOINTMENT_SOURCES = [
  "dashboard",
  "website",
  "phone",
  "whatsapp",
  "walk_in",
] as const;
type AppointmentSource = (typeof APPOINTMENT_SOURCES)[number];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_REGEX = /^\d{1,2}:\d{2}$/;

type ServiceInput = {
  id?: string;
  name: string;
  price: number;
  duration: number;
  category?: string;
};

export type CreateAppointmentInput = {
  existingCustomerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceIds?: string[];
  services?: ServiceInput[];
  stylistId?: string;
  date: string;
  startTime: string;
  endTime?: string;
  source: AppointmentSource;
  notes: string;
  internalNotes: string;
};

export type UpdateAppointmentInput = {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceIds?: string[];
  services?: ServiceInput[];
  stylistId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  internalNotes?: string;
};

export type StatusInput = {
  status: AppointmentStatus;
  note: string;
};

export function validateCreateAppointmentPayload(
  body: Record<string, unknown>,
): ValidationResult<CreateAppointmentInput> {
  const hasCustomerId =
    body.existingCustomerId &&
    typeof body.existingCustomerId === "string" &&
    body.existingCustomerId.trim().length > 0;

  if (!hasCustomerId) {
    if (
      !body.customerName ||
      typeof body.customerName !== "string" ||
      body.customerName.trim().length < 2
    ) {
      return {
        valid: false,
        error: "customerName is required (min 2 characters).",
      };
    }
    if (
      !body.customerPhone ||
      typeof body.customerPhone !== "string" ||
      body.customerPhone.trim().length < 7
    ) {
      return {
        valid: false,
        error: "customerPhone is required (min 7 characters).",
      };
    }
  }

  if (body.customerEmail) {
    const email = String(body.customerEmail).toLowerCase().trim();
    if (email && !EMAIL_REGEX.test(email)) {
      return { valid: false, error: "Invalid customerEmail format." };
    }
  }

  const hasServiceIds =
    Array.isArray(body.serviceIds) && body.serviceIds.length > 0;
  const hasServices =
    Array.isArray(body.services) && body.services.length > 0;

  if (!hasServiceIds && !hasServices) {
    return {
      valid: false,
      error: "At least one service is required (serviceIds or services).",
    };
  }

  if (!body.date || isNaN(Date.parse(String(body.date)))) {
    return { valid: false, error: "date is required and must be valid." };
  }

  if (
    !body.startTime ||
    typeof body.startTime !== "string" ||
    !TIME_REGEX.test(body.startTime.trim())
  ) {
    return {
      valid: false,
      error: "startTime is required (format HH:mm).",
    };
  }

  if (body.endTime) {
    if (
      typeof body.endTime !== "string" ||
      !TIME_REGEX.test(body.endTime.trim())
    ) {
      return { valid: false, error: "endTime must be format HH:mm." };
    }
  }

  let source: AppointmentSource = "dashboard";
  if (body.source !== undefined) {
    if (!APPOINTMENT_SOURCES.includes(body.source as AppointmentSource)) {
      return {
        valid: false,
        error: `Invalid source. Allowed: ${APPOINTMENT_SOURCES.join(", ")}`,
      };
    }
    source = body.source as AppointmentSource;
  }

  if (body.notes && String(body.notes).trim().length > 1000) {
    return { valid: false, error: "notes is too long (max 1000 characters)." };
  }
  if (body.internalNotes && String(body.internalNotes).trim().length > 1000) {
    return {
      valid: false,
      error: "internalNotes is too long (max 1000 characters).",
    };
  }

  return {
    valid: true,
    data: {
      existingCustomerId: hasCustomerId
        ? String(body.existingCustomerId).trim()
        : undefined,
      customerName: body.customerName
        ? String(body.customerName).trim()
        : undefined,
      customerPhone: body.customerPhone
        ? String(body.customerPhone).trim()
        : undefined,
      customerEmail: body.customerEmail
        ? String(body.customerEmail).toLowerCase().trim()
        : undefined,
      serviceIds: hasServiceIds
        ? (body.serviceIds as string[]).map(String)
        : undefined,
      services: hasServices
        ? (body.services as Record<string, unknown>[]).map((s) => ({
            id: s.id ? String(s.id) : undefined,
            name: String(s.name ?? "").trim(),
            price: Number(s.price ?? 0),
            duration: Number(s.duration ?? 0),
            category: s.category ? String(s.category).trim() : undefined,
          }))
        : undefined,
      stylistId: body.stylistId
        ? String(body.stylistId).trim()
        : undefined,
      date: String(body.date),
      startTime: String(body.startTime).trim(),
      endTime: body.endTime ? String(body.endTime).trim() : undefined,
      source,
      notes: body.notes ? String(body.notes).trim() : "",
      internalNotes: body.internalNotes
        ? String(body.internalNotes).trim()
        : "",
    },
  };
}

export function validateUpdateAppointmentPayload(
  body: Record<string, unknown>,
): ValidationResult<UpdateAppointmentInput> {
  const data: UpdateAppointmentInput = {};

  if (body.customerName !== undefined) {
    if (
      typeof body.customerName !== "string" ||
      body.customerName.trim().length < 2
    ) {
      return {
        valid: false,
        error: "customerName must be at least 2 characters.",
      };
    }
    data.customerName = body.customerName.trim();
  }

  if (body.customerPhone !== undefined) {
    if (
      typeof body.customerPhone !== "string" ||
      body.customerPhone.trim().length < 7
    ) {
      return {
        valid: false,
        error: "customerPhone must be at least 7 characters.",
      };
    }
    data.customerPhone = body.customerPhone.trim();
  }

  if (body.customerEmail !== undefined) {
    const email = String(body.customerEmail).toLowerCase().trim();
    if (email && !EMAIL_REGEX.test(email)) {
      return { valid: false, error: "Invalid customerEmail format." };
    }
    data.customerEmail = email;
  }

  if (body.serviceIds !== undefined) {
    data.serviceIds = Array.isArray(body.serviceIds)
      ? (body.serviceIds as string[]).map(String)
      : [];
  }

  if (body.services !== undefined) {
    data.services = Array.isArray(body.services)
      ? (body.services as Record<string, unknown>[]).map((s) => ({
          id: s.id ? String(s.id) : undefined,
          name: String(s.name ?? "").trim(),
          price: Number(s.price ?? 0),
          duration: Number(s.duration ?? 0),
          category: s.category ? String(s.category).trim() : undefined,
        }))
      : [];
  }

  if (body.stylistId !== undefined)
    data.stylistId = String(body.stylistId).trim();

  if (body.date !== undefined) {
    if (isNaN(Date.parse(String(body.date)))) {
      return { valid: false, error: "Invalid date format." };
    }
    data.date = String(body.date);
  }

  if (body.startTime !== undefined) {
    if (!TIME_REGEX.test(String(body.startTime).trim())) {
      return { valid: false, error: "startTime must be HH:mm." };
    }
    data.startTime = String(body.startTime).trim();
  }

  if (body.endTime !== undefined)
    data.endTime = String(body.endTime).trim();
  if (body.notes !== undefined) data.notes = String(body.notes).trim();
  if (body.internalNotes !== undefined)
    data.internalNotes = String(body.internalNotes).trim();

  return { valid: true, data };
}

export function validateStatusPayload(
  body: Record<string, unknown>,
): ValidationResult<StatusInput> {
  if (
    !body.status ||
    !APPOINTMENT_STATUSES.includes(body.status as AppointmentStatus)
  ) {
    return {
      valid: false,
      error: `status is required. Allowed: ${APPOINTMENT_STATUSES.join(", ")}`,
    };
  }

  return {
    valid: true,
    data: {
      status: body.status as AppointmentStatus,
      note: body.note ? String(body.note).trim().slice(0, 500) : "",
    },
  };
}
