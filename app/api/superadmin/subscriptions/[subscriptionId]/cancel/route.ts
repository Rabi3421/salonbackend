import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { syncSalonSubscriptionState } from "@/src/lib/subscription-utils";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Subscription } from "@/src/models/Subscription";

type RouteParams = { params: Promise<{ subscriptionId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { subscriptionId } = await params;
    const subscription = await Subscription.findOne({ subscriptionId });
    if (!subscription) return errorResponse("Subscription not found.", 404);

    let reason = "";
    try {
      const body = (await request.json()) as { reason?: string };
      reason = body.reason ?? "";
    } catch { /* body optional */ }

    const before = subscription.toObject();

    const notesSuffix = reason ? ` | Cancelled: ${reason}` : "";
    await Subscription.updateOne(
      { subscriptionId },
      { $set: { status: "cancelled", notes: (subscription.notes || "") + notesSuffix } },
    );

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
      before: { status: before.status },
      after: { status: "cancelled", reason },
      request,
    });

    return successResponse(null, "Subscription cancelled successfully.");
  } catch {
    return errorResponse("Unable to cancel subscription.", 500);
  }
}
