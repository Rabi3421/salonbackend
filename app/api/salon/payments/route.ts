import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateRecordPaymentPayload } from "@/src/lib/validators/salon-billing";
import { serializeBill, serializePayment, serializePaymentList } from "@/src/lib/serializers/salon-billing";
import { deriveBillStatus } from "@/src/lib/billing/billing-utils";
import { generatePaymentNo } from "@/src/lib/generators/bill-id";
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from "@/src/constants/salon";
import { SalonBill } from "@/src/models/SalonBill";
import { SalonBillPayment } from "@/src/models/SalonBillPayment";
import { SalonAppointment } from "@/src/models/SalonAppointment";
import { SalonCustomer } from "@/src/models/SalonCustomer";

export async function GET(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist", "accountant"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;
    const url = new URL(request.url);

    const search = url.searchParams.get("search")?.trim() ?? "";
    const mode = url.searchParams.get("mode")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";
    const dateFrom = url.searchParams.get("dateFrom")?.trim() ?? "";
    const dateTo = url.searchParams.get("dateTo")?.trim() ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      MAX_PAGE_LIMIT,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? String(DEFAULT_PAGE_LIMIT), 10)),
    );

    const filter: Record<string, unknown> = { salonId };

    if (search) {
      filter.$or = [
        { paymentNo: { $regex: search, $options: "i" } },
        { billNo: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
      ];
    }
    if (mode) filter.mode = mode;
    if (status) filter.status = status;

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom && !isNaN(Date.parse(dateFrom))) dateFilter.$gte = new Date(dateFrom);
      if (dateTo && !isNaN(Date.parse(dateTo))) dateFilter.$lte = new Date(dateTo);
      if (Object.keys(dateFilter).length > 0) filter.paidAt = dateFilter;
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      SalonBillPayment.find(filter).sort({ paidAt: -1 }).skip(skip).limit(limit).lean(),
      SalonBillPayment.countDocuments(filter),
    ]);

    return successResponse({
      payments: serializePaymentList(payments as Record<string, unknown>[]),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return errorResponse("Unable to fetch payments.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "receptionist", "accountant"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateRecordPaymentPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;

    if (!input.billId || !mongoose.Types.ObjectId.isValid(input.billId)) {
      return errorResponse("billId is required and must be valid.", 400);
    }

    const bill = await SalonBill.findOne({ _id: input.billId, salonId }).lean();
    if (!bill) return errorResponse("Bill not found.", 404);

    const billObj = bill as Record<string, unknown>;

    if (billObj.status === "cancelled" || billObj.status === "refunded") {
      return errorResponse(`Cannot record payment for a ${billObj.status} bill.`, 400);
    }

    const currentDue = Number(billObj.dueAmount ?? 0);
    if (input.amount > currentDue) {
      return errorResponse(
        `Payment amount (₹${input.amount}) exceeds due amount (₹${currentDue}).`,
        400,
      );
    }

    const paymentNo = await generatePaymentNo(salonId);
    const customer = billObj.customer as Record<string, unknown>;

    const payment = await SalonBillPayment.create({
      salonId,
      paymentNo,
      billId: String(billObj._id),
      billNo: String(billObj.billNo ?? ""),
      customerName: String(customer?.name ?? ""),
      customerPhone: String(customer?.phone ?? ""),
      amount: input.amount,
      mode: input.mode,
      status: "completed",
      paidAt: new Date(),
      referenceNo: input.referenceNo,
      collectedBy: String(auth.user.id ?? ""),
      collectedByName: String(auth.user.name ?? ""),
      notes: input.notes,
    });

    const newPaidAmount = Number(billObj.paidAmount ?? 0) + input.amount;
    const grandTotal = Number(billObj.grandTotal ?? 0);
    const newDueAmount = Math.max(grandTotal - newPaidAmount, 0);
    const newStatus = deriveBillStatus(grandTotal, newPaidAmount);

    const updatedBill = await SalonBill.findOneAndUpdate(
      { _id: input.billId, salonId },
      {
        $set: {
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          status: newStatus,
          paymentMode: input.mode,
          updatedBy: String(auth.user.name ?? ""),
        },
      },
      { new: true },
    ).lean();

    const appointmentId = String(billObj.appointmentId ?? "");
    if (appointmentId && mongoose.Types.ObjectId.isValid(appointmentId)) {
      await SalonAppointment.updateOne(
        { _id: appointmentId, salonId },
        { $set: { billId: String(billObj._id), paidAmount: newPaidAmount } },
      );
    }

    const billCustomer = billObj.customer as { id?: string } | undefined;
    if (billCustomer?.id && mongoose.Types.ObjectId.isValid(billCustomer.id)) {
      await SalonCustomer.updateOne(
        { _id: billCustomer.id, salonId },
        {
          $inc: { totalSpent: input.amount },
          $set: { dueAmount: newDueAmount },
        },
      ).catch(() => {});
    }

    return successResponse(
      {
        bill: updatedBill ? serializeBill(updatedBill as Record<string, unknown>) : null,
        payment: serializePayment(payment.toObject() as Record<string, unknown>),
      },
      "Payment recorded successfully.",
    );
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to record payment.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
