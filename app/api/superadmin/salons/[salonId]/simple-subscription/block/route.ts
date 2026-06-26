import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Salon } from "@/src/models/Salon";
import { Subscription } from "@/src/models/Subscription";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ salonId: string }> },
) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { salonId } = await params;
    const body = (await request.json()) as { reason?: string };
    const reason = body.reason?.trim() || "Blocked by superadmin";

    const salon = await Salon.findOne({ salonId }).lean();
    if (!salon) return errorResponse("Salon not found.", 404);

    const now = new Date();

    await Subscription.findOneAndUpdate(
      { salonId },
      {
        $set: {
          status: "blocked",
          accessStatus: "blocked",
          suspendedAt: now,
          suspensionReason: reason,
        },
      },
      { sort: { createdAt: -1 } },
    );

    await Salon.updateOne(
      { salonId },
      {
        $set: {
          subscriptionStatus: "blocked",
          accountStatus: "blocked",
          accessStatus: "blocked",
          isActive: false,
          blockedAt: now,
          blockedReason: reason,
        },
      },
    );

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SALON_UPDATED,
      entityType: "Salon",
      entityId: salonId,
      after: { subscriptionStatus: "blocked", reason },
      request,
    });

    return successResponse({ salonId, subscriptionStatus: "blocked", isActive: false }, "Salon blocked.");
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON.", 400);
    return errorResponse("Unable to block salon.", 500);
  }
}
