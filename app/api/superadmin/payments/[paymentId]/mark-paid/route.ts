import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { syncSubscriptionAfterPayment } from "@/src/lib/payment-utils";
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

    let body: { transactionId?: string; paidAt?: string; referenceNote?: string } = {};
    try { body = (await request.json()) as typeof body; } catch { /* optional */ }

    const update: Record<string, unknown> = {
      status: "paid",
      paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
    };
    if (body.transactionId) update.transactionId = body.transactionId.trim();
    if (body.referenceNote) update.referenceNote = body.referenceNote.trim();

    const before = payment.toObject();

    const updated = await Payment.findOneAndUpdate(
      { paymentId },
      { $set: update },
      { new: true },
    ).lean();

    if (payment.subscriptionId) {
      await syncSubscriptionAfterPayment({
        subscriptionId: payment.subscriptionId,
        salonId: payment.salonId,
        status: "paid",
        paymentId,
        paidAt: update.paidAt as Date,
      });
    }

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.PAYMENT_MARKED_PAID,
      entityType: "Payment",
      entityId: paymentId,
      before: { status: before.status },
      after: update,
      request,
    });

    return successResponse({ payment: updated }, "Payment marked as paid.");
  } catch {
    return errorResponse("Unable to mark payment as paid.", 500);
  }
}
