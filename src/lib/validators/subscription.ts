import { BILLING_CYCLES, SUBSCRIPTION_STATUSES, type BillingCycle, type SubscriptionStatus } from "@/src/constants/salon";

type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string };

export type AssignSubscriptionInput = {
  salonId: string;
  planCode: string;
  billingCycle: BillingCycle;
  amount?: number;
  startDate?: string;
  endDate?: string;
  nextBillingDate?: string;
  notes?: string;
};

export type RenewInput = {
  billingCycle?: BillingCycle;
  amount?: number;
  startDate?: string;
  endDate?: string;
  nextBillingDate?: string;
  notes?: string;
};

export type ChangePlanInput = {
  planCode: string;
  billingCycle: BillingCycle;
  amount?: number;
  startDate?: string;
  endDate?: string;
  nextBillingDate?: string;
  notes?: string;
};

export type UpdateSubscriptionInput = {
  status?: SubscriptionStatus;
  billingCycle?: BillingCycle;
  startDate?: string;
  endDate?: string;
  nextBillingDate?: string;
  amount?: number;
  notes?: string;
};

function isValidDate(s: string): boolean {
  return !isNaN(new Date(s).getTime());
}

export function validateAssignSubscription(
  body: Record<string, unknown>,
): ValidationResult<AssignSubscriptionInput> {
  if (!body.salonId || typeof body.salonId !== "string" || !body.salonId.trim()) {
    return { valid: false, error: "salonId is required." };
  }
  if (!body.planCode || typeof body.planCode !== "string" || !body.planCode.trim()) {
    return { valid: false, error: "planCode is required." };
  }
  if (!body.billingCycle || !BILLING_CYCLES.includes(body.billingCycle as BillingCycle)) {
    return { valid: false, error: `billingCycle is required. Allowed: ${BILLING_CYCLES.join(", ")}` };
  }
  if (body.amount !== undefined) {
    const a = Number(body.amount);
    if (isNaN(a) || a < 0) return { valid: false, error: "amount must be 0 or positive." };
  }
  if (body.startDate && !isValidDate(body.startDate as string)) {
    return { valid: false, error: "Invalid startDate." };
  }
  if (body.endDate && !isValidDate(body.endDate as string)) {
    return { valid: false, error: "Invalid endDate." };
  }
  if (body.startDate && body.endDate && new Date(body.endDate as string) < new Date(body.startDate as string)) {
    return { valid: false, error: "endDate must not be before startDate." };
  }
  if (body.nextBillingDate && !isValidDate(body.nextBillingDate as string)) {
    return { valid: false, error: "Invalid nextBillingDate." };
  }

  return {
    valid: true,
    data: {
      salonId: (body.salonId as string).trim(),
      planCode: (body.planCode as string).trim().toUpperCase(),
      billingCycle: body.billingCycle as BillingCycle,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      startDate: body.startDate ? (body.startDate as string) : undefined,
      endDate: body.endDate ? (body.endDate as string) : undefined,
      nextBillingDate: body.nextBillingDate ? (body.nextBillingDate as string) : undefined,
      notes: body.notes ? String(body.notes).trim() : undefined,
    },
  };
}

export function validateRenew(
  body: Record<string, unknown>,
): ValidationResult<RenewInput> {
  if (body.billingCycle && !BILLING_CYCLES.includes(body.billingCycle as BillingCycle)) {
    return { valid: false, error: `Invalid billingCycle. Allowed: ${BILLING_CYCLES.join(", ")}` };
  }
  if (body.amount !== undefined) {
    const a = Number(body.amount);
    if (isNaN(a) || a < 0) return { valid: false, error: "amount must be 0 or positive." };
  }
  if (body.startDate && !isValidDate(body.startDate as string)) {
    return { valid: false, error: "Invalid startDate." };
  }
  if (body.endDate && !isValidDate(body.endDate as string)) {
    return { valid: false, error: "Invalid endDate." };
  }
  if (body.nextBillingDate && !isValidDate(body.nextBillingDate as string)) {
    return { valid: false, error: "Invalid nextBillingDate." };
  }

  return {
    valid: true,
    data: {
      billingCycle: body.billingCycle ? (body.billingCycle as BillingCycle) : undefined,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      startDate: body.startDate ? (body.startDate as string) : undefined,
      endDate: body.endDate ? (body.endDate as string) : undefined,
      nextBillingDate: body.nextBillingDate ? (body.nextBillingDate as string) : undefined,
      notes: body.notes ? String(body.notes).trim() : undefined,
    },
  };
}

export function validateChangePlan(
  body: Record<string, unknown>,
): ValidationResult<ChangePlanInput> {
  if (!body.planCode || typeof body.planCode !== "string" || !body.planCode.trim()) {
    return { valid: false, error: "planCode is required." };
  }
  if (!body.billingCycle || !BILLING_CYCLES.includes(body.billingCycle as BillingCycle)) {
    return { valid: false, error: `billingCycle is required. Allowed: ${BILLING_CYCLES.join(", ")}` };
  }
  if (body.amount !== undefined) {
    const a = Number(body.amount);
    if (isNaN(a) || a < 0) return { valid: false, error: "amount must be 0 or positive." };
  }
  if (body.startDate && !isValidDate(body.startDate as string)) {
    return { valid: false, error: "Invalid startDate." };
  }
  if (body.endDate && !isValidDate(body.endDate as string)) {
    return { valid: false, error: "Invalid endDate." };
  }
  if (body.nextBillingDate && !isValidDate(body.nextBillingDate as string)) {
    return { valid: false, error: "Invalid nextBillingDate." };
  }

  return {
    valid: true,
    data: {
      planCode: (body.planCode as string).trim().toUpperCase(),
      billingCycle: body.billingCycle as BillingCycle,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      startDate: body.startDate ? (body.startDate as string) : undefined,
      endDate: body.endDate ? (body.endDate as string) : undefined,
      nextBillingDate: body.nextBillingDate ? (body.nextBillingDate as string) : undefined,
      notes: body.notes ? String(body.notes).trim() : undefined,
    },
  };
}

export function validateUpdateSubscription(
  body: Record<string, unknown>,
): ValidationResult<UpdateSubscriptionInput> {
  const data: UpdateSubscriptionInput = {};

  if (body.status !== undefined) {
    if (!SUBSCRIPTION_STATUSES.includes(body.status as SubscriptionStatus)) {
      return { valid: false, error: `Invalid status. Allowed: ${SUBSCRIPTION_STATUSES.join(", ")}` };
    }
    data.status = body.status as SubscriptionStatus;
  }
  if (body.billingCycle !== undefined) {
    if (!BILLING_CYCLES.includes(body.billingCycle as BillingCycle)) {
      return { valid: false, error: `Invalid billingCycle. Allowed: ${BILLING_CYCLES.join(", ")}` };
    }
    data.billingCycle = body.billingCycle as BillingCycle;
  }
  if (body.amount !== undefined) {
    const a = Number(body.amount);
    if (isNaN(a) || a < 0) return { valid: false, error: "amount must be 0 or positive." };
    data.amount = a;
  }
  if (body.startDate !== undefined) {
    if (!isValidDate(body.startDate as string)) return { valid: false, error: "Invalid startDate." };
    data.startDate = body.startDate as string;
  }
  if (body.endDate !== undefined) {
    if (!isValidDate(body.endDate as string)) return { valid: false, error: "Invalid endDate." };
    data.endDate = body.endDate as string;
  }
  if (body.nextBillingDate !== undefined) {
    if (!isValidDate(body.nextBillingDate as string)) return { valid: false, error: "Invalid nextBillingDate." };
    data.nextBillingDate = body.nextBillingDate as string;
  }
  if (body.notes !== undefined) {
    data.notes = String(body.notes).trim();
  }

  return { valid: true, data };
}
