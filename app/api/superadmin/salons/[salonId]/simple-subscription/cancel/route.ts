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
    const reason = body.reason?.trim() || "Cancelled by superadmin";

    const salon = await Salon.findOne({ salonId }).lean();
    if (!salon) return errorResponse("Salon not found.", 404);

    const now = new Date();

    await Subscription.findOneAndUpdate(
      { salonId },
      {
        $set: {
          status: "cancelled",
          accessStatus: "cancelled",
          cancelledAt: now,
          notes: reason,
        },
      },
      { sort: { createdAt: -1 } },
    );

    await Salon.updateOne(
      { salonId },
      {
        $set: {
          subscriptionStatus: "cancelled",
          accountStatus: "cancelled",
          accessStatus: "cancelled",
          isActive: false,
          cancelledAt: now,
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
      after: { subscriptionStatus: "cancelled", reason },
      request,
    });

    return successResponse({ salonId, subscriptionStatus: "cancelled", isActive: false }, "Salon cancelled.");
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON.", 400);
    return errorResponse("Unable to cancel salon.", 500);
  }
}
