import type { SalonUserRole } from "@/src/constants/salon";

export const PLAN_CODES = {
  basic: "basic",
  premium: "premium",
} as const;

export type BusinessPlanCode = keyof typeof PLAN_CODES;

export const BILLING_POLICY = {
  trialDays: 30,
  collectionDay: 5,
  graceEndDay: 10,
  currency: "INR",
} as const;

export const ACCESS_STATUSES = [
  "trial",
  "active",
  "unpaid",
  "blocked",
  "cancelled",
  "payment_due",
  "grace_period",
  "access_blocked",
  "suspended",
  "expired",
] as const;

export type AccessStatus = (typeof ACCESS_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
] as const;

export type SubscriptionPaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PLAN_PRICING: Record<
  BusinessPlanCode,
  { standardMonthlyPrice: number; minimumMonthlyPrice: number }
> = {
  basic: {
    standardMonthlyPrice: 2000,
    minimumMonthlyPrice: 1000,
  },
  premium: {
    standardMonthlyPrice: 3000,
    minimumMonthlyPrice: 2000,
  },
};

export const PLAN_FEATURES = {
  basic: {
    website: true,
    ownerDashboard: true,
    stylistDashboard: true,
    receptionistDashboard: false,
    accountantDashboard: false,
    inventoryDashboard: false,
    advancedReports: false,
    allModules: false,
  },
  premium: {
    website: true,
    ownerDashboard: true,
    stylistDashboard: true,
    receptionistDashboard: true,
    accountantDashboard: true,
    inventoryDashboard: true,
    advancedReports: true,
    allModules: true,
  },
} as const;

export const ROLE_ACCESS_BY_PLAN: Record<BusinessPlanCode, SalonUserRole[]> = {
  basic: ["salon_owner", "salon_admin", "manager", "stylist"],
  premium: [
    "salon_owner",
    "salon_admin",
    "manager",
    "receptionist",
    "stylist",
    "cashier",
  ],
};

export function normalizePlanCode(planCode: unknown): BusinessPlanCode {
  const value = String(planCode ?? "").trim().toLowerCase();
  return value === PLAN_CODES.basic ? PLAN_CODES.basic : PLAN_CODES.premium;
}

export function toStoredPlanCode(planCode: unknown): string {
  return normalizePlanCode(planCode).toUpperCase();
}

export function toPublicPlanCode(planCode: unknown): BusinessPlanCode {
  return normalizePlanCode(planCode);
}

export function getPlanPricing(planCode: unknown) {
  return PLAN_PRICING[normalizePlanCode(planCode)];
}

export function validateFinalMonthlyPrice(
  planCode: unknown,
  finalMonthlyPrice: number,
): { valid: true } | { valid: false; error: string } {
  const code = normalizePlanCode(planCode);
  const pricing = PLAN_PRICING[code];

  if (Number.isNaN(finalMonthlyPrice) || finalMonthlyPrice <= 0) {
    return { valid: false, error: "finalMonthlyPrice must be positive." };
  }

  if (finalMonthlyPrice < pricing.minimumMonthlyPrice) {
    return {
      valid: false,
      error: `${code === "basic" ? "Basic" : "Premium"} finalMonthlyPrice cannot be below ₹${pricing.minimumMonthlyPrice}.`,
    };
  }

  return { valid: true };
}
