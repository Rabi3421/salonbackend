import { connectDB } from "@/src/lib/db";
import {
  getAccessStatusFromDates,
  getBillingCycleForDate,
  getGraceEndForDueDate,
  getNextMonthDueDate,
  getNextMonthGraceEndDate,
  calculateDaysLeft,
} from "@/src/lib/subscription-billing-dates";
import {
  BILLING_POLICY,
  ROLE_ACCESS_BY_PLAN,
  getPlanPricing,
  normalizePlanCode,
  toStoredPlanCode,
  type AccessStatus,
} from "@/src/lib/subscription-policy";
import type { FrontendSalonRole } from "@/src/lib/auth/salon-permissions";
import { mapFrontendSalonRoleToBackend } from "@/src/lib/auth/salon-permissions";
import { Subscription } from "@/src/models/Subscription";
import { Salon } from "@/src/models/Salon";

type SubscriptionRecord = Record<string, unknown>;

function activeStatusFor(accessStatus: AccessStatus): boolean {
  return ["trial", "active", "payment_due", "grace_period"].includes(accessStatus);
}

function subscriptionStatusFor(accessStatus: AccessStatus): string {
  return accessStatus;
}

export function buildSubscriptionWarning(subscription: SubscriptionRecord | null, now = new Date()): string {
  if (!subscription) return "";
  const status = String(subscription.accessStatus || subscription.status || "");

  if (status === "trial") {
    const days = calculateDaysLeft(subscription.trialEndDate as Date | string | null, now);
    if (days <= 5) return `Trial ends in ${Math.max(days, 0)} day(s). Payment will be due after trial.`;
    return "";
  }

  if (status === "payment_due") {
    return "Subscription payment is due on the 5th. Please pay before the grace period ends.";
  }

  if (status === "grace_period") {
    const grace = subscription.currentGraceEndDate || subscription.nextGraceEndDate;
    const days = calculateDaysLeft(grace as Date | string | null, now);
    return `Subscription is in grace period. Access will be blocked after ${Math.max(days, 0)} day(s).`;
  }

  if (status === "access_blocked") {
    return "Your salon access is blocked due to pending subscription payment. Please contact support.";
  }

  if (status === "suspended") return "Your salon account is suspended. Please contact support.";
  if (status === "cancelled") return "Your salon subscription has been cancelled.";
  if (status === "expired") return "Your salon subscription has expired.";

  return "";
}

export async function getLatestSubscriptionForSalon(salonId: string) {
  await connectDB();
  return Subscription.findOne({ salonId })
    .sort({ createdAt: -1 })
    .lean();
}

export async function syncSalonAccessFromSubscription(subscription: SubscriptionRecord) {
  const accessStatus = String(subscription.accessStatus || subscription.status || "trial") as AccessStatus;
  const planCode = normalizePlanCode(subscription.planCode);
  const isActive = activeStatusFor(accessStatus);

  await Salon.updateOne(
    { salonId: subscription.salonId },
    {
      $set: {
        currentPlanCode: planCode,
        subscriptionPlan: planCode,
        subscriptionStatus: subscriptionStatusFor(accessStatus),
        accountStatus: accessStatus,
        accessStatus,
        trialStartDate: subscription.trialStartDate ?? subscription.startDate,
        trialEndDate: subscription.trialEndDate ?? subscription.endDate,
        nextBillingDate: subscription.nextDueDate ?? subscription.nextBillingDate,
        graceEndDate: subscription.nextGraceEndDate ?? subscription.currentGraceEndDate,
        finalMonthlyPrice: Number(subscription.finalMonthlyPrice ?? subscription.amount ?? 0),
        lastPaymentDate: subscription.lastPaidAt ?? null,
        isActive,
      },
    },
  );
}

export async function evaluateSalonSubscriptionAccess(salonId: string, now = new Date()) {
  await connectDB();

  const subscription = await Subscription.findOne({ salonId }).sort({ createdAt: -1 });
  if (!subscription) return null;

  const obj = subscription.toObject() as SubscriptionRecord;
  const evaluated = getAccessStatusFromDates(obj, now);

  const update: Record<string, unknown> = {
    accessStatus: evaluated,
    status: evaluated,
    paymentStatus: evaluated === "active" ? "paid" : obj.paymentStatus ?? "pending",
  };

  if (evaluated === "access_blocked" && !obj.suspendedAt && !obj.cancelledAt) {
    update.paymentStatus = "pending";
  }

  await Subscription.updateOne({ _id: subscription._id }, { $set: update });

  const latest = {
    ...obj,
    ...update,
  };
  await syncSalonAccessFromSubscription(latest);

  return latest;
}

export async function applyPaymentToSubscription(
  subscriptionId: string,
  payment: { paymentId: string; salonId: string; paidAt?: Date | string | null },
) {
  await connectDB();

  const paidAt = payment.paidAt ? new Date(payment.paidAt) : new Date();
  const nextDueDate = getNextMonthDueDate(paidAt);
  const nextGraceEndDate = getNextMonthGraceEndDate(paidAt);
  const currentCycle = getBillingCycleForDate(paidAt);

  const updated = await Subscription.findOneAndUpdate(
    { subscriptionId, salonId: payment.salonId },
    {
      $set: {
        status: "active",
        accessStatus: "active",
        paymentStatus: "paid",
        billingCycle: "monthly",
        lastPaidAt: paidAt,
        lastPaymentId: payment.paymentId,
        currentDueDate: currentCycle.dueDate,
        currentGraceEndDate: currentCycle.graceEndDate,
        nextDueDate,
        nextGraceEndDate,
        nextBillingDate: nextDueDate,
        endDate: nextDueDate,
        reactivatedAt: paidAt,
        reactivationReason: "Payment received manually",
      },
    },
    { new: true },
  ).lean();

  if (updated) {
    await syncSalonAccessFromSubscription(updated as SubscriptionRecord);
  }

  return updated;
}

export async function blockSalonAccess(salonId: string, reason: string) {
  await connectDB();

  const sub = await Subscription.findOneAndUpdate(
    { salonId },
    {
      $set: {
        status: "access_blocked",
        accessStatus: "access_blocked",
        paymentStatus: "pending",
        suspensionReason: reason,
      },
    },
    { sort: { createdAt: -1 }, new: true },
  ).lean();

  if (sub) await syncSalonAccessFromSubscription(sub as SubscriptionRecord);
  return sub;
}

export async function reactivateSalonAccess(salonId: string, reason: string) {
  await connectDB();

  const now = new Date();
  const nextDueDate = getNextMonthDueDate(now);
  const nextGraceEndDate = getNextMonthGraceEndDate(now);

  const sub = await Subscription.findOneAndUpdate(
    { salonId },
    {
      $set: {
        status: "active",
        accessStatus: "active",
        paymentStatus: "paid",
        billingCycle: "monthly",
        nextDueDate,
        nextGraceEndDate,
        nextBillingDate: nextDueDate,
        reactivatedAt: now,
        reactivationReason: reason,
      },
    },
    { sort: { createdAt: -1 }, new: true },
  ).lean();

  if (sub) await syncSalonAccessFromSubscription(sub as SubscriptionRecord);
  return sub;
}

export async function getPlanAccessForSalon(salonId: string) {
  const subscription = await getLatestSubscriptionForSalon(salonId);
  const planCode = normalizePlanCode((subscription as SubscriptionRecord | null)?.planCode);
  return {
    planCode,
    allowedRoles: ROLE_ACCESS_BY_PLAN[planCode],
  };
}

export function canRoleAccessPlan(role: FrontendSalonRole | string, planCode: unknown): boolean {
  const backendRole = typeof role === "string" && ["owner", "manager", "receptionist", "stylist", "accountant"].includes(role)
    ? mapFrontendSalonRoleToBackend(role as FrontendSalonRole)
    : role;
  const code = normalizePlanCode(planCode);
  return ROLE_ACCESS_BY_PLAN[code].includes(backendRole as never);
}

export function buildSubscriptionPayload(subscription: SubscriptionRecord | null, now = new Date()) {
  if (!subscription) return null;
  const planCode = normalizePlanCode(subscription.planCode);
  const pricing = getPlanPricing(planCode);
  const finalMonthlyPrice = Number(subscription.finalMonthlyPrice ?? subscription.amount ?? pricing.standardMonthlyPrice);
  const accessStatus = String(subscription.accessStatus || subscription.status || "trial");

  return {
    planCode,
    planName: String(subscription.planName || (planCode === "basic" ? "Basic" : "Premium")),
    accessStatus,
    subscriptionStatus: String(subscription.status || accessStatus),
    finalMonthlyPrice,
    standardMonthlyPrice: Number(subscription.standardMonthlyPrice ?? pricing.standardMonthlyPrice),
    minimumMonthlyPrice: Number(subscription.minimumMonthlyPrice ?? pricing.minimumMonthlyPrice),
    trialStartDate: subscription.trialStartDate ?? subscription.startDate ?? null,
    trialEndDate: subscription.trialEndDate ?? null,
    nextDueDate: subscription.nextDueDate ?? subscription.nextBillingDate ?? null,
    nextGraceEndDate: subscription.nextGraceEndDate ?? null,
    currentDueDate: subscription.currentDueDate ?? null,
    currentGraceEndDate: subscription.currentGraceEndDate ?? null,
    paymentStatus: String(subscription.paymentStatus ?? "pending"),
    lastPaidAt: subscription.lastPaidAt ?? null,
    dueAmount: ["payment_due", "grace_period", "access_blocked"].includes(accessStatus)
      ? finalMonthlyPrice
      : 0,
    billingPolicy: BILLING_POLICY,
    subscriptionWarning: buildSubscriptionWarning(subscription, now),
  };
}

export function buildInitialSubscriptionFields(input: {
  planCode?: unknown;
  trialStartDate: Date;
  trialEndDate: Date;
  finalMonthlyPrice?: number;
  negotiationNote?: string;
}) {
  const planCode = normalizePlanCode(input.planCode);
  const pricing = getPlanPricing(planCode);
  const finalMonthlyPrice = input.finalMonthlyPrice ?? pricing.standardMonthlyPrice;
  const firstDueDate = new Date(input.trialEndDate);
  const dueDate = firstDueDate.getDate() <= BILLING_POLICY.collectionDay
    ? new Date(firstDueDate.getFullYear(), firstDueDate.getMonth(), BILLING_POLICY.collectionDay)
    : new Date(firstDueDate.getFullYear(), firstDueDate.getMonth() + 1, BILLING_POLICY.collectionDay);
  const graceEndDate = getGraceEndForDueDate(dueDate);

  return {
    planCode: toStoredPlanCode(planCode),
    planName: planCode === "basic" ? "Basic" : "Premium",
    standardMonthlyPrice: pricing.standardMonthlyPrice,
    negotiatedMonthlyPrice: finalMonthlyPrice !== pricing.standardMonthlyPrice ? finalMonthlyPrice : undefined,
    finalMonthlyPrice,
    minimumMonthlyPrice: pricing.minimumMonthlyPrice,
    negotiationNote: input.negotiationNote ?? "",
    priceLockedBySuperadmin: finalMonthlyPrice !== pricing.standardMonthlyPrice,
    billingCollectionDay: BILLING_POLICY.collectionDay,
    graceEndDay: BILLING_POLICY.graceEndDay,
    trialStartDate: input.trialStartDate,
    trialEndDate: input.trialEndDate,
    currentDueDate: dueDate,
    currentGraceEndDate: graceEndDate,
    nextDueDate: dueDate,
    nextGraceEndDate: graceEndDate,
    nextBillingDate: dueDate,
    amount: finalMonthlyPrice,
  };
}
