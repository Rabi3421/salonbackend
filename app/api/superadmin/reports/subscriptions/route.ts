import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { getDateRange } from "@/src/lib/reports/date-range";
import { Subscription } from "@/src/models/Subscription";
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

    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 86400000);

    const [total, newInRange, statusAgg, cycleAgg, planAgg, expiringSoon] = await Promise.all([
      Subscription.countDocuments(),
      Subscription.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Subscription.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Subscription.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$billingCycle", count: { $sum: 1 } } }]),
      Subscription.aggregate<{ _id: string; count: number; activeCount: number }>([
        { $group: { _id: "$planCode", count: { $sum: 1 }, activeCount: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } } } },
        { $sort: { count: -1 } },
      ]),
      Subscription.find({ status: { $in: ["trial", "active"] }, endDate: { $gte: now, $lte: sevenDays } })
        .sort({ endDate: 1 }).limit(10).select("subscriptionId salonId planCode status endDate nextBillingDate").lean(),
    ]);

    const statusBreakdown: Record<string, number> = {};
    for (const s of statusAgg) statusBreakdown[s._id] = s.count;

    const cycleBreakdown: Record<string, number> = {};
    for (const c of cycleAgg) cycleBreakdown[c._id] = c.count;

    const salonIds = expiringSoon.map((s) => (s as Record<string, unknown>).salonId as string);
    const salons = salonIds.length > 0 ? await Salon.find({ salonId: { $in: salonIds } }).select("salonId name").lean() : [];
    const salonMap = new Map(salons.map((s) => [s.salonId as string, (s as Record<string, unknown>).name as string]));

    return successResponse({
      range: { range, label, startDate, endDate },
      totalSubscriptions: total,
      newSubscriptionsInRange: newInRange,
      activeSubscriptions: statusBreakdown.active ?? 0,
      trialSubscriptions: statusBreakdown.trial ?? 0,
      expiredSubscriptions: statusBreakdown.expired ?? 0,
      billingCycleBreakdown: cycleBreakdown,
      planBreakdown: planAgg.map((p) => ({ planCode: p._id, count: p.count, activeCount: p.activeCount })),
      expiringSoon: expiringSoon.map((s) => {
        const o = s as Record<string, unknown>;
        return { ...o, salonName: salonMap.get(o.salonId as string) ?? "" };
      }),
    });
  } catch { return errorResponse("Unable to load subscription report.", 500); }
}
