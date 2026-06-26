import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { evaluateSalonSubscriptionAccess } from "@/src/lib/subscription-access-service";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Subscription } from "@/src/models/Subscription";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const candidates = await Subscription.find({
      accessStatus: { $in: ["trial", "active", "payment_due", "grace_period"] },
    }).lean();

    let count = 0;

    for (const sub of candidates) {
      const subObj = sub as Record<string, unknown>;
      const before = String(subObj.accessStatus || subObj.status);
      const evaluated = await evaluateSalonSubscriptionAccess(String(subObj.salonId));
      const after = String(evaluated?.accessStatus || evaluated?.status || before);

      if (before !== after) count++;
    }

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SUBSCRIPTION_EXPIRED_CHECK,
      entityType: "Subscription",
      entityId: "batch",
      after: { updatedCount: count },
      request,
    });

    return successResponse(
      { updatedCount: count },
      count > 0 ? `${count} subscription(s) updated.` : "No subscription access changes found.",
    );
  } catch {
    return errorResponse("Unable to check expired subscriptions.", 500);
  }
}
