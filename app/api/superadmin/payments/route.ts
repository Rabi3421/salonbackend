import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { validateCreatePayment } from "@/src/lib/validators/payment";
import { generatePaymentId } from "@/src/lib/generators/payment-id";
import { calculatePaymentSummary, syncSubscriptionAfterPayment } from "@/src/lib/payment-utils";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from "@/src/constants/salon";
import { Payment } from "@/src/models/Payment";
import { Salon } from "@/src/models/Salon";
import { Subscription } from "@/src/models/Subscription";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const url = request.nextUrl;
    const search = url.searchParams.get("search")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";
    const method = url.searchParams.get("method")?.trim() ?? "";
    const salonId = url.searchParams.get("salonId")?.trim() ?? "";
    const subscriptionId = url.searchParams.get("subscriptionId")?.trim() ?? "";
    const dateFrom = url.searchParams.get("dateFrom")?.trim() ?? "";
    const dateTo = url.searchParams.get("dateTo")?.trim() ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(url.searchParams.get("limit") ?? String(DEFAULT_PAGE_LIMIT), 10)));

    const filter: Record<string, unknown> = {};

    if (search) {
      const regex = { $regex: search, $options: "i" };
      filter.$or = [
        { paymentId: regex },
        { salonId: regex },
        { subscriptionId: regex },
        { transactionId: regex },
        { referenceNote: regex },
      ];
    }
    if (status) filter.status = status;
    if (method) filter.method = method;
    if (salonId) filter.salonId = salonId;
    if (subscriptionId) filter.subscriptionId = subscriptionId;
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.$lte = new Date(dateTo + "T23:59:59.999Z");
      filter.createdAt = dateFilter;
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Payment.countDocuments(filter),
    ]);

    const salonIds = [...new Set(payments.map((p) => p.salonId as string))];
    const salons = salonIds.length > 0
      ? await Salon.find({ salonId: { $in: salonIds } }).select("salonId name ownerPhone city").lean()
      : [];
    const salonMap = new Map(salons.map((s) => [s.salonId as string, s]));

    const enriched = payments.map((pay) => {
      const salon = salonMap.get(pay.salonId as string) as Record<string, unknown> | undefined;
      return {
        ...pay,
        salonName: salon?.name ?? "",
        salonPhone: salon?.ownerPhone ?? "",
        salonCity: salon?.city ?? "",
      };
    });

    const summary = await calculatePaymentSummary();

    return successResponse({
      payments: enriched,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      summary,
    });
  } catch {
    return errorResponse("Unable to fetch payments.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateCreatePayment(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;

    const salon = await Salon.findOne({ salonId: input.salonId }).lean();
    if (!salon) return errorResponse("Salon not found.", 404);

    if (input.subscriptionId) {
      const sub = await Subscription.findOne({ subscriptionId: input.subscriptionId, salonId: input.salonId }).lean();
      if (!sub) return errorResponse("Subscription not found or does not belong to this salon.", 404);
    }

    const paymentId = await generatePaymentId();

    const payment = await Payment.create({
      paymentId,
      salonId: input.salonId,
      subscriptionId: input.subscriptionId ?? "",
      amount: input.amount,
      method: input.method,
      status: input.status,
      transactionId: input.transactionId ?? "",
      referenceNote: input.referenceNote ?? "",
      paidAt: input.paidAt ?? null,
    });

    if (input.status === "paid" && input.subscriptionId) {
      await syncSubscriptionAfterPayment({
        subscriptionId: input.subscriptionId,
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
      after: { paymentId, salonId: input.salonId, amount: input.amount, status: input.status },
      request,
    });

    return successResponse({ payment }, "Payment created successfully.", 201);
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to create payment.", 500);
  }
}
