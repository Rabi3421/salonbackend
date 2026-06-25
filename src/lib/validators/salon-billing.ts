type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string };

const BILL_SOURCES = ["appointment", "walk_in", "manual"] as const;
const ITEM_TYPES = ["service", "package", "product", "adjustment"] as const;
const PAYMENT_MODES = ["cash", "upi", "card", "bank_transfer", "wallet", "other"] as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LineItemInput = {
  id: string;
  type: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
};

export type CreateBillInput = {
  appointmentId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  source: string;
  items: LineItemInput[];
  discountTotal: number;
  taxTotal: number;
  notes: string;
};

export type UpdateBillInput = {
  notes?: string;
  status?: string;
  cancelReason?: string;
};

export type RecordPaymentInput = {
  amount: number;
  mode: string;
  referenceNo: string;
  notes: string;
  billId?: string;
};

export function validateCreateBillPayload(
  body: Record<string, unknown>,
): ValidationResult<CreateBillInput> {
  const hasCustomerId =
    body.customerId &&
    typeof body.customerId === "string" &&
    body.customerId.trim().length > 0;

  if (!hasCustomerId) {
    if (
      !body.customerName ||
      typeof body.customerName !== "string" ||
      body.customerName.trim().length < 2
    ) {
      return { valid: false, error: "customerName is required (min 2 characters)." };
    }
    if (
      !body.customerPhone ||
      typeof body.customerPhone !== "string" ||
      body.customerPhone.trim().length < 7
    ) {
      return { valid: false, error: "customerPhone is required (min 7 characters)." };
    }
  }

  if (body.customerEmail) {
    const email = String(body.customerEmail).toLowerCase().trim();
    if (email && !EMAIL_REGEX.test(email)) {
      return { valid: false, error: "Invalid customerEmail format." };
    }
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { valid: false, error: "At least one line item is required." };
  }

  const items: LineItemInput[] = [];
  for (let i = 0; i < (body.items as unknown[]).length; i++) {
    const raw = (body.items as Record<string, unknown>[])[i];
    if (!raw.type || !ITEM_TYPES.includes(raw.type as (typeof ITEM_TYPES)[number])) {
      return { valid: false, error: `Item ${i + 1}: type is required (${ITEM_TYPES.join(", ")}).` };
    }
    if (!raw.name || typeof raw.name !== "string" || raw.name.trim().length < 2) {
      return { valid: false, error: `Item ${i + 1}: name is required (min 2 characters).` };
    }
    const qty = Number(raw.quantity);
    if (!qty || qty <= 0) {
      return { valid: false, error: `Item ${i + 1}: quantity must be > 0.` };
    }
    const price = Number(raw.unitPrice);
    if (isNaN(price) || price < 0) {
      return { valid: false, error: `Item ${i + 1}: unitPrice must be >= 0.` };
    }
    const disc = raw.discount !== undefined ? Number(raw.discount) : 0;
    if (isNaN(disc) || disc < 0) {
      return { valid: false, error: `Item ${i + 1}: discount must be >= 0.` };
    }
    const tax = raw.taxRate !== undefined ? Number(raw.taxRate) : 0;
    if (isNaN(tax) || tax < 0 || tax > 100) {
      return { valid: false, error: `Item ${i + 1}: taxRate must be 0–100.` };
    }
    items.push({
      id: raw.id ? String(raw.id) : "",
      type: String(raw.type),
      name: String(raw.name).trim(),
      quantity: qty,
      unitPrice: price,
      discount: disc,
      taxRate: tax,
    });
  }

  let source = "manual";
  if (body.source !== undefined) {
    if (!BILL_SOURCES.includes(body.source as (typeof BILL_SOURCES)[number])) {
      return { valid: false, error: `Invalid source. Allowed: ${BILL_SOURCES.join(", ")}` };
    }
    source = String(body.source);
  }

  if (body.notes && String(body.notes).trim().length > 1000) {
    return { valid: false, error: "notes is too long (max 1000 characters)." };
  }

  return {
    valid: true,
    data: {
      appointmentId: body.appointmentId ? String(body.appointmentId).trim() : "",
      customerId: hasCustomerId ? String(body.customerId).trim() : "",
      customerName: body.customerName ? String(body.customerName).trim() : "",
      customerPhone: body.customerPhone ? String(body.customerPhone).trim() : "",
      customerEmail: body.customerEmail ? String(body.customerEmail).toLowerCase().trim() : "",
      source,
      items,
      discountTotal: body.discountTotal ? Math.max(0, Number(body.discountTotal)) : 0,
      taxTotal: body.taxTotal ? Math.max(0, Number(body.taxTotal)) : 0,
      notes: body.notes ? String(body.notes).trim() : "",
    },
  };
}

export function validateUpdateBillPayload(
  body: Record<string, unknown>,
): ValidationResult<UpdateBillInput> {
  const data: UpdateBillInput = {};

  if (body.notes !== undefined) data.notes = String(body.notes).trim();

  if (body.status !== undefined) {
    if (body.status !== "cancelled") {
      return { valid: false, error: "Only 'cancelled' status is allowed via PATCH." };
    }
    data.status = "cancelled";
    data.cancelReason = body.cancelReason ? String(body.cancelReason).trim() : "";
  }

  return { valid: true, data };
}

export function validateRecordPaymentPayload(
  body: Record<string, unknown>,
): ValidationResult<RecordPaymentInput> {
  const amount = Number(body.amount);
  if (!amount || amount <= 0) {
    return { valid: false, error: "amount is required and must be > 0." };
  }

  if (!body.mode || !PAYMENT_MODES.includes(body.mode as (typeof PAYMENT_MODES)[number])) {
    return { valid: false, error: `mode is required. Allowed: ${PAYMENT_MODES.join(", ")}` };
  }

  if (body.referenceNo && String(body.referenceNo).trim().length > 100) {
    return { valid: false, error: "referenceNo is too long (max 100 characters)." };
  }
  if (body.notes && String(body.notes).trim().length > 500) {
    return { valid: false, error: "notes is too long (max 500 characters)." };
  }

  return {
    valid: true,
    data: {
      amount,
      mode: String(body.mode),
      referenceNo: body.referenceNo ? String(body.referenceNo).trim() : "",
      notes: body.notes ? String(body.notes).trim() : "",
      billId: body.billId ? String(body.billId).trim() : undefined,
    },
  };
}
