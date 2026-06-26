import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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

    const subscriptions = await Subscription.find({
      accessStatus: { $in: ["trial", "active", "payment_due", "grace_period"] },
    }).select("salonId").lean();

    const summary = {
      checked: 0,
      active: 0,
      trial: 0,
      paymentDue: 0,
      gracePeriod: 0,
      blocked: 0,
    };

    for (const sub of subscriptions) {
      const salonId = String((sub as Record<string, unknown>).salonId);
      const evaluated = await evaluateSalonSubscriptionAccess(salonId);
      if (!evaluated) continue;

      summary.checked++;
      const status = String(evaluated.accessStatus || evaluated.status);
      if (status === "active") summary.active++;
      if (status === "trial") summary.trial++;
      if (status === "payment_due") summary.paymentDue++;
      if (status === "grace_period") summary.gracePeriod++;
      if (status === "access_blocked") summary.blocked++;
    }

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SUBSCRIPTION_EXPIRED_CHECK,
      entityType: "Subscription",
      entityId: "evaluate-access",
      after: summary,
      request,
    });

    return successResponse(summary, "Subscription access evaluation complete.");
  } catch {
    return errorResponse("Unable to evaluate subscription access.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
