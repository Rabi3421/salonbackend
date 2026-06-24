import type { NextRequest } from "next/server";
import mongoose from "mongoose";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { sanitizeAuditData } from "@/src/lib/audit-log";
import { getAuditCategory, getAuditActionLabel } from "@/src/constants/audit-log";
import { AuditLog } from "@/src/models/AuditLog";

type RouteParams = { params: Promise<{ auditLogId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { auditLogId } = await params;

    if (!mongoose.Types.ObjectId.isValid(auditLogId)) {
      return errorResponse("Invalid audit log ID.", 400);
    }

    const log = await AuditLog.findById(auditLogId).lean();
    if (!log) return errorResponse("Audit log not found.", 404);

    const l = log as Record<string, unknown>;

    return successResponse({
      auditLog: {
        ...l,
        before: sanitizeAuditData(l.before),
        after: sanitizeAuditData(l.after),
        category: getAuditCategory(l.action as string),
        actionLabel: getAuditActionLabel(l.action as string),
      },
    });
  } catch {
    return errorResponse("Unable to fetch audit log.", 500);
  }
}
