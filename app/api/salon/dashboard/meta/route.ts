import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { buildSubscriptionPayload } from "@/src/lib/subscription-access-service";

export async function GET(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist", "stylist", "accountant"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    return successResponse({
      salon: {
        salonId: auth.salon.salonId,
        name: auth.salon.name,
        websiteStatus: auth.salon.websiteStatus,
        accountStatus: auth.salon.accountStatus,
        accessStatus: auth.salon.accessStatus,
      },
      user: {
        ...auth.user,
        role: auth.frontendRole,
      },
      subscription: buildSubscriptionPayload(auth.subscription ?? null),
      subscriptionWarning: auth.subscriptionWarning ?? "",
    });
  } catch {
    return errorResponse("Unable to load dashboard meta.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
