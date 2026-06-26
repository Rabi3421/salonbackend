import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import {
  getPlan,
  normalizePlanCode,
  toStoredPlanCode,
  validateNegotiatedPrice,
  SUBSCRIPTION_STATUSES,
} from "@/src/lib/simple-subscription-policy";
import { Salon } from "@/src/models/Salon";
import { Subscription } from "@/src/models/Subscription";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ salonId: string }> },
) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { salonId } = await params;
    const salon = await Salon.findOne({ salonId }).lean() as Record<string, unknown> | null;
    if (!salon) return errorResponse("Salon not found.", 404);

    const subscription = await Subscription.findOne({ salonId })
      .sort({ createdAt: -1 })
      .lean() as Record<string, unknown> | null;

    const planCode = normalizePlanCode(subscription?.planCode ?? salon.planCode ?? salon.currentPlanCode);
    const plan = getPlan(planCode);

    return successResponse({
      salonId,
      salonName: salon.name,
      planCode,
      planName: plan.name,
      monthlyPrice: Number(subscription?.finalMonthlyPrice ?? salon.monthlyPrice ?? salon.finalMonthlyPrice ?? plan.standardPrice),
      standardPrice: plan.standardPrice,
      minimumPrice: plan.minimumPrice,
      subscriptionStatus: String(subscription?.status ?? subscription?.accessStatus ?? salon.subscriptionStatus ?? salon.accountStatus ?? "trial"),
      trialStartDate: subscription?.trialStartDate ?? salon.trialStartDate ?? null,
      trialEndDate: subscription?.trialEndDate ?? salon.trialEndDate ?? null,
      nextDueDate: subscription?.nextDueDate ?? subscription?.nextBillingDate ?? salon.nextDueDate ?? salon.nextBillingDate ?? null,
      graceEndDate: subscription?.nextGraceEndDate ?? subscription?.currentGraceEndDate ?? salon.graceEndDate ?? null,
      lastPaymentDate: subscription?.lastPaidAt ?? salon.lastPaymentDate ?? null,
      negotiationNote: String(subscription?.negotiationNote ?? salon.negotiationNote ?? ""),
      isActive: Boolean(salon.isActive),
      blockedAt: salon.blockedAt ?? null,
      blockedReason: String(salon.blockedReason ?? ""),
    });
  } catch {
    return errorResponse("Unable to fetch subscription.", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ salonId: string }> },
) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { salonId } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const salon = await Salon.findOne({ salonId }).lean();
    if (!salon) return errorResponse("Salon not found.", 404);

    const subscription = await Subscription.findOne({ salonId }).sort({ createdAt: -1 });
    if (!subscription) return errorResponse("Subscription not found.", 404);

    const planCode = body.planCode ? normalizePlanCode(body.planCode) : undefined;
    const monthlyPrice = body.monthlyPrice !== undefined ? Number(body.monthlyPrice) : undefined;
    const subscriptionStatus = body.subscriptionStatus as string | undefined;
    const nextDueDate = body.nextDueDate ? new Date(String(body.nextDueDate)) : undefined;
    const graceEndDate = body.graceEndDate ? new Date(String(body.graceEndDate)) : undefined;
    const negotiationNote = body.negotiationNote !== undefined ? String(body.negotiationNote) : undefined;

    if (subscriptionStatus && !SUBSCRIPTION_STATUSES.includes(subscriptionStatus as never)) {
      return errorResponse(`Status must be one of: ${SUBSCRIPTION_STATUSES.join(", ")}`, 400);
    }

    if (planCode && monthlyPrice !== undefined) {
      const validation = validateNegotiatedPrice(planCode, monthlyPrice);
      if (!validation.valid) return errorResponse(validation.error, 400);
    } else if (monthlyPrice !== undefined) {
      const currentPlan = normalizePlanCode(subscription.planCode);
      const validation = validateNegotiatedPrice(currentPlan, monthlyPrice);
      if (!validation.valid) return errorResponse(validation.error, 400);
    }

    if (nextDueDate && graceEndDate && graceEndDate < nextDueDate) {
      return errorResponse("Grace end date cannot be before next due date.", 400);
    }

    const subUpdate: Record<string, unknown> = {};
    const salonUpdate: Record<string, unknown> = {};

    if (planCode) {
      const plan = getPlan(planCode);
      subUpdate.planCode = toStoredPlanCode(planCode);
      subUpdate.planName = plan.name;
      subUpdate.standardMonthlyPrice = plan.standardPrice;
      subUpdate.minimumMonthlyPrice = plan.minimumPrice;
      salonUpdate.currentPlanCode = planCode;
      salonUpdate.planCode = planCode;
      salonUpdate.planName = plan.name;
      salonUpdate.subscriptionPlan = toStoredPlanCode(planCode);
      salonUpdate.standardPrice = plan.standardPrice;
      salonUpdate.minimumPrice = plan.minimumPrice;
    }

    if (monthlyPrice !== undefined) {
      subUpdate.finalMonthlyPrice = monthlyPrice;
      subUpdate.amount = monthlyPrice;
      salonUpdate.monthlyPrice = monthlyPrice;
      salonUpdate.finalMonthlyPrice = monthlyPrice;
    }

    if (subscriptionStatus) {
      subUpdate.status = subscriptionStatus;
      subUpdate.accessStatus = subscriptionStatus;
      salonUpdate.subscriptionStatus = subscriptionStatus;
      salonUpdate.accountStatus = subscriptionStatus;
      salonUpdate.accessStatus = subscriptionStatus;

      const isActive = ["trial", "active", "unpaid"].includes(subscriptionStatus);
      salonUpdate.isActive = isActive;

      if (subscriptionStatus === "blocked") {
        salonUpdate.blockedAt = new Date();
        subUpdate.suspendedAt = new Date();
      } else {
        salonUpdate.blockedAt = null;
        salonUpdate.blockedReason = "";
      }

      if (subscriptionStatus === "cancelled") {
        salonUpdate.cancelledAt = new Date();
        subUpdate.cancelledAt = new Date();
      }
    }

    if (nextDueDate) {
      subUpdate.nextDueDate = nextDueDate;
      subUpdate.nextBillingDate = nextDueDate;
      salonUpdate.nextDueDate = nextDueDate;
      salonUpdate.nextBillingDate = nextDueDate;
    }

    if (graceEndDate) {
      subUpdate.nextGraceEndDate = graceEndDate;
      salonUpdate.graceEndDate = graceEndDate;
    }

    if (negotiationNote !== undefined) {
      subUpdate.negotiationNote = negotiationNote;
      salonUpdate.negotiationNote = negotiationNote;
    }

    if (Object.keys(subUpdate).length > 0) {
      await Subscription.updateOne({ _id: subscription._id }, { $set: subUpdate });
    }
    if (Object.keys(salonUpdate).length > 0) {
      await Salon.updateOne({ salonId }, { $set: salonUpdate });
    }

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SALON_UPDATED,
      entityType: "Subscription",
      entityId: salonId,
      after: { ...subUpdate, salonId },
      request,
    });

    const effectivePlanCode = planCode ?? normalizePlanCode(subscription.planCode);
    const effectivePlan = getPlan(effectivePlanCode);

    return successResponse({
      subscription: {
        salonId,
        planCode: effectivePlanCode,
        planName: effectivePlan.name,
        monthlyPrice: Number(monthlyPrice ?? subscription.finalMonthlyPrice ?? effectivePlan.standardPrice),
        standardPrice: effectivePlan.standardPrice,
        minimumPrice: effectivePlan.minimumPrice,
        subscriptionStatus: String(subscriptionStatus ?? subscription.status),
        isActive: ["trial", "active", "unpaid"].includes(String(subscriptionStatus ?? subscription.status)),
      },
    }, "Subscription updated.");
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON.", 400);
    return errorResponse("Unable to update subscription.", 500);
  }
}
