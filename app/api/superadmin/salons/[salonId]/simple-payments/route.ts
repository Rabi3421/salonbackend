import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { generatePaymentId } from "@/src/lib/generators/payment-id";
import {
  getNextDueDateAfter,
  getGraceEndDateForDueDate,
} from "@/src/lib/simple-subscription-policy";
import { Salon } from "@/src/models/Salon";
import { Subscription } from "@/src/models/Subscription";
import { Payment } from "@/src/models/Payment";

const VALID_MODES = ["upi", "cash", "bank_transfer", "card", "cheque", "other"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ salonId: string }> },
) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { salonId } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      return errorResponse("Amount must be a positive number.", 400);
    }

    const paymentMode = String(body.paymentMode ?? body.method ?? "other");
    if (!VALID_MODES.includes(paymentMode)) {
      return errorResponse(`Payment mode must be one of: ${VALID_MODES.join(", ")}`, 400);
    }

    const salon = await Salon.findOne({ salonId }).lean();
    if (!salon) return errorResponse("Salon not found.", 404);

    const subscription = await Subscription.findOne({ salonId }).sort({ createdAt: -1 });
    if (!subscription) return errorResponse("Subscription not found.", 404);

    const paymentDate = body.paymentDate ? new Date(String(body.paymentDate)) : new Date();
    const paymentId = await generatePaymentId();
    const nextDueDate = getNextDueDateAfter(paymentDate);
    const graceEndDate = getGraceEndDateForDueDate(nextDueDate);

    const billingMonth = paymentDate.getMonth() + 1;
    const billingYear = paymentDate.getFullYear();

    const payment = await Payment.create({
      paymentId,
      salonId,
      subscriptionId: subscription.subscriptionId,
      amount,
      method: paymentMode,
      status: "paid",
      transactionId: String(body.transactionId ?? ""),
      referenceNote: String(body.notes ?? ""),
      paidAt: paymentDate,
      receiptNumber: paymentId,
      billingMonth,
      billingYear,
      notes: String(body.notes ?? ""),
      recordedBy: superadmin.email,
    });

    await Subscription.updateOne(
      { _id: subscription._id },
      {
        $set: {
          status: "active",
          accessStatus: "active",
          paymentStatus: "paid",
          billingCycle: "monthly",
          lastPaidAt: paymentDate,
          lastPaymentId: paymentId,
          nextDueDate,
          nextGraceEndDate: graceEndDate,
          nextBillingDate: nextDueDate,
          reactivatedAt: paymentDate,
        },
      },
    );

    await Salon.updateOne(
      { salonId },
      {
        $set: {
          subscriptionStatus: "active",
          accountStatus: "active",
          accessStatus: "active",
          isActive: true,
          lastPaymentDate: paymentDate,
          nextDueDate,
          nextBillingDate: nextDueDate,
          graceEndDate,
          blockedAt: null,
          blockedReason: "",
        },
      },
    );

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.PAYMENT_CREATED,
      entityType: "Payment",
      entityId: paymentId,
      after: { paymentId, salonId, amount, paymentMode },
      request,
    });

    return successResponse(
      {
        payment: {
          paymentId: payment.paymentId,
          salonId,
          amount: payment.amount,
          paymentMode,
          paymentStatus: "paid",
          paymentDate: paymentDate.toISOString(),
          transactionId: payment.transactionId,
          receiptNumber: payment.receiptNumber,
          notes: String(body.notes ?? ""),
          billingMonth,
          billingYear,
          recordedBy: superadmin.email,
        },
        subscription: {
          subscriptionStatus: "active",
          isActive: true,
          lastPaymentDate: paymentDate.toISOString(),
          nextDueDate: nextDueDate.toISOString(),
          graceEndDate: graceEndDate.toISOString(),
        },
      },
      "Payment recorded and subscription activated.",
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON.", 400);
    console.error("Record payment error:", (error as Error).message);
    return errorResponse("Unable to record payment.", 500);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ salonId: string }> },
) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { salonId } = await params;
    const salon = await Salon.findOne({ salonId }).lean();
    if (!salon) return errorResponse("Salon not found.", 404);

    const payments = await Payment.find({ salonId })
      .sort({ paidAt: -1, createdAt: -1 })
      .lean();

    return successResponse({
      payments: payments.map((p) => {
        const obj = p as Record<string, unknown>;
        return {
          paymentId: obj.paymentId,
          salonId: obj.salonId,
          amount: obj.amount,
          paymentMode: obj.method,
          paymentStatus: obj.status,
          paymentDate: obj.paidAt ?? obj.createdAt ?? null,
          transactionId: obj.transactionId ?? "",
          receiptNumber: obj.receiptNumber ?? "",
          notes: obj.notes ?? obj.referenceNote ?? "",
          billingMonth: obj.billingMonth,
          billingYear: obj.billingYear,
          recordedBy: obj.recordedBy ?? "",
          createdAt: obj.createdAt,
        };
      }),
    });
  } catch {
    return errorResponse("Unable to fetch payments.", 500);
  }
}
