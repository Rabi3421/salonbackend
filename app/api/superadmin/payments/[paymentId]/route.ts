import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { validateUpdatePayment } from "@/src/lib/validators/payment";
import { getPaymentAuditAction, syncSubscriptionAfterPayment } from "@/src/lib/payment-utils";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Payment } from "@/src/models/Payment";
import { Salon } from "@/src/models/Salon";
import { Subscription } from "@/src/models/Subscription";

type RouteParams = { params: Promise<{ paymentId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { paymentId } = await params;
    const payment = await Payment.findOne({ paymentId }).lean();
    if (!payment) return errorResponse("Payment not found.", 404);

    const payObj = payment as Record<string, unknown>;
    const [salon, subscription] = await Promise.all([
      Salon.findOne({ salonId: payObj.salonId }).select("salonId name ownerName ownerEmail ownerPhone city").lean(),
      payObj.subscriptionId
        ? Subscription.findOne({ subscriptionId: payObj.subscriptionId }).select("subscriptionId planCode billingCycle status amount").lean()
        : null,
    ]);

    return successResponse({ payment, salon, subscription });
  } catch {
    return errorResponse("Unable to fetch payment.", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { paymentId } = await params;
    const payment = await Payment.findOne({ paymentId });
    if (!payment) return errorResponse("Payment not found.", 404);

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateUpdatePayment(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;
    const before = payment.toObject();
    const update: Record<string, unknown> = {};

    if (input.amount !== undefined) update.amount = input.amount;
    if (input.method !== undefined) update.method = input.method;
    if (input.status !== undefined) update.status = input.status;
    if (input.transactionId !== undefined) update.transactionId = input.transactionId;
    if (input.referenceNote !== undefined) update.referenceNote = input.referenceNote;
    if (input.paidAt !== undefined) update.paidAt = input.paidAt;

    const updated = await Payment.findOneAndUpdate(
      { paymentId },
      { $set: update },
      { new: true },
    ).lean();

    const newStatus = (input.status ?? payment.status) as string;
    if (input.status && payment.subscriptionId) {
      await syncSubscriptionAfterPayment({
        subscriptionId: payment.subscriptionId,
        salonId: payment.salonId,
        status: newStatus,
        paymentId,
        paidAt: input.paidAt ?? payment.paidAt ?? new Date(),
      });
    }

    const auditAction = input.status
      ? getPaymentAuditAction(input.status)
      : AUDIT_ACTIONS.PAYMENT_UPDATED;

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: auditAction,
      entityType: "Payment",
      entityId: paymentId,
      before,
      after: update,
      request,
    });

    return successResponse({ payment: updated }, "Payment updated successfully.");
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to update payment.", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { paymentId } = await params;
    const payment = await Payment.findOne({ paymentId });
    if (!payment) return errorResponse("Payment not found.", 404);

    let reason = "";
    try {
      const body = (await request.json()) as { reason?: string; status?: string };
      reason = body.reason ?? "";
      if (body.status === "refunded") {
        await Payment.updateOne({ paymentId }, { $set: { status: "refunded", referenceNote: (payment.referenceNote || "") + (reason ? ` | Refunded: ${reason}` : "") } });
      } else {
        await Payment.updateOne({ paymentId }, { $set: { status: "failed", referenceNote: (payment.referenceNote || "") + (reason ? ` | Cancelled: ${reason}` : "") } });
      }
    } catch {
      await Payment.updateOne({ paymentId }, { $set: { status: "failed" } });
    }

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.PAYMENT_CANCELLED,
      entityType: "Payment",
      entityId: paymentId,
      before: { status: payment.status },
      after: { status: "failed", reason },
      request,
    });

    return successResponse(null, "Payment cancelled successfully.");
  } catch {
    return errorResponse("Unable to cancel payment.", 500);
  }
}
