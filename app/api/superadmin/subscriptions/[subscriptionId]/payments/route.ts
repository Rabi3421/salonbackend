import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { validateCreatePayment } from "@/src/lib/validators/payment";
import { generatePaymentId } from "@/src/lib/generators/payment-id";
import { syncSubscriptionAfterPayment } from "@/src/lib/payment-utils";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Payment } from "@/src/models/Payment";
import { Subscription } from "@/src/models/Subscription";

type RouteParams = { params: Promise<{ subscriptionId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { subscriptionId } = await params;
    const payments = await Payment.find({ subscriptionId }).sort({ createdAt: -1 }).lean();

    const totalPaid = payments
      .filter((p) => (p as Record<string, unknown>).status === "paid")
      .reduce((sum, p) => sum + ((p as Record<string, unknown>).amount as number), 0);

    return successResponse({ payments, totalPaid });
  } catch {
    return errorResponse("Unable to fetch subscription payments.", 500);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { subscriptionId } = await params;
    const sub = await Subscription.findOne({ subscriptionId }).lean();
    if (!sub) return errorResponse("Subscription not found.", 404);

    const subObj = sub as Record<string, unknown>;

    const body = (await request.json()) as Record<string, unknown>;
    body.salonId = subObj.salonId;
    body.subscriptionId = subscriptionId;

    const validation = validateCreatePayment(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;
    const paymentId = await generatePaymentId();

    const payment = await Payment.create({
      paymentId,
      salonId: input.salonId,
      subscriptionId,
      amount: input.amount,
      method: input.method,
      status: input.status,
      transactionId: input.transactionId ?? "",
      referenceNote: input.referenceNote ?? "",
      paidAt: input.paidAt ?? null,
    });

    if (input.status === "paid") {
      await syncSubscriptionAfterPayment({
        subscriptionId,
        salonId: input.salonId,
        status: "paid",
      });
    }

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.PAYMENT_CREATED,
      entityType: "Payment",
      entityId: paymentId,
      after: { paymentId, salonId: input.salonId, subscriptionId, amount: input.amount },
      request,
    });

    return successResponse({ payment }, "Payment created successfully.", 201);
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to create payment.", 500);
  }
}
