import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { parseReportDateRange, getDateBuckets } from "@/src/lib/reports/salon-report-date";
import { percentChange } from "@/src/lib/reports/salon-report-utils";
import { SalonCustomer } from "@/src/models/SalonCustomer";

export async function GET(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;
    const url = new URL(request.url);
    const { startDate, endDate, previousStartDate, previousEndDate, label } =
      parseReportDateRange(url);

    const [
      allCustomers,
      newCustomers,
      previousNewCount,
    ] = await Promise.all([
      SalonCustomer.find({ salonId })
        .select("name phone status source totalVisits totalSpent dueAmount createdAt")
        .lean(),
      SalonCustomer.find({
        salonId,
        createdAt: { $gte: startDate, $lte: endDate },
      })
        .select("name phone source createdAt")
        .lean(),
      SalonCustomer.countDocuments({
        salonId,
        createdAt: { $gte: previousStartDate, $lte: previousEndDate },
      }),
    ]);

    const customers = allCustomers as {
      _id: unknown;
      name: string;
      phone: string;
      status: string;
      source: string;
      totalVisits: number;
      totalSpent: number;
      dueAmount: number;
      createdAt: Date;
    }[];

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => c.status === "active").length;
    const blockedCustomers = customers.filter((c) => c.status === "blocked").length;
    const repeatCustomers = customers.filter((c) => c.totalVisits > 1).length;
    const oneTimeCustomers = customers.filter(
      (c) => c.totalVisits === 1,
    ).length;

    // Source breakdown
    const sourceCounts: Record<string, number> = {};
    for (const c of customers) {
      sourceCounts[c.source] = (sourceCounts[c.source] ?? 0) + 1;
    }

    // New customers trend
    const newCusts = newCustomers as { createdAt: Date }[];
    const buckets = getDateBuckets(startDate, endDate);
    const newCustomersTrend = buckets.map((bucket) => {
      const count = newCusts.filter(
        (c) => new Date(c.createdAt) >= bucket.start && new Date(c.createdAt) <= bucket.end,
      ).length;
      return { date: bucket.date, count };
    });

    // Top customers by totalSpent
    const topCustomers = customers
      .filter((c) => c.totalSpent > 0 || c.totalVisits > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map((c) => ({
        name: c.name,
        phone: c.phone,
        visits: c.totalVisits,
        totalSpent: c.totalSpent,
        dueAmount: c.dueAmount,
      }));

    const repeatRate =
      totalCustomers > 0
        ? Math.round((repeatCustomers / totalCustomers) * 100)
        : 0;

    const report = {
      range: label,
      dateFrom: startDate.toISOString(),
      dateTo: endDate.toISOString(),
      generatedAt: new Date().toISOString(),
      summary: {
        totalCustomers,
        newCustomers: newCusts.length,
        activeCustomers,
        repeatCustomers,
        blockedCustomers,
        customerGrowthPercent: percentChange(newCusts.length, previousNewCount),
      },
      newCustomersTrend,
      sourceBreakdown: Object.entries(sourceCounts).map(([source, count]) => ({
        source,
        count,
      })),
      topCustomers,
      retentionSnapshot: {
        oneTimeCustomers,
        repeatCustomers,
        repeatRate,
      },
    };

    return successResponse({ report, ...report });
  } catch {
    return errorResponse("Unable to generate customer report.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
