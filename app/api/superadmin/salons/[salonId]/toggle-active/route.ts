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
    const salon = await Salon.findOne({ salonId });
    if (!salon) return errorResponse("Salon not found.", 404);

    const currentlyActive = salon.isActive;
    const newActive = !currentlyActive;

    const newStatus = newActive ? "active" : "blocked";

    await Salon.updateOne(
      { salonId },
      {
        $set: {
          isActive: newActive,
          accountStatus: newStatus,
          accessStatus: newStatus,
          subscriptionStatus: newStatus,
          ...(newActive
            ? { blockedAt: null, blockedReason: "" }
            : { blockedAt: new Date(), blockedReason: "Deactivated by superadmin" }),
        },
      },
    );

    await Subscription.findOneAndUpdate(
      { salonId },
      {
        $set: {
          status: newStatus,
          accessStatus: newStatus,
          ...(newActive
            ? { reactivatedAt: new Date(), reactivationReason: "Activated by superadmin" }
            : { suspendedAt: new Date(), suspensionReason: "Deactivated by superadmin" }),
        },
      },
      { sort: { createdAt: -1 } },
    );

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SALON_UPDATED,
      entityType: "Salon",
      entityId: salonId,
      after: { isActive: newActive, accountStatus: newStatus },
      request,
    });

    return successResponse(
      { salonId, isActive: newActive, accountStatus: newStatus },
      newActive ? "Salon activated." : "Salon deactivated.",
    );
  } catch {
    return errorResponse("Unable to toggle salon status.", 500);
  }
}
