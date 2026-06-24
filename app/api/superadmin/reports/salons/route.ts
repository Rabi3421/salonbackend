import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { getDateRange } from "@/src/lib/reports/date-range";
import { Salon } from "@/src/models/Salon";

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

    const [totalSalons, newSalonsInRange, statusAgg, cityAgg, stateAgg, businessTypeAgg, recent] = await Promise.all([
      Salon.countDocuments(),
      Salon.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Salon.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$accountStatus", count: { $sum: 1 } } }]),
      Salon.aggregate<{ _id: string; count: number }>([{ $match: { city: { $ne: "" } } }, { $group: { _id: "$city", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 15 }]),
      Salon.aggregate<{ _id: string; count: number }>([{ $match: { state: { $ne: "" } } }, { $group: { _id: "$state", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 15 }]),
      Salon.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$businessType", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Salon.find({ createdAt: { $gte: startDate, $lte: endDate } }).sort({ createdAt: -1 }).limit(10).select("salonId name city accountStatus createdAt").lean(),
    ]);

    const statusBreakdown: Record<string, number> = {};
    for (const s of statusAgg) statusBreakdown[s._id] = s.count;

    return successResponse({
      range: { range, label, startDate, endDate },
      totalSalons,
      newSalonsInRange,
      statusBreakdown,
      cityBreakdown: cityAgg.map((c) => ({ city: c._id, count: c.count })),
      stateBreakdown: stateAgg.map((s) => ({ state: s._id, count: s.count })),
      businessTypeBreakdown: businessTypeAgg.map((b) => ({ businessType: b._id, count: b.count })),
      recentlyCreatedSalons: recent,
    });
  } catch { return errorResponse("Unable to load salon report.", 500); }
}
