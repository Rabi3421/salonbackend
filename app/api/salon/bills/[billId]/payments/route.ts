import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateRecordPaymentPayload } from "@/src/lib/validators/salon-billing";
import { serializeBill, serializePayment } from "@/src/lib/serializers/salon-billing";
import { deriveBillStatus } from "@/src/lib/billing/billing-utils";
import { generatePaymentNo } from "@/src/lib/generators/bill-id";
import { SalonBill } from "@/src/models/SalonBill";
import { SalonBillPayment } from "@/src/models/SalonBillPayment";
import { SalonAppointment } from "@/src/models/SalonAppointment";
import { SalonCustomer } from "@/src/models/SalonCustomer";

type RouteContext = { params: Promise<{ billId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "receptionist", "accountant"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { billId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(billId)) {
      return errorResponse("Invalid bill ID.", 400);
    }

    const bill = await SalonBill.findOne({ _id: billId, salonId }).lean();
    if (!bill) return errorResponse("Bill not found.", 404);

    const billObj = bill as Record<string, unknown>;

    if (billObj.status === "cancelled" || billObj.status === "refunded") {
      return errorResponse(
        `Cannot record payment for a ${billObj.status} bill.`,
        400,
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateRecordPaymentPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;
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
      { _id: billId, salonId },
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

    // Update appointment billId/paidAmount if linked
    const appointmentId = String(billObj.appointmentId ?? "");
    if (appointmentId && mongoose.Types.ObjectId.isValid(appointmentId)) {
      await SalonAppointment.updateOne(
        { _id: appointmentId, salonId },
        {
          $set: {
            billId: String(billObj._id),
            paidAmount: newPaidAmount,
          },
        },
      );
    }

    // Auto-update customer totalSpent + dueAmount
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
        bill: updatedBill
          ? serializeBill(updatedBill as Record<string, unknown>)
          : null,
        payment: serializePayment(
          payment.toObject() as Record<string, unknown>,
        ),
      },
      "Payment recorded successfully.",
    );
  } catch (error) {
    if (error instanceof SyntaxError)
      return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to record payment.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
