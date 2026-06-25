type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string };

const CATEGORIES = ["hair_care", "skin_care", "makeup", "nails", "tools", "consumables", "retail", "other"] as const;
const STATUSES = ["active", "inactive", "discontinued"] as const;
const ADJUSTMENT_TYPES = ["stock_in", "stock_out", "sale", "usage", "damage", "expired", "correction"] as const;

export type CreateInventoryProductInput = {
  name: string;
  category: string;
  status: string;
  sku: string;
  brand: string;
  description: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  purchasePrice: number;
  sellingPrice: number;
  supplierName: string;
  supplierPhone: string;
  supplierWhatsapp: string;
  expiryDate: string | undefined;
  notes: string;
};

export type UpdateInventoryProductInput = Partial<CreateInventoryProductInput>;

export type StockAdjustmentInput = {
  productId: string;
  type: string;
  quantity: number;
  reason: string;
  referenceNo: string;
  notes: string;
};

export function validateCreateInventoryProductPayload(
  body: Record<string, unknown>,
): ValidationResult<CreateInventoryProductInput> {
  if (!body.name || typeof body.name !== "string" || body.name.trim().length < 2) {
    return { valid: false, error: "name is required (min 2 characters)." };
  }
  if ((body.name as string).trim().length > 150) {
    return { valid: false, error: "name is too long (max 150 characters)." };
  }

  if (!body.category || !CATEGORIES.includes(body.category as (typeof CATEGORIES)[number])) {
    return { valid: false, error: `category is required. Allowed: ${CATEGORIES.join(", ")}` };
  }

  let status = "active";
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as (typeof STATUSES)[number])) {
      return { valid: false, error: `Invalid status. Allowed: ${STATUSES.join(", ")}` };
    }
    status = String(body.status);
  }

  if (body.sku && String(body.sku).trim().length > 100) {
    return { valid: false, error: "sku is too long (max 100 characters)." };
  }
  if (body.description && String(body.description).trim().length > 1000) {
    return { valid: false, error: "description is too long (max 1000 characters)." };
  }
  if (body.notes && String(body.notes).trim().length > 1000) {
    return { valid: false, error: "notes is too long (max 1000 characters)." };
  }
  if (body.expiryDate && isNaN(Date.parse(String(body.expiryDate)))) {
    return { valid: false, error: "Invalid expiryDate format." };
  }

  return {
    valid: true,
    data: {
      name: (body.name as string).trim(),
      category: String(body.category),
      status,
      sku: body.sku ? String(body.sku).trim() : "",
      brand: body.brand ? String(body.brand).trim().slice(0, 100) : "",
      description: body.description ? String(body.description).trim() : "",
      unit: body.unit ? String(body.unit).trim() : "pcs",
      currentStock: body.currentStock !== undefined ? Math.max(0, Number(body.currentStock)) : 0,
      minStockLevel: body.minStockLevel !== undefined ? Math.max(0, Number(body.minStockLevel)) : 0,
      purchasePrice: body.purchasePrice !== undefined ? Math.max(0, Number(body.purchasePrice)) : 0,
      sellingPrice: body.sellingPrice !== undefined ? Math.max(0, Number(body.sellingPrice)) : 0,
      supplierName: body.supplierName ? String(body.supplierName).trim().slice(0, 150) : "",
      supplierPhone: body.supplierPhone ? String(body.supplierPhone).trim() : "",
      supplierWhatsapp: body.supplierWhatsapp ? String(body.supplierWhatsapp).trim() : "",
      expiryDate: body.expiryDate ? String(body.expiryDate) : undefined,
      notes: body.notes ? String(body.notes).trim() : "",
    },
  };
}

export function validateUpdateInventoryProductPayload(
  body: Record<string, unknown>,
): ValidationResult<UpdateInventoryProductInput> {
  const data: UpdateInventoryProductInput = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2)
      return { valid: false, error: "name must be at least 2 characters." };
    data.name = body.name.trim();
  }
  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category as (typeof CATEGORIES)[number]))
      return { valid: false, error: `Invalid category. Allowed: ${CATEGORIES.join(", ")}` };
    data.category = String(body.category);
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as (typeof STATUSES)[number]))
      return { valid: false, error: `Invalid status. Allowed: ${STATUSES.join(", ")}` };
    data.status = String(body.status);
  }
  if (body.sku !== undefined) data.sku = String(body.sku).trim();
  if (body.brand !== undefined) data.brand = String(body.brand).trim();
  if (body.description !== undefined) data.description = String(body.description).trim();
  if (body.unit !== undefined) data.unit = String(body.unit).trim();
  if (body.minStockLevel !== undefined) data.minStockLevel = Math.max(0, Number(body.minStockLevel));
  if (body.purchasePrice !== undefined) data.purchasePrice = Math.max(0, Number(body.purchasePrice));
  if (body.sellingPrice !== undefined) data.sellingPrice = Math.max(0, Number(body.sellingPrice));
  if (body.supplierName !== undefined) data.supplierName = String(body.supplierName).trim();
  if (body.supplierPhone !== undefined) data.supplierPhone = String(body.supplierPhone).trim();
  if (body.supplierWhatsapp !== undefined) data.supplierWhatsapp = String(body.supplierWhatsapp).trim();
  if (body.notes !== undefined) data.notes = String(body.notes).trim();
  if (body.expiryDate !== undefined) {
    if (body.expiryDate && isNaN(Date.parse(String(body.expiryDate))))
      return { valid: false, error: "Invalid expiryDate format." };
    data.expiryDate = body.expiryDate ? String(body.expiryDate) : undefined;
  }

  return { valid: true, data };
}

export function validateStockAdjustmentPayload(
  body: Record<string, unknown>,
): ValidationResult<StockAdjustmentInput> {
  if (!body.productId || typeof body.productId !== "string" || !body.productId.trim()) {
    return { valid: false, error: "productId is required." };
  }

  if (!body.type || !ADJUSTMENT_TYPES.includes(body.type as (typeof ADJUSTMENT_TYPES)[number])) {
    return { valid: false, error: `type is required. Allowed: ${ADJUSTMENT_TYPES.join(", ")}` };
  }

  const quantity = Number(body.quantity);
  if (!quantity || quantity <= 0) {
    return { valid: false, error: "quantity is required and must be > 0." };
  }

  if (body.reason && String(body.reason).trim().length > 500) {
    return { valid: false, error: "reason is too long (max 500 characters)." };
  }

  return {
    valid: true,
    data: {
      productId: String(body.productId).trim(),
      type: String(body.type),
      quantity,
      reason: body.reason ? String(body.reason).trim() : "",
      referenceNo: body.referenceNo ? String(body.referenceNo).trim().slice(0, 100) : "",
      notes: body.notes ? String(body.notes).trim().slice(0, 500) : "",
    },
  };
}
