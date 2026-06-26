import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import {
  ACCESS_STATUSES,
  getPlanPricing,
  normalizePlanCode,
  toStoredPlanCode,
  validateFinalMonthlyPrice,
} from "@/src/lib/subscription-policy";
import { syncSalonAccessFromSubscription } from "@/src/lib/subscription-access-service";
import { Subscription } from "@/src/models/Subscription";
import { Salon } from "@/src/models/Salon";

type RouteParams = { params: Promise<{ salonId: string }> };

function parseOptionalDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { salonId } = await params;
    const salon = await Salon.findOne({ salonId }).lean();
    if (!salon) return errorResponse("Salon not found.", 404);

    const body = (await request.json()) as Record<string, unknown>;
    const subscription = await Subscription.findOne({ salonId }).sort({ createdAt: -1 });
    if (!subscription) return errorResponse("Subscription not found.", 404);

    const before = subscription.toObject();
    const set: Record<string, unknown> = {};

    if (body.planCode !== undefined) {
      const planCode = normalizePlanCode(body.planCode);
      const pricing = getPlanPricing(planCode);
      set.planCode = toStoredPlanCode(planCode);
      set.planName = planCode === "basic" ? "Basic" : "Premium";
      set.standardMonthlyPrice = pricing.standardMonthlyPrice;
      set.minimumMonthlyPrice = pricing.minimumMonthlyPrice;
      if (body.finalMonthlyPrice === undefined) {
        set.finalMonthlyPrice = pricing.standardMonthlyPrice;
        set.amount = pricing.standardMonthlyPrice;
      }
    }

    const planCodeForValidation = body.planCode ?? subscription.planCode;
    if (body.finalMonthlyPrice !== undefined) {
      const finalMonthlyPrice = Number(body.finalMonthlyPrice);
      const validation = validateFinalMonthlyPrice(planCodeForValidation, finalMonthlyPrice);
      if (!validation.valid) return errorResponse(validation.error, 400);
      set.finalMonthlyPrice = finalMonthlyPrice;
      set.negotiatedMonthlyPrice = finalMonthlyPrice;
      set.amount = finalMonthlyPrice;
      set.priceLockedBySuperadmin = true;
    }

    if (body.negotiationNote !== undefined) set.negotiationNote = String(body.negotiationNote).trim();

    if (body.accessStatus !== undefined) {
      if (!ACCESS_STATUSES.includes(body.accessStatus as never)) {
        return errorResponse(`Invalid accessStatus. Allowed: ${ACCESS_STATUSES.join(", ")}`, 400);
      }
      set.accessStatus = body.accessStatus;
      set.status = body.accessStatus;
    }

    const nextDueDate = parseOptionalDate(body.nextDueDate);
    if (body.nextDueDate !== undefined && !nextDueDate) return errorResponse("Invalid nextDueDate.", 400);
    if (nextDueDate) {
      set.nextDueDate = nextDueDate;
      set.nextBillingDate = nextDueDate;
    }

    const nextGraceEndDate = parseOptionalDate(body.nextGraceEndDate);
    if (body.nextGraceEndDate !== undefined && !nextGraceEndDate) return errorResponse("Invalid nextGraceEndDate.", 400);
    if (nextGraceEndDate) set.nextGraceEndDate = nextGraceEndDate;

    const updated = await Subscription.findOneAndUpdate(
      { _id: subscription._id },
      { $set: set },
      { new: true },
    ).lean();

    if (updated) await syncSalonAccessFromSubscription(updated as Record<string, unknown>);

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SUBSCRIPTION_UPDATED,
      entityType: "Subscription",
      entityId: String(subscription.subscriptionId),
      before,
      after: set,
      request,
    });

    return successResponse({ subscription: updated }, "Subscription policy updated.");
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to update subscription policy.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
