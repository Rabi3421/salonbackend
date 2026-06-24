import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { validatePlatformSettings } from "@/src/lib/validators/platform-settings";
import {
  getPlatformSettings,
  updatePlatformSettings,
  ensureDefaultPlatformSettings,
} from "@/src/lib/platform-settings";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    await ensureDefaultPlatformSettings();
    const settings = await getPlatformSettings();

    return successResponse({ settings });
  } catch {
    return errorResponse("Unable to fetch platform settings.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validatePlatformSettings(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const before = await getPlatformSettings();

    const settings = await updatePlatformSettings(
      validation.data,
      superadmin.email,
    );

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.PLATFORM_SETTINGS_UPDATED,
      entityType: "PlatformSettings",
      entityId: "platform",
      before,
      after: validation.data,
      request,
    });

    return successResponse({ settings }, "Settings updated successfully.");
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to update platform settings.", 500);
  }
}
