type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string };

const PACKAGE_STATUSES = ["active", "inactive"] as const;
type PackageStatus = (typeof PACKAGE_STATUSES)[number];

export type CreatePackageInput = {
  name: string;
  description: string;
  price: number;
  status: PackageStatus;
  tag: string;
  bestFor: string;
  includedServiceIds: string[];
  includedServices: string[];
  validityDays: number;
  isHighlighted: boolean;
  sortOrder: number;
};

export type UpdatePackageInput = Partial<CreatePackageInput>;

export function validateCreatePackagePayload(
  body: Record<string, unknown>,
): ValidationResult<CreatePackageInput> {
  if (!body.name || typeof body.name !== "string" || body.name.trim().length < 2) {
    return { valid: false, error: "name is required (min 2 characters)." };
  }
  if ((body.name as string).trim().length > 100) {
    return { valid: false, error: "name is too long (max 100 characters)." };
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

  let status: PackageStatus = "active";
  if (body.status !== undefined) {
    if (!PACKAGE_STATUSES.includes(body.status as PackageStatus)) {
      return { valid: false, error: `Invalid status. Allowed: ${PACKAGE_STATUSES.join(", ")}` };
    }
    status = body.status as PackageStatus;
  }

  if (body.validityDays !== undefined && body.validityDays !== null) {
    const days = Number(body.validityDays);
    if (isNaN(days) || days < 0) {
      return { valid: false, error: "validityDays must be >= 0." };
    }
  }

  return {
    valid: true,
    data: {
      name: (body.name as string).trim(),
      description: (body.description as string).trim(),
      price,
      status,
      tag: body.tag ? String(body.tag).trim() : "",
      bestFor: body.bestFor ? String(body.bestFor).trim() : "",
      includedServiceIds: Array.isArray(body.includedServiceIds)
        ? (body.includedServiceIds as string[]).map(String)
        : [],
      includedServices: Array.isArray(body.includedServices)
        ? (body.includedServices as string[]).map((s) => String(s).trim())
        : [],
      validityDays: body.validityDays ? Number(body.validityDays) : 0,
      isHighlighted: body.isHighlighted === true,
      sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
    },
  };
}

export function validateUpdatePackagePayload(
  body: Record<string, unknown>,
): ValidationResult<UpdatePackageInput> {
  const data: UpdatePackageInput = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2) {
      return { valid: false, error: "name must be at least 2 characters." };
    }
    if (body.name.trim().length > 100) {
      return { valid: false, error: "name is too long (max 100 characters)." };
    }
    data.name = body.name.trim();
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

  if (body.status !== undefined) {
    if (!PACKAGE_STATUSES.includes(body.status as PackageStatus)) {
      return { valid: false, error: `Invalid status. Allowed: ${PACKAGE_STATUSES.join(", ")}` };
    }
    data.status = body.status as PackageStatus;
  }

  if (body.tag !== undefined) data.tag = String(body.tag).trim();
  if (body.bestFor !== undefined) data.bestFor = String(body.bestFor).trim();
  if (body.isHighlighted !== undefined) data.isHighlighted = body.isHighlighted === true;
  if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0;

  if (body.validityDays !== undefined) {
    const days = Number(body.validityDays);
    if (isNaN(days) || days < 0) {
      return { valid: false, error: "validityDays must be >= 0." };
    }
    data.validityDays = days;
  }

  if (body.includedServiceIds !== undefined) {
    data.includedServiceIds = Array.isArray(body.includedServiceIds)
      ? (body.includedServiceIds as string[]).map(String)
      : [];
  }

  if (body.includedServices !== undefined) {
    data.includedServices = Array.isArray(body.includedServices)
      ? (body.includedServices as string[]).map((s) => String(s).trim())
      : [];
  }

  return { valid: true, data };
}
