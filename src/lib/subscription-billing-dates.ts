import { BILLING_POLICY, type AccessStatus } from "@/src/lib/subscription-policy";

type SubscriptionDateLike = {
  accessStatus?: string;
  status?: string;
  paymentStatus?: string;
  trialEndDate?: Date | string | null;
  currentDueDate?: Date | string | null;
  currentGraceEndDate?: Date | string | null;
  nextDueDate?: Date | string | null;
  nextGraceEndDate?: Date | string | null;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function asDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addTrialPeriod(startDate: Date = new Date()): Date {
  const end = new Date(startDate);
  end.setDate(end.getDate() + BILLING_POLICY.trialDays);
  return end;
}

export function getCurrentMonthDueDate(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), BILLING_POLICY.collectionDay);
}

export function getCurrentMonthGraceEndDate(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), BILLING_POLICY.graceEndDay, 23, 59, 59, 999);
}

export function getNextMonthDueDate(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, BILLING_POLICY.collectionDay);
}

export function getNextMonthGraceEndDate(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, BILLING_POLICY.graceEndDay, 23, 59, 59, 999);
}

export function getFirstDueDateAfterTrial(trialEndDate: Date): Date {
  const dueThisMonth = getCurrentMonthDueDate(trialEndDate);

  // First bill is the next upcoming 5th after trial ends.
  // If trial ends on or before the 5th, bill the same month; otherwise bill next month.
  if (startOfDay(trialEndDate).getTime() <= startOfDay(dueThisMonth).getTime()) {
    return dueThisMonth;
  }

  return getNextMonthDueDate(trialEndDate);
}

export function getGraceEndForDueDate(dueDate: Date): Date {
  return new Date(dueDate.getFullYear(), dueDate.getMonth(), BILLING_POLICY.graceEndDay, 23, 59, 59, 999);
}

export function getBillingCycleForDate(date: Date = new Date()) {
  return {
    dueDate: getCurrentMonthDueDate(date),
    graceEndDate: getCurrentMonthGraceEndDate(date),
    nextDueDate: getNextMonthDueDate(date),
    nextGraceEndDate: getNextMonthGraceEndDate(date),
  };
}

export function calculateDaysLeft(date: Date | string | null | undefined, now: Date = new Date()): number {
  const target = asDate(date);
  if (!target) return 0;
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

export function isAfterGracePeriod(date: Date | string | null | undefined, now: Date = new Date()): boolean {
  const graceEnd = asDate(date);
  return Boolean(graceEnd && now.getTime() > graceEnd.getTime());
}

export function getAccessStatusFromDates(
  subscription: SubscriptionDateLike,
  now: Date = new Date(),
): AccessStatus {
  const currentStatus = subscription.accessStatus || subscription.status;

  if (currentStatus === "cancelled") return "cancelled";
  if (currentStatus === "suspended") return "suspended";
  if (currentStatus === "access_blocked") return "access_blocked";

  const trialEndDate = asDate(subscription.trialEndDate);
  if ((currentStatus === "trial" || subscription.status === "trial") && trialEndDate) {
    if (now.getTime() <= trialEndDate.getTime()) return "trial";
  }

  if (subscription.paymentStatus === "paid") return "active";

  const dueDate = asDate(subscription.currentDueDate) || asDate(subscription.nextDueDate);
  const graceEndDate = asDate(subscription.currentGraceEndDate) || asDate(subscription.nextGraceEndDate);

  if (dueDate && now.getTime() <= dueDate.getTime()) return "payment_due";
  if (graceEndDate && now.getTime() <= graceEndDate.getTime()) return "grace_period";
  if (graceEndDate && now.getTime() > graceEndDate.getTime()) return "access_blocked";

  return currentStatus === "active" ? "active" : "payment_due";
}
