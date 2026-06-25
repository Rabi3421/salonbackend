type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string };

const FRONTEND_ROLES = ["owner", "manager", "receptionist", "stylist", "accountant"] as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CreateSalonUserInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  isActive: boolean;
};

export type UpdateSalonUserInput = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
};

export function validateCreateSalonUserPayload(
  body: Record<string, unknown>,
): ValidationResult<CreateSalonUserInput> {
  if (!body.name || typeof body.name !== "string" || body.name.trim().length < 2) {
    return { valid: false, error: "name is required (min 2 characters)." };
  }
  if ((body.name as string).trim().length > 100) {
    return { valid: false, error: "name is too long (max 100 characters)." };
  }

  if (!body.email || typeof body.email !== "string") {
    return { valid: false, error: "email is required." };
  }
  const email = (body.email as string).toLowerCase().trim();
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: "Invalid email format." };
  }

  if (!body.phone || typeof body.phone !== "string" || body.phone.trim().length < 7) {
    return { valid: false, error: "phone is required (min 7 characters)." };
  }
  if ((body.phone as string).trim().length > 20) {
    return { valid: false, error: "phone is too long (max 20 characters)." };
  }

  if (!body.password || typeof body.password !== "string" || body.password.length < 6) {
    return { valid: false, error: "password is required (min 6 characters)." };
  }

  if (!body.role || !FRONTEND_ROLES.includes(body.role as (typeof FRONTEND_ROLES)[number])) {
    return { valid: false, error: `role is required. Allowed: ${FRONTEND_ROLES.join(", ")}` };
  }

  return {
    valid: true,
    data: {
      name: (body.name as string).trim(),
      email,
      phone: (body.phone as string).trim(),
      password: body.password as string,
      role: body.role as string,
      isActive: body.isActive !== false,
    },
  };
}

export function validateUpdateSalonUserPayload(
  body: Record<string, unknown>,
): ValidationResult<UpdateSalonUserInput> {
  const data: UpdateSalonUserInput = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2) {
      return { valid: false, error: "name must be at least 2 characters." };
    }
    data.name = body.name.trim();
  }

  if (body.email !== undefined) {
    const email = String(body.email).toLowerCase().trim();
    if (!EMAIL_REGEX.test(email)) {
      return { valid: false, error: "Invalid email format." };
    }
    data.email = email;
  }

  if (body.phone !== undefined) {
    if (typeof body.phone !== "string" || body.phone.trim().length < 7) {
      return { valid: false, error: "phone must be at least 7 characters." };
    }
    data.phone = body.phone.trim();
  }

  if (body.password !== undefined) {
    if (typeof body.password !== "string" || body.password.length < 6) {
      return { valid: false, error: "password must be at least 6 characters." };
    }
    data.password = body.password;
  }

  if (body.role !== undefined) {
    if (!FRONTEND_ROLES.includes(body.role as (typeof FRONTEND_ROLES)[number])) {
      return { valid: false, error: `Invalid role. Allowed: ${FRONTEND_ROLES.join(", ")}` };
    }
    data.role = body.role as string;
  }

  if (body.isActive !== undefined) {
    data.isActive = body.isActive === true;
  }

  return { valid: true, data };
}
