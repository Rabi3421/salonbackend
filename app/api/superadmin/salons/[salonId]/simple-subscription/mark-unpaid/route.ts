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
    const reason = body.reason?.trim() || "Payment due for this month";

    const salon = await Salon.findOne({ salonId }).lean();
    if (!salon) return errorResponse("Salon not found.", 404);

    await Subscription.findOneAndUpdate(
      { salonId },
      {
        $set: {
          status: "unpaid",
          accessStatus: "unpaid",
          paymentStatus: "pending",
        },
      },
      { sort: { createdAt: -1 } },
    );

    await Salon.updateOne(
      { salonId },
      {
        $set: {
          subscriptionStatus: "unpaid",
          accountStatus: "unpaid",
          accessStatus: "unpaid",
          isActive: true,
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
      after: { subscriptionStatus: "unpaid", reason },
      request,
    });

    return successResponse({ salonId, subscriptionStatus: "unpaid", isActive: true }, "Salon marked as unpaid.");
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON.", 400);
    return errorResponse("Unable to mark salon as unpaid.", 500);
  }
}
