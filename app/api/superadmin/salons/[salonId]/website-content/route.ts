import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { Salon } from "@/src/models/Salon";
import {
  ensureWebsiteContentForSalon,
  updateWebsiteTopLevel,
} from "@/src/lib/salon-website-content-service";
import { validateStatus } from "@/src/lib/website-content-utils";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";

type RouteContext = { params: Promise<{ salonId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { salonId } = await context.params;

    const salon = await Salon.findOne({ salonId }).lean();
    if (!salon) return errorResponse("Salon not found.", 404);

    const salonObj = salon as Record<string, unknown>;

    const content = await ensureWebsiteContentForSalon(
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

    return successResponse({ content }, "Website content fetched successfully.");
  } catch {
    return errorResponse("Unable to fetch website content.", 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { salonId } = await context.params;

    const salon = await Salon.findOne({ salonId }).lean();
    if (!salon) return errorResponse("Salon not found.", 404);

    const body = (await request.json()) as Record<string, unknown>;

    if (body.status !== undefined && !validateStatus(body.status)) {
      return errorResponse("Invalid status. Allowed: draft, published.", 400);
    }

    if (body.theme !== undefined && typeof body.theme !== "object") {
      return errorResponse("theme must be an object.", 400);
    }

    if (body.global !== undefined && typeof body.global !== "object") {
      return errorResponse("global must be an object.", 400);
    }

    const content = await updateWebsiteTopLevel(
      salonId,
      body,
      String(superadmin._id),
    );

    if (!content) {
      return errorResponse("Website content not found. Fetch it first to auto-create.", 404);
    }

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.WEBSITE_CONTENT_UPDATED,
      entityType: "SalonWebsiteContent",
      entityId: salonId,
      after: { updated: Object.keys(body) },
      request,
    });

    return successResponse({ content }, "Website content updated successfully.");
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to update website content.", 500);
  }
}
