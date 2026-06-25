import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { parseReportDateRange, getDateBuckets } from "@/src/lib/reports/salon-report-date";
import { percentChange, shapeList } from "@/src/lib/reports/salon-report-utils";
import { SalonBill } from "@/src/models/SalonBill";
import { SalonBillPayment } from "@/src/models/SalonBillPayment";

export async function GET(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "accountant"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;
    const url = new URL(request.url);
    const { startDate, endDate, previousStartDate, previousEndDate, label } =
      parseReportDateRange(url);

    const paymentFilter = { salonId, status: "completed" };
    const billFilter = { salonId, status: { $ne: "cancelled" } };

    const [
      currentPayments,
      previousPayments,
      currentBills,
      pendingBills,
      recentPayments,
    ] = await Promise.all([
      SalonBillPayment.find({
        ...paymentFilter,
        paidAt: { $gte: startDate, $lte: endDate },
      })
        .select("amount mode paidAt billNo customerName customerPhone")
        .lean(),
      SalonBillPayment.find({
        ...paymentFilter,
        paidAt: { $gte: previousStartDate, $lte: previousEndDate },
      })
        .select("amount")
        .lean(),
      SalonBill.find({
        ...billFilter,
        createdAt: { $gte: startDate, $lte: endDate },
      })
        .select("grandTotal paidAmount dueAmount status customer")
        .lean(),
      SalonBill.find({
        salonId,
        status: { $in: ["unpaid", "partially_paid"] },
      })
        .select("dueAmount")
        .lean(),
      SalonBillPayment.find({
        ...paymentFilter,
        paidAt: { $gte: startDate, $lte: endDate },
      })
        .sort({ paidAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const totalCollection = (currentPayments as { amount: number }[]).reduce(
      (s, p) => s + p.amount, 0,
    );
    const previousCollection = (previousPayments as { amount: number }[]).reduce(
      (s, p) => s + p.amount, 0,
    );

    const totalBilled = (currentBills as { grandTotal: number }[]).reduce(
      (s, b) => s + b.grandTotal, 0,
    );
    const pendingDues = (pendingBills as { dueAmount: number }[]).reduce(
      (s, b) => s + b.dueAmount, 0,
    );

    const billsByStatus: Record<string, { count: number; amount: number }> = {};
    for (const b of currentBills as { status: string; grandTotal: number }[]) {
      if (!billsByStatus[b.status]) billsByStatus[b.status] = { count: 0, amount: 0 };
      billsByStatus[b.status].count++;
      billsByStatus[b.status].amount += b.grandTotal;
    }

    const modeMap: Record<string, { amount: number; count: number }> = {};
    for (const p of currentPayments as { mode: string; amount: number }[]) {
      if (!modeMap[p.mode]) modeMap[p.mode] = { amount: 0, count: 0 };
      modeMap[p.mode].amount += p.amount;
      modeMap[p.mode].count++;
    }
    const paymentModeBreakdown = Object.entries(modeMap).map(([mode, data]) => ({
      mode,
      amount: data.amount,
      count: data.count,
      percentage: totalCollection > 0 ? Math.round((data.amount / totalCollection) * 100) : 0,
    }));

    const custMap: Record<string, { name: string; phone: string; amount: number; bills: number }> = {};
    for (const b of currentBills as { customer: { name: string; phone: string }; paidAmount: number }[]) {
      const key = b.customer?.phone ?? "unknown";
      if (!custMap[key]) custMap[key] = { name: b.customer?.name ?? "", phone: key, amount: 0, bills: 0 };
      custMap[key].amount += b.paidAmount;
      custMap[key].bills++;
    }
    const topCustomers = Object.values(custMap).sort((a, b) => b.amount - a.amount).slice(0, 10);

    const buckets = getDateBuckets(startDate, endDate);
    const dailyCollection = buckets.map((bucket) => {
      const dayPayments = (currentPayments as { amount: number; paidAt: Date }[]).filter(
        (p) => new Date(p.paidAt) >= bucket.start && new Date(p.paidAt) <= bucket.end,
      );
      const dayBills = (currentBills as { grandTotal: number; createdAt: Date }[]).filter(
        (b) => new Date(b.createdAt) >= bucket.start && new Date(b.createdAt) <= bucket.end,
      );
      return {
        date: bucket.date,
        collection: dayPayments.reduce((s, p) => s + p.amount, 0),
        billed: dayBills.reduce((s, b) => s + b.grandTotal, 0),
        payments: dayPayments.length,
      };
    });

    const report = {
      range: label,
      dateFrom: startDate.toISOString(),
      dateTo: endDate.toISOString(),
      generatedAt: new Date().toISOString(),
      summary: {
        totalCollection,
        previousCollection,
        collectionChangePercent: percentChange(totalCollection, previousCollection),
        totalBilled,
        pendingDues,
        paidBills: billsByStatus["paid"]?.count ?? 0,
        unpaidBills: billsByStatus["unpaid"]?.count ?? 0,
        partiallyPaidBills: billsByStatus["partially_paid"]?.count ?? 0,
      },
      dailyCollection,
      paymentModeBreakdown,
      billStatusBreakdown: Object.entries(billsByStatus).map(([status, data]) => ({
        status,
        count: data.count,
        amount: data.amount,
      })),
      topCustomers,
      recentPayments: shapeList(recentPayments as Record<string, unknown>[]),
    };

    return successResponse({ report, ...report });
  } catch {
    return errorResponse("Unable to generate revenue report.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
