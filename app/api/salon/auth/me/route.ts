import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { buildSubscriptionPayload } from "@/src/lib/subscription-access-service";

export async function GET(request: Request) {
  try {
    const auth = await requireSalonUser(request);

    if (!auth.success) {
      return errorResponse(auth.error, auth.status);
    }

    return successResponse({
      user: {
        ...auth.user,
        role: auth.frontendRole,
        salonId: auth.salon.salonId,
        isActive: true,
        subscription: buildSubscriptionPayload(auth.subscription ?? null),
        subscriptionWarning: auth.subscriptionWarning ?? "",
      },
    });
  } catch {
    return errorResponse("Unauthorized.", 401);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
