import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { getDateRange } from "@/src/lib/reports/date-range";
import { Salon } from "@/src/models/Salon";
import { Payment } from "@/src/models/Payment";
import { Enquiry } from "@/src/models/Enquiry";
import { Subscription } from "@/src/models/Subscription";

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

    const [
      totalSalons, newSalonsInRange, activeSalons, trialSalons, expiredSalons, suspendedSalons, cancelledSalons,
      revenueInRange, revenueAllTime, pendingAmountAgg, paidInRange, pendingPayments,
      newEnquiriesInRange, openEnquiries, activeSubscriptions, expiringTrials,
    ] = await Promise.all([
      Salon.countDocuments(),
      Salon.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Salon.countDocuments({ accountStatus: "active" }),
      Salon.countDocuments({ accountStatus: "trial" }),
      Salon.countDocuments({ accountStatus: "expired" }),
      Salon.countDocuments({ accountStatus: "suspended" }),
      Salon.countDocuments({ accountStatus: "cancelled" }),
      Payment.aggregate<{ t: number }>([{ $match: { status: "paid", paidAt: { $gte: startDate, $lte: endDate } } }, { $group: { _id: null, t: { $sum: "$amount" } } }]),
      Payment.aggregate<{ t: number }>([{ $match: { status: "paid" } }, { $group: { _id: null, t: { $sum: "$amount" } } }]),
      Payment.aggregate<{ t: number }>([{ $match: { status: "pending" } }, { $group: { _id: null, t: { $sum: "$amount" } } }]),
      Payment.countDocuments({ status: "paid", paidAt: { $gte: startDate, $lte: endDate } }),
      Payment.countDocuments({ status: "pending" }),
      Enquiry.countDocuments({ status: "new", createdAt: { $gte: startDate, $lte: endDate } }),
      Enquiry.countDocuments({ status: { $in: ["new", "in_progress"] } }),
      Subscription.countDocuments({ status: "active" }),
      Salon.countDocuments({ accountStatus: "trial", trialEndDate: { $gte: now, $lte: sevenDays } }),
    ]);

    return successResponse({
      range: { range, label, startDate, endDate },
      totalSalons, newSalonsInRange, activeSalons, trialSalons, expiredSalons, suspendedSalons, cancelledSalons,
      totalRevenueInRange: revenueInRange[0]?.t ?? 0,
      totalRevenueAllTime: revenueAllTime[0]?.t ?? 0,
      pendingPaymentAmount: pendingAmountAgg[0]?.t ?? 0,
      paidPaymentsInRange: paidInRange,
      pendingPayments,
      newEnquiriesInRange, openEnquiries, activeSubscriptions, expiringTrialsNext7Days: expiringTrials,
    });
  } catch { return errorResponse("Unable to load overview report.", 500); }
}
