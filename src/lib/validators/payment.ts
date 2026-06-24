import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/src/constants/salon";

type PaymentMethod = (typeof PAYMENT_METHODS)[number];
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string };

export type CreatePaymentInput = {
  salonId: string;
  subscriptionId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  referenceNote?: string;
  paidAt?: Date;
};

export type UpdatePaymentInput = {
  amount?: number;
  method?: PaymentMethod;
  status?: PaymentStatus;
  transactionId?: string;
  referenceNote?: string;
  paidAt?: Date | null;
};

function isValidDate(s: string): boolean {
  return !isNaN(new Date(s).getTime());
}

export function validateCreatePayment(
  body: Record<string, unknown>,
): ValidationResult<CreatePaymentInput> {
  if (!body.salonId || typeof body.salonId !== "string" || !body.salonId.trim()) {
    return { valid: false, error: "salonId is required." };
  }

  const amount = Number(body.amount);
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: "amount must be positive." };
  }

  if (!body.method || !PAYMENT_METHODS.includes(body.method as PaymentMethod)) {
    return { valid: false, error: `method is required. Allowed: ${PAYMENT_METHODS.join(", ")}` };
  }

  let status: PaymentStatus = "pending";
  if (body.status) {
    if (!PAYMENT_STATUSES.includes(body.status as PaymentStatus)) {
      return { valid: false, error: `Invalid status. Allowed: ${PAYMENT_STATUSES.join(", ")}` };
    }
    status = body.status as PaymentStatus;
  }

  let paidAt: Date | undefined;
  if (body.paidAt) {
    if (!isValidDate(body.paidAt as string)) {
      return { valid: false, error: "Invalid paidAt date." };
    }
    paidAt = new Date(body.paidAt as string);
  } else if (status === "paid") {
    paidAt = new Date();
  }

  return {
    valid: true,
    data: {
      salonId: (body.salonId as string).trim(),
      subscriptionId: body.subscriptionId ? String(body.subscriptionId).trim() : undefined,
      amount,
      method: body.method as PaymentMethod,
      status,
      transactionId: body.transactionId ? String(body.transactionId).trim() : undefined,
      referenceNote: body.referenceNote ? String(body.referenceNote).trim() : undefined,
      paidAt,
    },
  };
}

export function validateUpdatePayment(
  body: Record<string, unknown>,
): ValidationResult<UpdatePaymentInput> {
  const data: UpdatePaymentInput = {};

  if (body.amount !== undefined) {
    const a = Number(body.amount);
    if (isNaN(a) || a <= 0) return { valid: false, error: "amount must be positive." };
    data.amount = a;
  }

  if (body.method !== undefined) {
    if (!PAYMENT_METHODS.includes(body.method as PaymentMethod)) {
      return { valid: false, error: `Invalid method. Allowed: ${PAYMENT_METHODS.join(", ")}` };
    }
    data.method = body.method as PaymentMethod;
  }

  if (body.status !== undefined) {
    if (!PAYMENT_STATUSES.includes(body.status as PaymentStatus)) {
      return { valid: false, error: `Invalid status. Allowed: ${PAYMENT_STATUSES.join(", ")}` };
    }
    data.status = body.status as PaymentStatus;
  }

  if (body.transactionId !== undefined) {
    data.transactionId = String(body.transactionId).trim();
  }

  if (body.referenceNote !== undefined) {
    data.referenceNote = String(body.referenceNote).trim();
  }

  if (body.paidAt !== undefined) {
    if (body.paidAt === null || body.paidAt === "") {
      data.paidAt = null;
    } else {
      if (!isValidDate(body.paidAt as string)) {
        return { valid: false, error: "Invalid paidAt date." };
      }
      data.paidAt = new Date(body.paidAt as string);
    }
  }

  if (data.status === "paid" && data.paidAt === undefined) {
    data.paidAt = new Date();
  }

  return { valid: true, data };
}
