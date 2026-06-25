import {
  ENQUIRY_STATUSES,
  ENQUIRY_PRIORITIES,
  type EnquiryStatus,
  type EnquiryPriority,
} from "@/src/constants/enquiry";

type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string };

const TIME_REGEX = /^\d{1,2}:\d{2}$/;

export type UpdateEnquiryInput = {
  status?: EnquiryStatus;
  priority?: EnquiryPriority;
  assignedTo?: string;
  nextFollowUpAt?: string;
  note?: string;
};

export type ConvertEnquiryInput = {
  createCustomer: boolean;
  createAppointment: boolean;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  stylistId: string;
  notes: string;
};

export type AddNoteInput = {
  note: string;
  nextFollowUpAt?: string;
  statusAfterNote?: EnquiryStatus;
};

export function validateUpdateEnquiryPayload(
  body: Record<string, unknown>,
): ValidationResult<UpdateEnquiryInput> {
  const data: UpdateEnquiryInput = {};

  if (body.status !== undefined) {
    if (!ENQUIRY_STATUSES.includes(body.status as EnquiryStatus)) {
      return {
        valid: false,
        error: `Invalid status. Allowed: ${ENQUIRY_STATUSES.join(", ")}`,
      };
    }
    data.status = body.status as EnquiryStatus;
  }

  if (body.priority !== undefined) {
    if (!ENQUIRY_PRIORITIES.includes(body.priority as EnquiryPriority)) {
      return {
        valid: false,
        error: `Invalid priority. Allowed: ${ENQUIRY_PRIORITIES.join(", ")}`,
      };
    }
    data.priority = body.priority as EnquiryPriority;
  }

  if (body.assignedTo !== undefined) {
    data.assignedTo = String(body.assignedTo).trim();
  }

  if (body.nextFollowUpAt !== undefined) {
    if (body.nextFollowUpAt && isNaN(Date.parse(String(body.nextFollowUpAt)))) {
      return { valid: false, error: "Invalid nextFollowUpAt date." };
    }
    data.nextFollowUpAt = body.nextFollowUpAt
      ? String(body.nextFollowUpAt)
      : undefined;
  }

  if (body.note !== undefined) {
    data.note = String(body.note).trim().slice(0, 1000);
  }

  return { valid: true, data };
}

export function validateAddNotePayload(
  body: Record<string, unknown>,
): ValidationResult<AddNoteInput> {
  if (
    !body.note ||
    typeof body.note !== "string" ||
    body.note.trim().length < 2
  ) {
    return {
      valid: false,
      error: "note is required (min 2 characters).",
    };
  }
  if (body.note.trim().length > 1000) {
    return {
      valid: false,
      error: "note is too long (max 1000 characters).",
    };
  }

  const data: AddNoteInput = { note: body.note.trim() };

  if (body.nextFollowUpAt) {
    if (isNaN(Date.parse(String(body.nextFollowUpAt)))) {
      return { valid: false, error: "Invalid nextFollowUpAt date." };
    }
    data.nextFollowUpAt = String(body.nextFollowUpAt);
  }

  if (body.statusAfterNote) {
    if (
      !ENQUIRY_STATUSES.includes(body.statusAfterNote as EnquiryStatus)
    ) {
      return { valid: false, error: "Invalid statusAfterNote." };
    }
    data.statusAfterNote = body.statusAfterNote as EnquiryStatus;
  }

  return { valid: true, data };
}

export function validateConvertEnquiryPayload(
  body: Record<string, unknown>,
): ValidationResult<ConvertEnquiryInput> {
  const createCustomer = body.createCustomer === true;
  const createAppointment = body.createAppointment === true;

  if (!createCustomer && !createAppointment) {
    return {
      valid: false,
      error:
        "At least one of createCustomer or createAppointment must be true.",
    };
  }

  if (createAppointment && body.appointmentDate) {
    if (isNaN(Date.parse(String(body.appointmentDate)))) {
      return { valid: false, error: "Invalid appointmentDate." };
    }
  }

  if (createAppointment && body.appointmentTime) {
    if (!TIME_REGEX.test(String(body.appointmentTime).trim())) {
      return {
        valid: false,
        error: "appointmentTime must be HH:mm format.",
      };
    }
  }

  return {
    valid: true,
    data: {
      createCustomer,
      createAppointment,
      serviceName: body.serviceName
        ? String(body.serviceName).trim()
        : "",
      appointmentDate: body.appointmentDate
        ? String(body.appointmentDate)
        : "",
      appointmentTime: body.appointmentTime
        ? String(body.appointmentTime).trim()
        : "",
      stylistId: body.stylistId ? String(body.stylistId).trim() : "",
      notes: body.notes ? String(body.notes).trim().slice(0, 1000) : "",
    },
  };
}
