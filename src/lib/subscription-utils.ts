import type { BillingCycle } from "@/src/constants/salon";
import { Salon } from "@/src/models/Salon";

type PlanLike = {
  planCode: string;
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
};

type SubscriptionLike = {
  salonId: string;
  planCode: string;
  status: string;
};

export function calculateSubscriptionDates(opts: {
  billingCycle: BillingCycle;
  plan: PlanLike;
  startDate?: string;
  endDate?: string;
  nextBillingDate?: string;
}): { startDate: Date; endDate: Date; nextBillingDate: Date } {
  const start = opts.startDate ? new Date(opts.startDate) : new Date();

  let end: Date;

  if (opts.endDate) {
    end = new Date(opts.endDate);
  } else if (opts.billingCycle === "monthly") {
    end = new Date(start);
    end.setMonth(end.getMonth() + 1);
  } else if (opts.billingCycle === "yearly") {
    end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end = new Date(start.getTime() + (opts.plan.trialDays || 14) * 86400000);
  }

  const next = opts.nextBillingDate ? new Date(opts.nextBillingDate) : end;

  return { startDate: start, endDate: end, nextBillingDate: next };
}

export function calculateSubscriptionAmount(opts: {
  billingCycle: BillingCycle;
  plan: PlanLike;
  amount?: number;
}): number {
  if (opts.amount !== undefined) return opts.amount;
  if (opts.billingCycle === "monthly") return opts.plan.monthlyPrice;
  if (opts.billingCycle === "yearly") return opts.plan.yearlyPrice;
  return 0;
}

export async function syncSalonSubscriptionState(sub: SubscriptionLike): Promise<void> {
  const update: Record<string, unknown> = {
    currentPlanCode: sub.planCode,
    subscriptionStatus: sub.status,
  };

  if (sub.status === "active" || sub.status === "trial") {
    update.accountStatus = sub.status;
    update.isActive = true;
  } else if (sub.status === "expired") {
    update.accountStatus = "expired";
    update.isActive = false;
  } else if (sub.status === "suspended") {
    update.accountStatus = "suspended";
    update.isActive = false;
  } else if (sub.status === "cancelled") {
    update.accountStatus = "cancelled";
    update.isActive = false;
    update.websiteStatus = "inactive";
  }

  await Salon.updateOne({ salonId: sub.salonId }, { $set: update });
}
