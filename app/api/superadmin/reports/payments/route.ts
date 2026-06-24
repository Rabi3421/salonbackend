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

    const [statusAgg, methodAgg, recent] = await Promise.all([
      Payment.aggregate<{ _id: string; count: number; total: number }>([
        { $match: match },
        { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$amount" } } },
      ]),
      Payment.aggregate<{ _id: string; count: number; total: number }>([
        { $match: match },
        { $group: { _id: "$method", count: { $sum: 1 }, total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
      ]),
      Payment.find(match).sort({ createdAt: -1 }).limit(10).select("paymentId salonId amount status method paidAt createdAt").lean(),
    ]);

    const summary: Record<string, number> = {
      totalPayments: 0, paidPayments: 0, pendingPayments: 0, failedPayments: 0, refundedPayments: 0,
      totalPaidAmount: 0, pendingAmount: 0, failedAmount: 0, refundedAmount: 0,
    };
    for (const s of statusAgg) {
      summary.totalPayments += s.count;
      if (s._id === "paid") { summary.paidPayments = s.count; summary.totalPaidAmount = s.total; }
      else if (s._id === "pending") { summary.pendingPayments = s.count; summary.pendingAmount = s.total; }
      else if (s._id === "failed") { summary.failedPayments = s.count; summary.failedAmount = s.total; }
      else if (s._id === "refunded") { summary.refundedPayments = s.count; summary.refundedAmount = s.total; }
    }

    const salonIds = [...new Set(recent.map((p) => (p as Record<string, unknown>).salonId as string))];
    const salons = salonIds.length > 0 ? await Salon.find({ salonId: { $in: salonIds } }).select("salonId name").lean() : [];
    const salonMap = new Map(salons.map((s) => [s.salonId as string, (s as Record<string, unknown>).name as string]));

    return successResponse({
      range: { range, label, startDate, endDate },
      ...summary,
      statusBreakdown: statusAgg.map((s) => ({ status: s._id, count: s.count, amount: s.total })),
      methodBreakdown: methodAgg.map((m) => ({ method: m._id, count: m.count, amount: m.total })),
      recentPayments: recent.map((p) => {
        const o = p as Record<string, unknown>;
        return { ...o, salonName: salonMap.get(o.salonId as string) ?? "" };
      }),
    });
  } catch { return errorResponse("Unable to load payment report.", 500); }
}
