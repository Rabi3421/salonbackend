import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Payment } from "@/src/models/Payment";

type RouteParams = { params: Promise<{ paymentId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { paymentId } = await params;
    const payment = await Payment.findOne({ paymentId });
    if (!payment) return errorResponse("Payment not found.", 404);

    let reason = "";
    try {
      const body = (await request.json()) as { reason?: string };
      reason = body.reason ?? "";
    } catch { /* optional */ }

    const before = payment.toObject();
    const notesSuffix = reason ? ` | Refunded: ${reason}` : "";

    const updated = await Payment.findOneAndUpdate(
      { paymentId },
      { $set: { status: "refunded", referenceNote: (payment.referenceNote || "") + notesSuffix } },
      { new: true },
    ).lean();

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.PAYMENT_REFUNDED,
      entityType: "Payment",
      entityId: paymentId,
      before: { status: before.status },
      after: { status: "refunded", reason },
      request,
    });

    return successResponse({ payment: updated }, "Payment refunded successfully.");
  } catch {
    return errorResponse("Unable to refund payment.", 500);
  }
}
