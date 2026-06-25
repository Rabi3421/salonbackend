type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string };

const CUSTOMER_STATUSES = ["active", "inactive", "blocked"] as const;
type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

const CUSTOMER_SOURCES = ["dashboard", "website", "phone", "whatsapp", "walk_in", "referral"] as const;
type CustomerSource = (typeof CUSTOMER_SOURCES)[number];

const CUSTOMER_GENDERS = ["female", "male", "other", "not_specified"] as const;
type CustomerGender = (typeof CUSTOMER_GENDERS)[number];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CreateCustomerInput = {
  name: string;
  phone: string;
  email: string;
  gender: CustomerGender;
  dateOfBirth: string | undefined;
  anniversaryDate: string | undefined;
  address: string;
  city: string;
  status: CustomerStatus;
  source: CustomerSource;
  favoriteServices: string[];
  preferredStylistId: string;
  preferredStylistName: string;
  notes: string;
  allergies: string;
  hairSkinNotes: string;
};

export type UpdateCustomerInput = Partial<Omit<CreateCustomerInput, "source">>;

export function validateCreateCustomerPayload(
  body: Record<string, unknown>,
): ValidationResult<CreateCustomerInput> {
  if (!body.name || typeof body.name !== "string" || body.name.trim().length < 2) {
    return { valid: false, error: "name is required (min 2 characters)." };
  }
  if ((body.name as string).trim().length > 100) {
    return { valid: false, error: "name is too long (max 100 characters)." };
  }

  if (!body.phone || typeof body.phone !== "string" || body.phone.trim().length < 7) {
    return { valid: false, error: "phone is required (min 7 characters)." };
  }
  if ((body.phone as string).trim().length > 20) {
    return { valid: false, error: "phone is too long (max 20 characters)." };
  }

  if (body.email) {
    const email = String(body.email).toLowerCase().trim();
    if (email && !EMAIL_REGEX.test(email)) {
      return { valid: false, error: "Invalid email format." };
    }
  }

  let gender: CustomerGender = "not_specified";
  if (body.gender !== undefined) {
    if (!CUSTOMER_GENDERS.includes(body.gender as CustomerGender)) {
      return { valid: false, error: `Invalid gender. Allowed: ${CUSTOMER_GENDERS.join(", ")}` };
    }
    gender = body.gender as CustomerGender;
  }

  let status: CustomerStatus = "active";
  if (body.status !== undefined) {
    if (!CUSTOMER_STATUSES.includes(body.status as CustomerStatus)) {
      return { valid: false, error: `Invalid status. Allowed: ${CUSTOMER_STATUSES.join(", ")}` };
    }
    status = body.status as CustomerStatus;
  }

  let source: CustomerSource = "dashboard";
  if (body.source !== undefined) {
    if (!CUSTOMER_SOURCES.includes(body.source as CustomerSource)) {
      return { valid: false, error: `Invalid source. Allowed: ${CUSTOMER_SOURCES.join(", ")}` };
    }
    source = body.source as CustomerSource;
  }

  if (body.dateOfBirth && isNaN(Date.parse(String(body.dateOfBirth)))) {
    return { valid: false, error: "Invalid dateOfBirth format." };
  }
  if (body.anniversaryDate && isNaN(Date.parse(String(body.anniversaryDate)))) {
    return { valid: false, error: "Invalid anniversaryDate format." };
  }

  if (body.address && String(body.address).trim().length > 500) {
    return { valid: false, error: "address is too long (max 500 characters)." };
  }
  if (body.city && String(body.city).trim().length > 100) {
    return { valid: false, error: "city is too long (max 100 characters)." };
  }
  if (body.notes && String(body.notes).trim().length > 1000) {
    return { valid: false, error: "notes is too long (max 1000 characters)." };
  }
  if (body.allergies && String(body.allergies).trim().length > 1000) {
    return { valid: false, error: "allergies is too long (max 1000 characters)." };
  }
  if (body.hairSkinNotes && String(body.hairSkinNotes).trim().length > 1000) {
    return { valid: false, error: "hairSkinNotes is too long (max 1000 characters)." };
  }

  return {
    valid: true,
    data: {
      name: (body.name as string).trim(),
      phone: (body.phone as string).trim(),
      email: body.email ? String(body.email).toLowerCase().trim() : "",
      gender,
      dateOfBirth: body.dateOfBirth ? String(body.dateOfBirth) : undefined,
      anniversaryDate: body.anniversaryDate ? String(body.anniversaryDate) : undefined,
      address: body.address ? String(body.address).trim() : "",
      city: body.city ? String(body.city).trim() : "",
      status,
      source,
      favoriteServices: Array.isArray(body.favoriteServices)
        ? (body.favoriteServices as string[]).map((s) => String(s).trim())
        : [],
      preferredStylistId: body.preferredStylistId ? String(body.preferredStylistId).trim() : "",
      preferredStylistName: body.preferredStylistName ? String(body.preferredStylistName).trim() : "",
      notes: body.notes ? String(body.notes).trim() : "",
      allergies: body.allergies ? String(body.allergies).trim() : "",
      hairSkinNotes: body.hairSkinNotes ? String(body.hairSkinNotes).trim() : "",
    },
  };
}

export function validateUpdateCustomerPayload(
  body: Record<string, unknown>,
): ValidationResult<UpdateCustomerInput> {
  const data: UpdateCustomerInput = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2) {
      return { valid: false, error: "name must be at least 2 characters." };
    }
    if (body.name.trim().length > 100) {
      return { valid: false, error: "name is too long (max 100 characters)." };
    }
    data.name = body.name.trim();
  }

  if (body.phone !== undefined) {
    if (typeof body.phone !== "string" || body.phone.trim().length < 7) {
      return { valid: false, error: "phone must be at least 7 characters." };
    }
    if (body.phone.trim().length > 20) {
      return { valid: false, error: "phone is too long (max 20 characters)." };
    }
    data.phone = body.phone.trim();
  }

  if (body.email !== undefined) {
    const email = String(body.email).toLowerCase().trim();
    if (email && !EMAIL_REGEX.test(email)) {
      return { valid: false, error: "Invalid email format." };
    }
    data.email = email;
  }

  if (body.gender !== undefined) {
    if (!CUSTOMER_GENDERS.includes(body.gender as CustomerGender)) {
      return { valid: false, error: `Invalid gender. Allowed: ${CUSTOMER_GENDERS.join(", ")}` };
    }
    data.gender = body.gender as CustomerGender;
  }

  if (body.status !== undefined) {
    if (!CUSTOMER_STATUSES.includes(body.status as CustomerStatus)) {
      return { valid: false, error: `Invalid status. Allowed: ${CUSTOMER_STATUSES.join(", ")}` };
    }
    data.status = body.status as CustomerStatus;
  }

  if (body.dateOfBirth !== undefined) {
    if (body.dateOfBirth && isNaN(Date.parse(String(body.dateOfBirth)))) {
      return { valid: false, error: "Invalid dateOfBirth format." };
    }
    data.dateOfBirth = body.dateOfBirth ? String(body.dateOfBirth) : undefined;
  }

  if (body.anniversaryDate !== undefined) {
    if (body.anniversaryDate && isNaN(Date.parse(String(body.anniversaryDate)))) {
      return { valid: false, error: "Invalid anniversaryDate format." };
    }
    data.anniversaryDate = body.anniversaryDate ? String(body.anniversaryDate) : undefined;
  }

  if (body.address !== undefined) data.address = String(body.address).trim();
  if (body.city !== undefined) data.city = String(body.city).trim();
  if (body.notes !== undefined) data.notes = String(body.notes).trim();
  if (body.allergies !== undefined) data.allergies = String(body.allergies).trim();
  if (body.hairSkinNotes !== undefined) data.hairSkinNotes = String(body.hairSkinNotes).trim();
  if (body.preferredStylistId !== undefined) data.preferredStylistId = String(body.preferredStylistId).trim();
  if (body.preferredStylistName !== undefined) data.preferredStylistName = String(body.preferredStylistName).trim();

  if (body.favoriteServices !== undefined) {
    data.favoriteServices = Array.isArray(body.favoriteServices)
      ? (body.favoriteServices as string[]).map((s) => String(s).trim())
      : [];
  }

  return { valid: true, data };
}
