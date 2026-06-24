import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { getDateRange } from "@/src/lib/reports/date-range";
import { Enquiry } from "@/src/models/Enquiry";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const url = request.nextUrl;
    const range = url.searchParams.get("range") ?? "this_month";
    const { startDate, endDate, label } = getDateRange({
      range,
      dateFrom: url.searchParams.get("dateFrom") ?? undefined,
      dateTo: url.searchParams.get("dateTo") ?? undefined,
    });

    const match = { createdAt: { $gte: startDate, $lte: endDate } };

    const [total, newInRange, statusAgg, typeAgg, priorityAgg, recent] = await Promise.all([
      Enquiry.countDocuments(),
      Enquiry.countDocuments(match),
      Enquiry.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Enquiry.aggregate<{ _id: string; count: number }>([{ $match: match }, { $group: { _id: "$type", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Enquiry.aggregate<{ _id: string; count: number }>([{ $match: match }, { $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Enquiry.find(match).sort({ createdAt: -1 }).limit(10).select("enquiryId name phone email type priority status salonId createdAt").lean(),
    ]);

    const statusBreakdown: Record<string, number> = {};
    for (const s of statusAgg) statusBreakdown[s._id] = s.count;

    return successResponse({
      range: { range, label, startDate, endDate },
      totalEnquiries: total,
      newEnquiriesInRange: newInRange,
      openEnquiries: (statusBreakdown.new ?? 0) + (statusBreakdown.in_progress ?? 0),
      resolvedEnquiries: statusBreakdown.resolved ?? 0,
      closedEnquiries: statusBreakdown.closed ?? 0,
      spamEnquiries: statusBreakdown.spam ?? 0,
      typeBreakdown: typeAgg.map((t) => ({ type: t._id, count: t.count })),
      priorityBreakdown: priorityAgg.map((p) => ({ priority: p._id, count: p.count })),
      statusBreakdown: statusAgg.map((s) => ({ status: s._id, count: s.count })),
      recentEnquiries: recent,
    });
  } catch { return errorResponse("Unable to load enquiry report.", 500); }
}
