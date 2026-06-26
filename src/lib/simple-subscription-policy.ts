import type { SalonUserRole } from "@/src/constants/salon";

export type SimplePlanCode = "basic" | "premium";

export type SimpleSubscriptionStatus =
  | "trial"
  | "active"
  | "unpaid"
  | "blocked"
  | "cancelled";

export type SimplePaymentMode =
  | "upi"
  | "cash"
  | "bank_transfer"
  | "card"
  | "cheque"
  | "other";

export type SimplePaymentStatus =
  | "paid"
  | "pending"
  | "failed"
  | "cancelled";

export interface PlanDefinition {
  planCode: SimplePlanCode;
  name: string;
  standardPrice: number;
  minimumPrice: number;
  allowedRoles: SalonUserRole[];
  description: string;
}

export const PLANS: Record<SimplePlanCode, PlanDefinition> = {
  basic: {
    planCode: "basic",
    name: "Basic",
    standardPrice: 2000,
    minimumPrice: 1000,
    allowedRoles: [
      "salon_owner",
      "manager",
      "staff",
      "beautician",
      "stylist",
    ],
    description:
      "Frontend website, owner dashboard, stylist dashboard",
  },
  premium: {
    planCode: "premium",
    name: "Premium",
    standardPrice: 3000,
    minimumPrice: 2000,
    allowedRoles: [
      "salon_owner",
      "salon_admin",
      "manager",
      "receptionist",
      "staff",
      "beautician",
      "stylist",
      "cashier",
      "accountant",
      "inventory_manager",
    ],
    description: "All dashboards and full permissions",
  },
};

export const SUBSCRIPTION_STATUSES: readonly SimpleSubscriptionStatus[] = [
  "trial",
  "active",
  "unpaid",
  "blocked",
  "cancelled",
] as const;

export const BILLING_RULE = {
  trialMonths: 1,
  dueDay: 5,
  graceEndDay: 10,
  currency: "INR",
} as const;

export function getPlan(planCode: string): PlanDefinition {
  const key = planCode.toLowerCase() as SimplePlanCode;
  return PLANS[key] ?? PLANS.premium;
}

export function getPlanPrice(planCode: string): number {
  return getPlan(planCode).standardPrice;
}

export function getMinimumPrice(planCode: string): number {
  return getPlan(planCode).minimumPrice;
}

export function validateNegotiatedPrice(
  planCode: string,
  price: number,
): { valid: true } | { valid: false; error: string } {
  const plan = getPlan(planCode);

  if (Number.isNaN(price) || price <= 0) {
    return { valid: false, error: "Monthly price must be positive." };
  }

  if (price < plan.minimumPrice) {
    return {
      valid: false,
      error: `${plan.name} plan monthly price cannot be below ₹${plan.minimumPrice}.`,
    };
  }

  return { valid: true };
}

export function isRoleAllowedForPlan(
  role: string,
  planCode: string,
): boolean {
  const plan = getPlan(planCode);
  return plan.allowedRoles.includes(role as SalonUserRole);
}

export function addOneMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  return result;
}

export function getNextDueDateAfter(date: Date): Date {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  if (day <= BILLING_RULE.dueDay) {
    return new Date(year, month, BILLING_RULE.dueDay);
  }
  return new Date(year, month + 1, BILLING_RULE.dueDay);
}

export function getGraceEndDateForDueDate(dueDate: Date): Date {
  return new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    BILLING_RULE.graceEndDay,
    23,
    59,
    59,
    999,
  );
}

export function isAccessAllowed(
  status: string | undefined | null,
): boolean {
  return ["trial", "active", "unpaid"].includes(status ?? "");
}

export function shouldShowWarning(
  status: string | undefined | null,
): boolean {
  return status === "unpaid";
}

export function getWarningMessage(
  status: string | undefined | null,
  dates?: {
    trialEndDate?: Date | string | null;
    nextDueDate?: Date | string | null;
    graceEndDate?: Date | string | null;
  },
): string {
  const fmt = (d: Date | string | null | undefined) => {
    if (!d) return "";
    const dt = typeof d === "string" ? new Date(d) : d;
    return dt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  switch (status) {
    case "trial":
      return dates?.trialEndDate
        ? `Your free trial is active until ${fmt(dates.trialEndDate)}.`
        : "Your free trial is active.";
    case "active":
      return "Your subscription is active.";
    case "unpaid":
      return "Payment is due. Please pay before 10th to avoid access block.";
    case "blocked":
      return "Your salon access is blocked due to pending payment. Please contact support.";
    case "cancelled":
      return "Your subscription is cancelled. Please contact support.";
    default:
      return "";
  }
}

export function normalizePlanCode(planCode: unknown): SimplePlanCode {
  const value = String(planCode ?? "").trim().toLowerCase();
  return value === "basic" ? "basic" : "premium";
}

export function toStoredPlanCode(planCode: unknown): string {
  return normalizePlanCode(planCode).toUpperCase();
}
