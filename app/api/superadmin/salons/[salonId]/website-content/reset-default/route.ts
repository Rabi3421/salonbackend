import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { Salon } from "@/src/models/Salon";
import { resetWebsiteContentToDefault } from "@/src/lib/salon-website-content-service";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";

type RouteContext = { params: Promise<{ salonId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { salonId } = await context.params;

    const body = (await request.json()) as Record<string, unknown>;

    if (body.confirm !== true) {
      return errorResponse(
        "Confirmation required. Send { \"confirm\": true } to reset.",
        400,
      );
    }

    const salon = await Salon.findOne({ salonId }).lean();
    if (!salon) return errorResponse("Salon not found.", 404);

    const salonObj = salon as Record<string, unknown>;

    const content = await resetWebsiteContentToDefault(
      salonId,
      {
        salonId,
        name: String(salonObj.name ?? ""),
        ownerName: String(salonObj.ownerName ?? ""),
        ownerEmail: String(salonObj.ownerEmail ?? ""),
        ownerPhone: String(salonObj.ownerPhone ?? ""),
        city: String(salonObj.city ?? ""),
        state: String(salonObj.state ?? ""),
        address: String(salonObj.address ?? ""),
        logoUrl: String(salonObj.logoUrl ?? ""),
        businessType: String(salonObj.businessType ?? ""),
      },
      String(superadmin._id),
    );

    if (!content) {
      return errorResponse("Website content not found.", 404);
    }

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.WEBSITE_CONTENT_RESET,
      entityType: "SalonWebsiteContent",
      entityId: salonId,
      after: { salonId, action: "reset_to_default" },
      request,
    });

    return successResponse(
      { content },
      "Website content reset to default successfully.",
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to reset website content.", 500);
  }
}
