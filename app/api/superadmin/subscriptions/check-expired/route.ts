import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { syncSalonSubscriptionState } from "@/src/lib/subscription-utils";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Subscription } from "@/src/models/Subscription";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const now = new Date();

    const expired = await Subscription.find({
      status: { $in: ["trial", "active"] },
      endDate: { $lt: now },
    }).lean();

    let count = 0;

    for (const sub of expired) {
      const subObj = sub as Record<string, unknown>;
      await Subscription.updateOne(
        { subscriptionId: subObj.subscriptionId },
        { $set: { status: "expired" } },
      );

      const latest = await Subscription.findOne({ salonId: subObj.salonId })
        .sort({ createdAt: -1 })
        .select("subscriptionId")
        .lean();

      if (latest && (latest as Record<string, unknown>).subscriptionId === subObj.subscriptionId) {
        await syncSalonSubscriptionState({
          salonId: subObj.salonId as string,
          planCode: subObj.planCode as string,
          status: "expired",
        });
      }

      count++;
    }

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SUBSCRIPTION_EXPIRED_CHECK,
      entityType: "Subscription",
      entityId: "batch",
      after: { expiredCount: count },
      request,
    });

    return successResponse(
      { expiredCount: count },
      count > 0 ? `${count} subscription(s) marked expired.` : "No expired subscriptions found.",
    );
  } catch {
    return errorResponse("Unable to check expired subscriptions.", 500);
  }
}
