import {
  BILLING_POLICY,
  PLAN_FEATURES,
  PLAN_PRICING,
  ROLE_ACCESS_BY_PLAN,
  type BusinessPlanCode,
} from "@/src/lib/subscription-policy";

export const FIXED_SUBSCRIPTION_PLANS = [
  {
    _id: "fixed-basic",
    planCode: "BASIC",
    name: "Basic",
    description: "Public website and basic salon dashboard access.",
    monthlyPrice: PLAN_PRICING.basic.standardMonthlyPrice,
    minimumMonthlyPrice: PLAN_PRICING.basic.minimumMonthlyPrice,
    yearlyPrice: PLAN_PRICING.basic.standardMonthlyPrice * 12,
    trialDays: BILLING_POLICY.trialDays,
    maxStaff: 10,
    maxBranches: 1,
    maxAppointmentsPerMonth: 0,
    modules: {
      website: true,
      appointments: true,
      customers: true,
      staff: true,
      services: true,
      packages: false,
      pos: false,
      inventory: false,
      expenses: false,
      marketing: false,
      reports: false,
      multi_branch: false,
    },
    features: PLAN_FEATURES.basic,
    roleAccess: ROLE_ACCESS_BY_PLAN.basic,
    allowedRoles: ROLE_ACCESS_BY_PLAN.basic,
    status: "active",
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "fixed-premium",
    planCode: "PREMIUM",
    name: "Premium",
    description: "Full dashboard access for all salon roles and modules.",
    monthlyPrice: PLAN_PRICING.premium.standardMonthlyPrice,
    minimumMonthlyPrice: PLAN_PRICING.premium.minimumMonthlyPrice,
    yearlyPrice: PLAN_PRICING.premium.standardMonthlyPrice * 12,
    trialDays: BILLING_POLICY.trialDays,
    maxStaff: 0,
    maxBranches: 1,
    maxAppointmentsPerMonth: 0,
    modules: {
      website: true,
      appointments: true,
      customers: true,
      staff: true,
      services: true,
      packages: true,
      pos: true,
      inventory: true,
      expenses: false,
      marketing: false,
      reports: true,
      multi_branch: false,
    },
    features: PLAN_FEATURES.premium,
    roleAccess: ROLE_ACCESS_BY_PLAN.premium,
    allowedRoles: ROLE_ACCESS_BY_PLAN.premium,
    status: "active",
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
] as const;

export function getFixedSubscriptionPlan(planCode: unknown) {
  const normalized = String(planCode ?? "").trim().toLowerCase() as BusinessPlanCode;
  return FIXED_SUBSCRIPTION_PLANS.find(
    (plan) => plan.planCode.toLowerCase() === normalized,
  );
}

export function filterFixedSubscriptionPlans(input: {
  search?: string;
  status?: string;
}) {
  const search = input.search?.trim().toLowerCase() ?? "";
  const status = input.status?.trim() ?? "";

  return FIXED_SUBSCRIPTION_PLANS.filter((plan) => {
    if (status === "inactive") return false;
    const matchesSearch = !search ||
      plan.planCode.toLowerCase().includes(search) ||
      plan.name.toLowerCase().includes(search) ||
      plan.description.toLowerCase().includes(search);
    return matchesSearch;
  });
}
