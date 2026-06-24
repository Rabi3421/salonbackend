import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import {
  ensureDefaultPlatformSettings,
  getPlatformSettings,
} from "@/src/lib/platform-settings";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const result = await ensureDefaultPlatformSettings();
    const settings = await getPlatformSettings();

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.PLATFORM_SETTINGS_DEFAULTS_ENSURED,
      entityType: "PlatformSettings",
      entityId: "platform",
      after: result,
      request,
    });

    return successResponse(
      { settings, ...result },
      result.created.length > 0
        ? `Defaults ensured. Created: ${result.created.join(", ")}.`
        : "All default settings already exist.",
    );
  } catch {
    return errorResponse("Unable to ensure default settings.", 500);
  }
}
