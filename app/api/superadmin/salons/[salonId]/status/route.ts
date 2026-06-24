import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import {
  ACCOUNT_STATUSES,
  WEBSITE_STATUSES,
  type AccountStatus,
  type WebsiteStatus,
} from "@/src/constants/salon";
import { Salon } from "@/src/models/Salon";

type RouteParams = { params: Promise<{ salonId: string }> };

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);

    if (!superadmin) {
      return errorResponse("Unauthorized.", 401);
    }

    const { salonId } = await params;

    const salon = await Salon.findOne({ salonId });

    if (!salon) {
      return errorResponse("Salon not found.", 404);
    }

    const body = (await request.json()) as {
      accountStatus?: string;
      websiteStatus?: string;
      reason?: string;
    };

    if (!body.accountStatus && !body.websiteStatus) {
      return errorResponse(
        "At least one of accountStatus or websiteStatus is required.",
        400,
      );
    }

    if (
      body.accountStatus &&
      !ACCOUNT_STATUSES.includes(body.accountStatus as AccountStatus)
    ) {
      return errorResponse(
        `Invalid accountStatus. Allowed: ${ACCOUNT_STATUSES.join(", ")}`,
        400,
      );
    }

    if (
      body.websiteStatus &&
      !WEBSITE_STATUSES.includes(body.websiteStatus as WebsiteStatus)
    ) {
      return errorResponse(
        `Invalid websiteStatus. Allowed: ${WEBSITE_STATUSES.join(", ")}`,
        400,
      );
    }

    const before = salon.toObject();
    const update: Record<string, unknown> = {};

    if (body.accountStatus) {
      update.accountStatus = body.accountStatus;

      if (
        body.accountStatus === "suspended" ||
        body.accountStatus === "cancelled"
      ) {
        update.isActive = false;
      }

      if (
        body.accountStatus === "active" ||
        body.accountStatus === "trial"
      ) {
        update.isActive = true;
      }

      if (body.accountStatus === "cancelled") {
        update.websiteStatus = "inactive";
      }
    }

    if (body.websiteStatus && update.websiteStatus === undefined) {
      update.websiteStatus = body.websiteStatus;
    }

    const updatedSalon = await Salon.findOneAndUpdate(
      { salonId },
      { $set: update },
      { new: true },
    ).lean();

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SALON_STATUS_UPDATED,
      entityType: "Salon",
      entityId: salonId,
      before,
      after: { ...update, reason: body.reason },
      request,
    });

    return successResponse(
      { salon: updatedSalon },
      "Salon status updated successfully.",
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    return errorResponse("Unable to update salon status.", 500);
  }
}
