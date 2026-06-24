import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { validateUpdateSubscription } from "@/src/lib/validators/subscription";
import { syncSalonSubscriptionState } from "@/src/lib/subscription-utils";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Subscription } from "@/src/models/Subscription";
import { Salon } from "@/src/models/Salon";
import { Plan } from "@/src/models/Plan";

type RouteParams = { params: Promise<{ subscriptionId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { subscriptionId } = await params;
    const subscription = await Subscription.findOne({ subscriptionId }).lean();
    if (!subscription) return errorResponse("Subscription not found.", 404);

    const subObj = subscription as Record<string, unknown>;

    const [salon, plan] = await Promise.all([
      Salon.findOne({ salonId: subObj.salonId }).select("salonId name ownerName ownerEmail ownerPhone city").lean(),
      Plan.findOne({ planCode: subObj.planCode }).select("planCode name monthlyPrice yearlyPrice trialDays").lean(),
    ]);

    return successResponse({ subscription, salon, plan });
  } catch {
    return errorResponse("Unable to fetch subscription.", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { subscriptionId } = await params;
    const subscription = await Subscription.findOne({ subscriptionId });
    if (!subscription) return errorResponse("Subscription not found.", 404);

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateUpdateSubscription(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;
    const before = subscription.toObject();
    const update: Record<string, unknown> = {};

    if (input.status !== undefined) update.status = input.status;
    if (input.billingCycle !== undefined) update.billingCycle = input.billingCycle;
    if (input.amount !== undefined) update.amount = input.amount;
    if (input.startDate !== undefined) update.startDate = new Date(input.startDate);
    if (input.endDate !== undefined) update.endDate = new Date(input.endDate);
    if (input.nextBillingDate !== undefined) update.nextBillingDate = new Date(input.nextBillingDate);
    if (input.notes !== undefined) update.notes = input.notes;

    const updated = await Subscription.findOneAndUpdate(
      { subscriptionId },
      { $set: update },
      { new: true },
    ).lean();

    const latestForSalon = await Subscription.findOne({ salonId: subscription.salonId })
      .sort({ createdAt: -1 })
      .select("subscriptionId")
      .lean();

    if (latestForSalon && (latestForSalon as Record<string, unknown>).subscriptionId === subscriptionId) {
      const u = updated as Record<string, unknown>;
      await syncSalonSubscriptionState({
        salonId: u.salonId as string,
        planCode: u.planCode as string,
        status: u.status as string,
      });
    }

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SUBSCRIPTION_UPDATED,
      entityType: "Subscription",
      entityId: subscriptionId,
      before,
      after: update,
      request,
    });

    return successResponse({ subscription: updated }, "Subscription updated successfully.");
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to update subscription.", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { subscriptionId } = await params;
    const subscription = await Subscription.findOne({ subscriptionId });
    if (!subscription) return errorResponse("Subscription not found.", 404);

    await Subscription.updateOne({ subscriptionId }, { $set: { status: "cancelled" } });

    const latestForSalon = await Subscription.findOne({ salonId: subscription.salonId })
      .sort({ createdAt: -1 })
      .select("subscriptionId")
      .lean();

    if (latestForSalon && (latestForSalon as Record<string, unknown>).subscriptionId === subscriptionId) {
      await syncSalonSubscriptionState({
        salonId: subscription.salonId,
        planCode: subscription.planCode,
        status: "cancelled",
      });
    }

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SUBSCRIPTION_CANCELLED,
      entityType: "Subscription",
      entityId: subscriptionId,
      before: { status: subscription.status },
      after: { status: "cancelled" },
      request,
    });

    return successResponse(null, "Subscription cancelled successfully.");
  } catch {
    return errorResponse("Unable to cancel subscription.", 500);
  }
}
