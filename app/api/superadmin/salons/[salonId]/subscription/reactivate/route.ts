import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { reactivateSalonAccess } from "@/src/lib/subscription-access-service";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Salon } from "@/src/models/Salon";

type RouteParams = { params: Promise<{ salonId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { salonId } = await params;
    const salon = await Salon.findOne({ salonId }).lean();
    if (!salon) return errorResponse("Salon not found.", 404);

    let body: { reason?: string } = {};
    try { body = (await request.json()) as typeof body; } catch { /* optional */ }
    const reason = body.reason?.trim() || "Payment received manually";

    const subscription = await reactivateSalonAccess(salonId, reason);
    if (!subscription) return errorResponse("Subscription not found.", 404);

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SUBSCRIPTION_UPDATED,
      entityType: "Salon",
      entityId: salonId,
      before: { accessStatus: (salon as Record<string, unknown>).accessStatus },
      after: { accessStatus: "active", reason },
      request,
    });

    return successResponse({ subscription }, "Salon subscription access reactivated.");
  } catch {
    return errorResponse("Unable to reactivate salon access.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
