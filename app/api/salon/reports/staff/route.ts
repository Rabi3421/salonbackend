import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { parseReportDateRange } from "@/src/lib/reports/salon-report-date";
import { SalonStaff } from "@/src/models/SalonStaff";
import { SalonAppointment } from "@/src/models/SalonAppointment";

export async function GET(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;
    const url = new URL(request.url);
    const { startDate, endDate, label } = parseReportDateRange(url);

    const [staffMembers, rangeApts] = await Promise.all([
      SalonStaff.find({ salonId })
        .select("name role designation status rating")
        .lean(),
      SalonAppointment.find({
        salonId,
        date: { $gte: startDate, $lte: endDate },
      })
        .select("stylist status totalAmount")
        .lean(),
    ]);

    const staff = staffMembers as {
      _id: unknown;
      name: string;
      role: string;
      designation: string;
      status: string;
      rating: number;
    }[];

    const apts = rangeApts as {
      stylist?: { id?: string; name?: string };
      status: string;
      totalAmount: number;
    }[];

    const activeCount = staff.filter((s) => s.status === "active").length;
    const onLeaveCount = staff.filter((s) => s.status === "on_leave").length;
    const inactiveCount = staff.filter((s) => s.status === "inactive").length;

    // Build performance per staff member
    const staffPerformance = staff.map((s) => {
      const staffId = String(s._id);
      const myApts = apts.filter(
        (a) => a.stylist?.id === staffId || a.stylist?.name === s.name,
      );
      const completedApts = myApts.filter((a) => a.status === "completed");
      const cancelledApts = myApts.filter((a) => a.status === "cancelled");
      const revenue = completedApts.reduce((sum, a) => sum + (a.totalAmount ?? 0), 0);

      return {
        staffId,
        name: s.name,
        role: s.role,
        designation: s.designation,
        status: s.status,
        appointments: myApts.length,
        completedAppointments: completedApts.length,
        cancelledAppointments: cancelledApts.length,
        revenue,
        rating: s.rating ?? 0,
      };
    });

    const totalCompletedServices = staffPerformance.reduce(
      (s, p) => s + p.completedAppointments, 0,
    );
    const totalStaffRevenue = staffPerformance.reduce((s, p) => s + p.revenue, 0);

    const workloadBreakdown = staffPerformance
      .filter((p) => p.appointments > 0)
      .sort((a, b) => b.appointments - a.appointments)
      .map((p) => ({ name: p.name, appointments: p.appointments }));

    const report = {
      range: label,
      dateFrom: startDate.toISOString(),
      dateTo: endDate.toISOString(),
      generatedAt: new Date().toISOString(),
      summary: {
        totalStaff: staff.length,
        activeStaff: activeCount,
        onLeaveStaff: onLeaveCount,
        totalCompletedServices,
        totalStaffRevenue,
      },
      staffPerformance: staffPerformance.sort(
        (a, b) => b.completedAppointments - a.completedAppointments,
      ),
      workloadBreakdown,
      attendanceSnapshot: {
        active: activeCount,
        onLeave: onLeaveCount,
        inactive: inactiveCount,
      },
    };

    return successResponse({ report, ...report });
  } catch {
    return errorResponse("Unable to generate staff report.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
