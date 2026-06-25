import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { getDashboardOverviewByRole } from "@/src/lib/dashboard/salon-overview";

export async function GET(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist", "stylist", "accountant"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;
    const salonName = String(auth.salon.name ?? "");

    const overview = await getDashboardOverviewByRole(
      salonId,
      salonName,
      auth.user,
      auth.frontendRole,
    );

    return successResponse({
      ...overview,
    });
  } catch {
    return errorResponse("Unable to load dashboard overview.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
