import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateUpdateBillPayload } from "@/src/lib/validators/salon-billing";
import { serializeBill } from "@/src/lib/serializers/salon-billing";
import { serializePaymentList } from "@/src/lib/serializers/salon-billing";
import { SalonBill } from "@/src/models/SalonBill";
import { SalonBillPayment } from "@/src/models/SalonBillPayment";

type RouteContext = { params: Promise<{ billId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist", "accountant"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { billId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(billId)) {
      return errorResponse("Invalid bill ID.", 400);
    }

    const bill = await SalonBill.findOne({ _id: billId, salonId }).lean();
    if (!bill) return errorResponse("Bill not found.", 404);

    const payments = await SalonBillPayment.find({
      salonId,
      billId: String((bill as Record<string, unknown>)._id),
    })
      .sort({ paidAt: -1 })
      .lean();

    const billObj = serializeBill(bill as Record<string, unknown>);
    billObj.payments = serializePaymentList(
      payments as Record<string, unknown>[],
    );

    return successResponse({ bill: billObj });
  } catch {
    return errorResponse("Unable to fetch bill.", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "accountant"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { billId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(billId)) {
      return errorResponse("Invalid bill ID.", 400);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateUpdateBillPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;

    if (input.status === "cancelled") {
      const existing = await SalonBill.findOne({ _id: billId, salonId })
        .select("status")
        .lean();
      if (!existing) return errorResponse("Bill not found.", 404);
      const curStatus = (existing as Record<string, unknown>).status;
      if (curStatus === "paid" || curStatus === "refunded") {
        return errorResponse(
          `Cannot cancel a bill with status "${curStatus}".`,
          400,
        );
      }
    }

    const updates: Record<string, unknown> = {
      updatedBy: String(auth.user.name ?? ""),
    };
    if (input.notes !== undefined) updates.notes = input.notes;
    if (input.status === "cancelled") {
      updates.status = "cancelled";
      updates.cancelledAt = new Date();
      updates.cancelledBy = String(auth.user.name ?? "");
      updates.cancelReason = input.cancelReason ?? "";
    }

    const bill = await SalonBill.findOneAndUpdate(
      { _id: billId, salonId },
      { $set: updates },
      { new: true },
    ).lean();

    if (!bill) return errorResponse("Bill not found.", 404);

    return successResponse(
      { bill: serializeBill(bill as Record<string, unknown>) },
      input.status === "cancelled"
        ? "Bill cancelled successfully."
        : "Bill updated successfully.",
    );
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to update bill.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
