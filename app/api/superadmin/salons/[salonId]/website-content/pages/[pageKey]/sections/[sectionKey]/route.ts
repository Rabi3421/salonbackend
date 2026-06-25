import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { Salon } from "@/src/models/Salon";
import { updateWebsiteSectionContent } from "@/src/lib/salon-website-content-service";
import {
  validatePageKey,
  getPage,
  getSection,
  type PageKey,
} from "@/src/lib/website-content-utils";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";

type RouteContext = {
  params: Promise<{ salonId: string; pageKey: string; sectionKey: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { salonId, pageKey, sectionKey } = await context.params;

    if (!validatePageKey(pageKey)) {
      return errorResponse(
        "Invalid pageKey. Allowed: home, services, about, gallery, contact, booking.",
        400,
      );
    }

    if (!sectionKey || typeof sectionKey !== "string") {
      return errorResponse("sectionKey is required.", 400);
    }

    const salon = await Salon.findOne({ salonId }).lean();
    if (!salon) return errorResponse("Salon not found.", 404);

    const body = (await request.json()) as Record<string, unknown>;

    const content = await updateWebsiteSectionContent(
      salonId,
      pageKey as PageKey,
      sectionKey,
      body,
      String(superadmin._id),
    );

    if (!content) {
      return errorResponse(
        `Section "${sectionKey}" not found in page "${pageKey}".`,
        404,
      );
    }

    const page = getPage(
      content as { pages?: Array<{ pageKey: string; sections?: Array<{ sectionKey: string }> }> },
      pageKey,
    );
    const section = getSection(page, sectionKey);

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.WEBSITE_CONTENT_UPDATED,
      entityType: "SalonWebsiteContent",
      entityId: salonId,
      after: { pageKey, sectionKey, updated: Object.keys(body) },
      request,
    });

    return successResponse(
      { section },
      "Section updated successfully.",
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to update section.", 500);
  }
}
