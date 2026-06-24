import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { ensureDefaultPlans } from "@/src/lib/seed/default-plans";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const result = await ensureDefaultPlans();

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.DEFAULT_PLANS_SEEDED,
      entityType: "Plan",
      entityId: "default-plans",
      after: result,
      request,
    });

    return successResponse(result, "Default plans seeded successfully.", 201);
  } catch {
    return errorResponse("Unable to seed default plans.", 500);
  }
}
