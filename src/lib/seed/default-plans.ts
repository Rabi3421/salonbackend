import { Plan } from "@/src/models/Plan";

type DefaultPlan = {
  planCode: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
  maxStaff: number;
  maxBranches: number;
  maxAppointmentsPerMonth: number;
  modules: Record<string, boolean>;
  isActive: boolean;
};

const DEFAULT_PLANS: DefaultPlan[] = [
  {
    planCode: "BASIC",
    name: "Basic",
    description: "Essential features for small salons getting started.",
    monthlyPrice: 999,
    yearlyPrice: 9999,
    trialDays: 14,
    maxStaff: 5,
    maxBranches: 1,
    maxAppointmentsPerMonth: 500,
    modules: {
      website: true,
      appointments: true,
      customers: true,
      services: true,
      staff: true,
      packages: false,
      pos: false,
      inventory: false,
      expenses: false,
      marketing: false,
      reports: false,
      multi_branch: false,
    },
    isActive: true,
  },
  {
    planCode: "STANDARD",
    name: "Standard",
    description: "Complete toolkit for growing salons with billing and marketing.",
    monthlyPrice: 1999,
    yearlyPrice: 19999,
    trialDays: 14,
    maxStaff: 15,
    maxBranches: 1,
    maxAppointmentsPerMonth: 2000,
    modules: {
      website: true,
      appointments: true,
      customers: true,
      staff: true,
      services: true,
      packages: true,
      pos: true,
      inventory: false,
      expenses: false,
      marketing: true,
      reports: true,
      multi_branch: false,
    },
    isActive: true,
  },
  {
    planCode: "PREMIUM",
    name: "Premium",
    description: "Full-featured plan for multi-branch salon businesses.",
    monthlyPrice: 2999,
    yearlyPrice: 29999,
    trialDays: 14,
    maxStaff: 50,
    maxBranches: 3,
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
      expenses: true,
      marketing: true,
      reports: true,
      multi_branch: true,
    },
    isActive: true,
  },
];

export async function ensureDefaultPlans(): Promise<{
  created: string[];
  skipped: string[];
}> {
  const created: string[] = [];
  const skipped: string[] = [];

  for (const plan of DEFAULT_PLANS) {
    const exists = await Plan.findOne({ planCode: plan.planCode }).lean();

    if (exists) {
      skipped.push(plan.planCode);
    } else {
      await Plan.create(plan);
      created.push(plan.planCode);
    }
  }

  return { created, skipped };
}
