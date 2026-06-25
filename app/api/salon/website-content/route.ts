import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { resolveSalonFromRequest } from "@/src/lib/tenant/resolve-salon";
import { ensureWebsiteContentForSalon } from "@/src/lib/salon-website-content-service";
import {
  sanitizeWebsiteContentForPublic,
  getPage,
  validatePageKey,
} from "@/src/lib/website-content-utils";

export async function GET(request: Request) {
  try {
    const salonResult = await resolveSalonFromRequest(request);
    if (!salonResult.success) {
      return errorResponse(salonResult.error, salonResult.status);
    }

    await connectDB();

    const salon = salonResult.salon;
    const salonId = salon.salonId as string;

    const content = await ensureWebsiteContentForSalon({
      salonId,
      name: String(salon.name ?? ""),
      ownerName: String(salon.ownerName ?? ""),
      ownerEmail: String(salon.ownerEmail ?? ""),
      ownerPhone: String(salon.ownerPhone ?? ""),
      city: String(salon.city ?? ""),
      state: String(salon.state ?? ""),
      address: String(salon.address ?? ""),
      logoUrl: String(salon.logoUrl ?? ""),
      businessType: String(salon.businessType ?? ""),
    });

    if (!content) {
      return errorResponse("Website content not available.", 404);
    }

    const contentObj = content as Record<string, unknown>;

    if (contentObj.status !== "published") {
      return errorResponse("Website content is not published.", 404);
    }

    const safe = sanitizeWebsiteContentForPublic(contentObj);

    const salonSummary = {
      salonId,
      name: String(salon.name ?? ""),
      businessType: String(salon.businessType ?? ""),
      websiteStatus: String(salon.websiteStatus ?? "active"),
    };

    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");

    if (pageParam) {
      if (!validatePageKey(pageParam)) {
        return errorResponse(
          "Invalid page. Allowed: home, services, about, gallery, contact, booking.",
          400,
        );
      }

      const page = getPage(
        safe as { pages?: Array<{ pageKey: string }> },
        pageParam,
      );

      if (!page) {
        return errorResponse(`Page "${pageParam}" not found.`, 404);
      }

      return successResponse(
        { salon: salonSummary, page },
        "Website page content fetched successfully.",
      );
    }

    return successResponse(
      {
        salon: salonSummary,
        content: {
          theme: safe.theme,
          global: safe.global,
          pages: safe.pages,
        },
      },
      "Website content fetched successfully.",
    );
  } catch {
    return errorResponse("Unable to fetch website content.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
