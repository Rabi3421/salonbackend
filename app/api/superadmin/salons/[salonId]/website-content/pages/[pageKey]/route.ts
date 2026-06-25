import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { Salon } from "@/src/models/Salon";
import {
  getWebsiteContentBySalonId,
  updateWebsitePageContent,
} from "@/src/lib/salon-website-content-service";
import {
  validatePageKey,
  getPage,
  type PageKey,
} from "@/src/lib/website-content-utils";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";

type RouteContext = { params: Promise<{ salonId: string; pageKey: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { salonId, pageKey } = await context.params;

    if (!validatePageKey(pageKey)) {
      return errorResponse(
        "Invalid pageKey. Allowed: home, services, about, gallery, contact, booking.",
        400,
      );
    }

    const salon = await Salon.findOne({ salonId }).lean();
    if (!salon) return errorResponse("Salon not found.", 404);

    const content = await getWebsiteContentBySalonId(salonId);
    if (!content) {
      return errorResponse("Website content not found.", 404);
    }

    const page = getPage(content as { pages?: Array<{ pageKey: string }> }, pageKey);
    if (!page) {
      return errorResponse(`Page "${pageKey}" not found.`, 404);
    }

    return successResponse({ page }, "Page content fetched successfully.");
  } catch {
    return errorResponse("Unable to fetch page content.", 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { salonId, pageKey } = await context.params;

    if (!validatePageKey(pageKey)) {
      return errorResponse(
        "Invalid pageKey. Allowed: home, services, about, gallery, contact, booking.",
        400,
      );
    }

    const salon = await Salon.findOne({ salonId }).lean();
    if (!salon) return errorResponse("Salon not found.", 404);

    const body = (await request.json()) as Record<string, unknown>;

    const content = await updateWebsitePageContent(
      salonId,
      pageKey as PageKey,
      body,
      String(superadmin._id),
    );

    if (!content) {
      return errorResponse("Website content not found.", 404);
    }

    const updatedPage = getPage(
      content as { pages?: Array<{ pageKey: string }> },
      pageKey,
    );

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.WEBSITE_CONTENT_UPDATED,
      entityType: "SalonWebsiteContent",
      entityId: salonId,
      after: { pageKey, updated: Object.keys(body) },
      request,
    });

    return successResponse(
      { page: updatedPage },
      "Page content updated successfully.",
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to update page content.", 500);
  }
}
