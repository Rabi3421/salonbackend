import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { parseReportDateRange, getDateBuckets } from "@/src/lib/reports/salon-report-date";
import { percentChange } from "@/src/lib/reports/salon-report-utils";
import { SalonAppointment } from "@/src/models/SalonAppointment";

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

    const [currentApts, previousCount] = await Promise.all([
      SalonAppointment.find({
        salonId,
        date: { $gte: startDate, $lte: endDate },
      })
        .select("date status source services totalAmount")
        .lean(),
      SalonAppointment.countDocuments({
        salonId,
        date: { $gte: previousStartDate, $lte: previousEndDate },
      }),
    ]);

    const apts = currentApts as {
      date: Date;
      status: string;
      source: string;
      services: { name: string; price: number }[];
      totalAmount: number;
    }[];

    const total = apts.length;
    const completed = apts.filter((a) => a.status === "completed").length;
    const cancelled = apts.filter((a) => a.status === "cancelled").length;
    const noShow = apts.filter((a) => a.status === "no_show").length;

    // Status breakdown
    const statusCounts: Record<string, number> = {};
    for (const a of apts) {
      statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
    }

    // Source breakdown
    const sourceCounts: Record<string, number> = {};
    for (const a of apts) {
      sourceCounts[a.source] = (sourceCounts[a.source] ?? 0) + 1;
    }

    // Top services from embedded snapshots
    const svcMap: Record<string, { name: string; count: number; amount: number }> = {};
    for (const a of apts) {
      for (const s of a.services ?? []) {
        const key = s.name;
        if (!svcMap[key]) svcMap[key] = { name: key, count: 0, amount: 0 };
        svcMap[key].count++;
        svcMap[key].amount += s.price ?? 0;
      }
    }
    const topServices = Object.values(svcMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Daily breakdown
    const buckets = getDateBuckets(startDate, endDate);
    const dailyAppointments = buckets.map((bucket) => {
      const dayApts = apts.filter(
        (a) => new Date(a.date) >= bucket.start && new Date(a.date) <= bucket.end,
      );
      return {
        date: bucket.date,
        total: dayApts.length,
        completed: dayApts.filter((a) => a.status === "completed").length,
        cancelled: dayApts.filter((a) => a.status === "cancelled").length,
        noShow: dayApts.filter((a) => a.status === "no_show").length,
      };
    });

    // Peak days
    const peakDays = dailyAppointments
      .filter((d) => d.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((d) => ({ date: d.date, count: d.total }));

    const report = {
      range: label,
      dateFrom: startDate.toISOString(),
      dateTo: endDate.toISOString(),
      generatedAt: new Date().toISOString(),
      summary: {
        totalAppointments: total,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        noShowAppointments: noShow,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
        previousTotalAppointments: previousCount,
        appointmentChangePercent: percentChange(total, previousCount),
      },
      dailyAppointments,
      statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      })),
      sourceBreakdown: Object.entries(sourceCounts).map(([source, count]) => ({
        source,
        count,
      })),
      topServices,
      peakDays,
    };

    return successResponse({ report, ...report });
  } catch {
    return errorResponse("Unable to generate appointment report.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
