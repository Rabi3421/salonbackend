import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { getDateRange } from "@/src/lib/reports/date-range";
import { Payment } from "@/src/models/Payment";
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

    const match = { createdAt: { $gte: startDate, $lte: endDate } };

    const [statusAgg, methodAgg, monthlyAgg, topSalonsAgg] = await Promise.all([
      Payment.aggregate<{ _id: string; count: number; total: number }>([
        { $match: match },
        { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$amount" } } },
      ]),
      Payment.aggregate<{ _id: string; count: number; total: number }>([
        { $match: { ...match, status: "paid" } },
        { $group: { _id: "$method", count: { $sum: 1 }, total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
      ]),
      Payment.aggregate<{ _id: { y: number; m: number }; count: number; total: number }>([
        { $match: { ...match, status: "paid" } },
        { $group: { _id: { y: { $year: "$paidAt" }, m: { $month: "$paidAt" } }, count: { $sum: 1 }, total: { $sum: "$amount" } } },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
      ]),
      Payment.aggregate<{ _id: string; total: number; count: number }>([
        { $match: { ...match, status: "paid" } },
        { $group: { _id: "$salonId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const summary: Record<string, number> = { totalPaid: 0, totalPending: 0, totalRefunded: 0, paidCount: 0, pendingCount: 0, refundedCount: 0 };
    for (const s of statusAgg) {
      if (s._id === "paid") { summary.totalPaid = s.total; summary.paidCount = s.count; }
      else if (s._id === "pending") { summary.totalPending = s.total; summary.pendingCount = s.count; }
      else if (s._id === "refunded") { summary.totalRefunded = s.total; summary.refundedCount = s.count; }
    }

    const methodBreakdown = methodAgg.map((m) => ({ method: m._id, count: m.count, amount: m.total }));

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyBreakdown = monthlyAgg.map((m) => ({
      label: `${months[m._id.m - 1]} ${m._id.y}`,
      amount: m.total,
      count: m.count,
    }));

    const salonIds = topSalonsAgg.map((s) => s._id);
    const salons = salonIds.length > 0 ? await Salon.find({ salonId: { $in: salonIds } }).select("salonId name").lean() : [];
    const salonMap = new Map(salons.map((s) => [s.salonId as string, (s as Record<string, unknown>).name as string]));

    const topPayingSalons = topSalonsAgg.map((s) => ({
      salonId: s._id,
      salonName: salonMap.get(s._id) ?? s._id,
      amount: s.total,
      paymentCount: s.count,
    }));

    return successResponse({
      range: { range, label, startDate, endDate },
      ...summary,
      methodBreakdown,
      monthlyBreakdown,
      topPayingSalons,
    });
  } catch { return errorResponse("Unable to load revenue report.", 500); }
}
