import { connectDB } from "@/src/lib/db";
import {
  BILLING_RULE,
  getPlan,
  normalizePlanCode,
  toStoredPlanCode,
  isAccessAllowed,
  getWarningMessage,
  getNextDueDateAfter,
  getGraceEndDateForDueDate,
} from "@/src/lib/simple-subscription-policy";
import type { FrontendSalonRole } from "@/src/lib/auth/salon-permissions";
import { mapFrontendSalonRoleToBackend } from "@/src/lib/auth/salon-permissions";
import { Subscription } from "@/src/models/Subscription";
import { Salon } from "@/src/models/Salon";

type SubscriptionRecord = Record<string, unknown>;

export function buildSubscriptionWarning(
  subscription: SubscriptionRecord | null,
  _now = new Date(),
): string {
  if (!subscription) return "";
  const status = String(
    subscription.accessStatus || subscription.status || "",
  );
  return getWarningMessage(status, {
    trialEndDate: subscription.trialEndDate as string | null,
    nextDueDate: subscription.nextDueDate as string | null,
    graceEndDate:
      (subscription.graceEndDate as string | null) ??
      (subscription.nextGraceEndDate as string | null),
  });
}

export async function getLatestSubscriptionForSalon(salonId: string) {
  await connectDB();
  return Subscription.findOne({ salonId }).sort({ createdAt: -1 }).lean();
}

export async function syncSalonAccessFromSubscription(
  subscription: SubscriptionRecord,
) {
  const status = String(
    subscription.accessStatus || subscription.status || "trial",
  );
  const planCode = normalizePlanCode(subscription.planCode);
  const plan = getPlan(planCode);
  const isActive = isAccessAllowed(status);

  await Salon.updateOne(
    { salonId: subscription.salonId },
    {
      $set: {
        currentPlanCode: planCode,
        planCode,
        planName: plan.name,
        subscriptionPlan: planCode,
        subscriptionStatus: status,
        accountStatus: status,
        accessStatus: status,
        trialStartDate:
          subscription.trialStartDate ?? subscription.startDate,
        trialEndDate: subscription.trialEndDate ?? subscription.endDate,
        monthlyPrice: Number(
          subscription.finalMonthlyPrice ?? subscription.amount ?? 0,
        ),
        standardPrice: plan.standardPrice,
        minimumPrice: plan.minimumPrice,
        nextDueDate:
          subscription.nextDueDate ?? subscription.nextBillingDate,
        nextBillingDate:
          subscription.nextDueDate ?? subscription.nextBillingDate,
        graceEndDate:
          subscription.nextGraceEndDate ??
          subscription.currentGraceEndDate,
        finalMonthlyPrice: Number(
          subscription.finalMonthlyPrice ?? subscription.amount ?? 0,
        ),
        lastPaymentDate: subscription.lastPaidAt ?? null,
        isActive,
        blockedAt: status === "blocked" ? (subscription.suspendedAt ?? new Date()) : null,
        blockedReason:
          status === "blocked"
            ? String(subscription.suspensionReason || "")
            : "",
        cancelledAt:
          status === "cancelled" ? (subscription.cancelledAt ?? new Date()) : null,
        negotiationNote: String(subscription.negotiationNote || ""),
      },
    },
  );
}

export async function evaluateSalonSubscriptionAccess(
  salonId: string,
  _now = new Date(),
) {
  await connectDB();
  const subscription = await Subscription.findOne({ salonId })
    .sort({ createdAt: -1 })
    .lean();
  return subscription as SubscriptionRecord | null;
}

export async function applyPaymentToSubscription(
  subscriptionId: string,
  payment: {
    paymentId: string;
    salonId: string;
    paidAt?: Date | string | null;
  },
) {
  await connectDB();

  const paidAt = payment.paidAt ? new Date(payment.paidAt) : new Date();
  const nextDueDate = getNextDueDateAfter(paidAt);
  const nextGraceEndDate = getGraceEndDateForDueDate(nextDueDate);

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
        nextDueDate,
        nextGraceEndDate,
        nextBillingDate: nextDueDate,
        reactivatedAt: paidAt,
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

  const now = new Date();
  const sub = await Subscription.findOneAndUpdate(
    { salonId },
    {
      $set: {
        status: "blocked",
        accessStatus: "blocked",
        suspensionReason: reason,
        suspendedAt: now,
      },
    },
    { sort: { createdAt: -1 }, new: true },
  ).lean();

  if (sub) await syncSalonAccessFromSubscription(sub as SubscriptionRecord);
  return sub;
}

export async function reactivateSalonAccess(
  salonId: string,
  reason: string,
) {
  await connectDB();

  const now = new Date();
  const sub = await Subscription.findOneAndUpdate(
    { salonId },
    {
      $set: {
        status: "active",
        accessStatus: "active",
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
  const planCode = normalizePlanCode(
    (subscription as SubscriptionRecord | null)?.planCode,
  );
  return {
    planCode,
    allowedRoles: getPlan(planCode).allowedRoles,
  };
}

export function canRoleAccessPlan(
  role: FrontendSalonRole | string,
  planCode: unknown,
): boolean {
  const backendRole =
    typeof role === "string" &&
    ["owner", "manager", "receptionist", "stylist", "accountant"].includes(
      role,
    )
      ? mapFrontendSalonRoleToBackend(role as FrontendSalonRole)
      : role;
  const plan = getPlan(String(planCode));
  return plan.allowedRoles.includes(backendRole as never);
}

export function buildSubscriptionPayload(
  subscription: SubscriptionRecord | null,
  now = new Date(),
) {
  if (!subscription) return null;
  const planCode = normalizePlanCode(subscription.planCode);
  const plan = getPlan(planCode);
  const monthlyPrice = Number(
    subscription.finalMonthlyPrice ??
      subscription.amount ??
      plan.standardPrice,
  );
  const status = String(
    subscription.accessStatus || subscription.status || "trial",
  );

  return {
    planCode,
    planName: plan.name,
    monthlyPrice,
    standardPrice: plan.standardPrice,
    minimumPrice: plan.minimumPrice,
    subscriptionStatus: status,
    trialStartDate:
      subscription.trialStartDate ?? subscription.startDate ?? null,
    trialEndDate: subscription.trialEndDate ?? null,
    nextDueDate: subscription.nextDueDate ?? subscription.nextBillingDate ?? null,
    graceEndDate:
      subscription.nextGraceEndDate ??
      subscription.currentGraceEndDate ??
      null,
    lastPaymentDate: subscription.lastPaidAt ?? null,
    dueAmount: status === "unpaid" ? monthlyPrice : 0,
    subscriptionWarning: getWarningMessage(status, {
      trialEndDate: subscription.trialEndDate as string | null,
      nextDueDate: subscription.nextDueDate as string | null,
      graceEndDate:
        (subscription.nextGraceEndDate as string | null) ??
        (subscription.currentGraceEndDate as string | null),
    }),
    warningMessage: getWarningMessage(status, {
      trialEndDate: subscription.trialEndDate as string | null,
      nextDueDate: subscription.nextDueDate as string | null,
      graceEndDate:
        (subscription.nextGraceEndDate as string | null) ??
        (subscription.currentGraceEndDate as string | null),
    }),
    paymentInstructions: {
      upiId: "",
      accountName: "SalonFlow",
      note: "Please pay before 10th to avoid access block. After payment, share transaction proof with support.",
    },
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
  const plan = getPlan(planCode);
  const finalMonthlyPrice =
    input.finalMonthlyPrice ?? plan.standardPrice;
  const dueDate = getNextDueDateAfter(input.trialEndDate);
  const graceEndDate = getGraceEndDateForDueDate(dueDate);

  return {
    planCode: toStoredPlanCode(planCode),
    planName: plan.name,
    standardMonthlyPrice: plan.standardPrice,
    negotiatedMonthlyPrice:
      finalMonthlyPrice !== plan.standardPrice
        ? finalMonthlyPrice
        : undefined,
    finalMonthlyPrice,
    minimumMonthlyPrice: plan.minimumPrice,
    negotiationNote: input.negotiationNote ?? "",
    priceLockedBySuperadmin: finalMonthlyPrice !== plan.standardPrice,
    billingCollectionDay: BILLING_RULE.dueDay,
    graceEndDay: BILLING_RULE.graceEndDay,
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
