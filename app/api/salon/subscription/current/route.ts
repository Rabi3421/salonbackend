import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import {
  buildSubscriptionPayload,
  getLatestSubscriptionForSalon,
} from "@/src/lib/subscription-access-service";

export async function GET(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager"],
      allowBlockedAccess: true,
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = String(auth.salon.salonId);
    const subscription = auth.subscription ?? await getLatestSubscriptionForSalon(salonId);
    const payload = buildSubscriptionPayload(subscription as Record<string, unknown> | null);

    if (!payload) return errorResponse("Subscription not found.", 404);

    return successResponse({
      ...payload,
      paymentInstructions: {
        upiId: "",
        accountName: "SalonFlow",
        note: "Please pay before 10th to avoid access block.",
      },
    });
  } catch {
    return errorResponse("Unable to load subscription.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
