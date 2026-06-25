type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string };

const SERVICE_STATUSES = ["active", "inactive"] as const;
type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export type CreateServiceInput = {
  name: string;
  category: string;
  description: string;
  price: number;
  duration: number;
  status: ServiceStatus;
  image: string;
  assignedStaffIds: string[];
  assignedStaffNames: string[];
  isFeatured: boolean;
  sortOrder: number;
};

export type UpdateServiceInput = Partial<CreateServiceInput>;

export function validateCreateServicePayload(
  body: Record<string, unknown>,
): ValidationResult<CreateServiceInput> {
  if (!body.name || typeof body.name !== "string" || body.name.trim().length < 2) {
    return { valid: false, error: "name is required (min 2 characters)." };
  }
  if ((body.name as string).trim().length > 100) {
    return { valid: false, error: "name is too long (max 100 characters)." };
  }

  if (!body.category || typeof body.category !== "string" || body.category.trim().length < 2) {
    return { valid: false, error: "category is required (min 2 characters)." };
  }
  if ((body.category as string).trim().length > 60) {
    return { valid: false, error: "category is too long (max 60 characters)." };
  }

  if (!body.description || typeof body.description !== "string" || body.description.trim().length < 5) {
    return { valid: false, error: "description is required (min 5 characters)." };
  }
  if ((body.description as string).trim().length > 1000) {
    return { valid: false, error: "description is too long (max 1000 characters)." };
  }

  const price = Number(body.price);
  if (body.price === undefined || body.price === null || isNaN(price) || price < 0) {
    return { valid: false, error: "price is required and must be >= 0." };
  }

  const duration = Number(body.duration);
  if (body.duration === undefined || body.duration === null || isNaN(duration) || duration < 5 || duration > 720) {
    return { valid: false, error: "duration is required (5–720 minutes)." };
  }

  let status: ServiceStatus = "active";
  if (body.status !== undefined) {
    if (!SERVICE_STATUSES.includes(body.status as ServiceStatus)) {
      return { valid: false, error: `Invalid status. Allowed: ${SERVICE_STATUSES.join(", ")}` };
    }
    status = body.status as ServiceStatus;
  }

  return {
    valid: true,
    data: {
      name: (body.name as string).trim(),
      category: (body.category as string).trim(),
      description: (body.description as string).trim(),
      price,
      duration,
      status,
      image: body.image ? String(body.image).trim() : "",
      assignedStaffIds: Array.isArray(body.assignedStaffIds)
        ? (body.assignedStaffIds as string[]).map(String)
        : [],
      assignedStaffNames: Array.isArray(body.assignedStaffNames)
        ? (body.assignedStaffNames as string[]).map((s) => String(s).trim())
        : [],
      isFeatured: body.isFeatured === true,
      sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
    },
  };
}

export function validateUpdateServicePayload(
  body: Record<string, unknown>,
): ValidationResult<UpdateServiceInput> {
  const data: UpdateServiceInput = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2) {
      return { valid: false, error: "name must be at least 2 characters." };
    }
    if (body.name.trim().length > 100) {
      return { valid: false, error: "name is too long (max 100 characters)." };
    }
    data.name = body.name.trim();
  }

  if (body.category !== undefined) {
    if (typeof body.category !== "string" || body.category.trim().length < 2) {
      return { valid: false, error: "category must be at least 2 characters." };
    }
    data.category = body.category.trim();
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string" || body.description.trim().length < 5) {
      return { valid: false, error: "description must be at least 5 characters." };
    }
    data.description = body.description.trim();
  }

  if (body.price !== undefined) {
    const price = Number(body.price);
    if (isNaN(price) || price < 0) {
      return { valid: false, error: "price must be >= 0." };
    }
    data.price = price;
  }

  if (body.duration !== undefined) {
    const duration = Number(body.duration);
    if (isNaN(duration) || duration < 5 || duration > 720) {
      return { valid: false, error: "duration must be 5–720 minutes." };
    }
    data.duration = duration;
  }

  if (body.status !== undefined) {
    if (!SERVICE_STATUSES.includes(body.status as ServiceStatus)) {
      return { valid: false, error: `Invalid status. Allowed: ${SERVICE_STATUSES.join(", ")}` };
    }
    data.status = body.status as ServiceStatus;
  }

  if (body.image !== undefined) data.image = String(body.image).trim();
  if (body.isFeatured !== undefined) data.isFeatured = body.isFeatured === true;
  if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0;

  if (body.assignedStaffIds !== undefined) {
    data.assignedStaffIds = Array.isArray(body.assignedStaffIds)
      ? (body.assignedStaffIds as string[]).map(String)
      : [];
  }

  if (body.assignedStaffNames !== undefined) {
    data.assignedStaffNames = Array.isArray(body.assignedStaffNames)
      ? (body.assignedStaffNames as string[]).map((s) => String(s).trim())
      : [];
  }

  return { valid: true, data };
}
