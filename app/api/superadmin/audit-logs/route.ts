import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { sanitizeAuditData } from "@/src/lib/audit-log";
import { getAuditCategory } from "@/src/constants/audit-log";
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from "@/src/constants/salon";
import { AuditLog } from "@/src/models/AuditLog";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const url = request.nextUrl;
    const search = url.searchParams.get("search")?.trim() ?? "";
    const actorType = url.searchParams.get("actorType")?.trim() ?? "";
    const actorEmail = url.searchParams.get("actorEmail")?.trim() ?? "";
    const action = url.searchParams.get("action")?.trim() ?? "";
    const entityType = url.searchParams.get("entityType")?.trim() ?? "";
    const entityId = url.searchParams.get("entityId")?.trim() ?? "";
    const category = url.searchParams.get("category")?.trim() ?? "";
    const dateFrom = url.searchParams.get("dateFrom")?.trim() ?? "";
    const dateTo = url.searchParams.get("dateTo")?.trim() ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(url.searchParams.get("limit") ?? String(DEFAULT_PAGE_LIMIT), 10)));

    const filter: Record<string, unknown> = {};

    if (search) {
      const regex = { $regex: search, $options: "i" };
      filter.$or = [
        { action: regex },
        { actorEmail: regex },
        { entityType: regex },
        { entityId: regex },
        { ip: regex },
      ];
    }
    if (actorType) filter.actorType = actorType;
    if (actorEmail) filter.actorEmail = { $regex: actorEmail, $options: "i" };
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;
    if (dateFrom || dateTo) {
      const df: Record<string, Date> = {};
      if (dateFrom) df.$gte = new Date(dateFrom);
      if (dateTo) df.$lte = new Date(dateTo + "T23:59:59.999Z");
      filter.createdAt = df;
    }

    if (category) {
      const { AUDIT_ACTIONS } = await import("@/src/constants/modules");
      const matchingActions = Object.values(AUDIT_ACTIONS).filter(
        (a) => getAuditCategory(a) === category,
      );
      if (matchingActions.length > 0) {
        filter.action = { $in: matchingActions };
      }
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    const sanitized = logs.map((log) => {
      const l = log as Record<string, unknown>;
      return {
        ...l,
        before: sanitizeAuditData(l.before),
        after: sanitizeAuditData(l.after),
        category: getAuditCategory(l.action as string),
      };
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayCount, categoryAgg] = await Promise.all([
      AuditLog.countDocuments({ createdAt: { $gte: todayStart } }),
      AuditLog.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$action", count: { $sum: 1 } } },
      ]),
    ]);

    const summary: Record<string, number> = {
      total: 0, today: todayCount,
      auth: 0, salon: 0, plan: 0, subscription: 0,
      payment: 0, enquiry: 0, settings: 0, system: 0,
    };

    for (const row of categoryAgg) {
      const cat = getAuditCategory(row._id);
      summary[cat] = (summary[cat] ?? 0) + row.count;
      summary.total += row.count;
    }

    return successResponse({
      auditLogs: sanitized,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      summary,
    });
  } catch {
    return errorResponse("Unable to fetch audit logs.", 500);
  }
}
