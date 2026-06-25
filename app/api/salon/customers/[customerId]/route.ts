import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateUpdateCustomerPayload } from "@/src/lib/validators/salon-customer";
import { serializeCustomer } from "@/src/lib/serializers/salon-customer";
import { SalonCustomer } from "@/src/models/SalonCustomer";

type RouteContext = { params: Promise<{ customerId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist", "stylist", "accountant"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { customerId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return errorResponse("Invalid customer ID.", 400);
    }

    const customer = await SalonCustomer.findOne({
      _id: customerId,
      salonId,
    }).lean();

    if (!customer) return errorResponse("Customer not found.", 404);

    return successResponse({
      customer: serializeCustomer(
        customer as Record<string, unknown>,
        auth.frontendRole,
      ),
    });
  } catch {
    return errorResponse("Unable to fetch customer.", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { customerId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return errorResponse("Invalid customer ID.", 400);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateUpdateCustomerPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const updates = validation.data;

    // If phone is being changed, check for duplicates within same salon
    if (updates.phone) {
      const duplicate = await SalonCustomer.findOne({
        salonId,
        phone: updates.phone,
        _id: { $ne: customerId },
        status: { $ne: "blocked" },
      })
        .select("_id")
        .lean();

      if (duplicate) {
        return errorResponse(
          `Another customer with phone ${updates.phone} already exists.`,
          409,
        );
      }
    }

    const customer = await SalonCustomer.findOneAndUpdate(
      { _id: customerId, salonId },
      { $set: updates },
      { new: true, runValidators: true },
    ).lean();

    if (!customer) return errorResponse("Customer not found.", 404);

    return successResponse(
      {
        customer: serializeCustomer(
          customer as Record<string, unknown>,
          auth.frontendRole,
        ),
      },
      "Customer updated successfully.",
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to update customer.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
