import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { Payment } from "@/src/models/Payment";

export async function GET(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager"],
      allowBlockedAccess: true,
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = String(auth.salon.salonId);
    const payments = await Payment.find({ salonId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return successResponse({
      payments: payments.map((p) => {
        const obj = p as Record<string, unknown>;
        return {
          paymentId: obj.paymentId,
          amount: obj.amount,
          paymentMode: obj.method,
          paymentStatus: obj.status,
          paymentDate: obj.paidAt ?? obj.createdAt,
          receiptNumber: obj.receiptNumber ?? "",
          transactionId: obj.transactionId ?? "",
          notes: obj.notes ?? obj.referenceNote ?? "",
        };
      }),
    });
  } catch {
    return errorResponse("Unable to load subscription payments.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
