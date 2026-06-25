import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateStatusPayload } from "@/src/lib/validators/salon-appointment";
import { serializeAppointment } from "@/src/lib/serializers/salon-appointment";
import {
  canTransitionStatus,
  isStylistAssigned,
} from "@/src/lib/appointments/appointment-utils";
import { SalonAppointment } from "@/src/models/SalonAppointment";
import { SalonCustomer } from "@/src/models/SalonCustomer";

type RouteContext = { params: Promise<{ appointmentId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist", "stylist"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { appointmentId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return errorResponse("Invalid appointment ID.", 400);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateStatusPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const { status: nextStatus, note } = validation.data;

    const appointment = await SalonAppointment.findOne({
      _id: appointmentId,
      salonId,
    }).lean();

    if (!appointment)
      return errorResponse("Appointment not found.", 404);

    const aptObj = appointment as Record<string, unknown>;
    const currentStatus = aptObj.status as string;

    // Stylist restriction: must be assigned
    if (
      auth.frontendRole === "stylist" &&
      !isStylistAssigned(
        String(auth.user.id ?? ""),
        String(auth.user.name ?? ""),
        aptObj,
      )
    ) {
      return errorResponse("Permission denied.", 403);
    }

    // Check valid transition
    if (
      !canTransitionStatus(
        currentStatus as Parameters<typeof canTransitionStatus>[0],
        nextStatus as Parameters<typeof canTransitionStatus>[1],
        auth.frontendRole,
      )
    ) {
      return errorResponse(
        `Cannot transition from "${currentStatus}" to "${nextStatus}".`,
        400,
      );
    }

    const changedBy = String(auth.user.name ?? "");

    const updated = await SalonAppointment.findOneAndUpdate(
      { _id: appointmentId, salonId },
      {
        $set: {
          status: nextStatus,
          updatedBy: changedBy,
        },
        $push: {
          statusHistory: {
            status: nextStatus,
            note,
            changedBy,
            changedAt: new Date(),
          },
        },
      },
      { new: true },
    ).lean();

    if (!updated)
      return errorResponse("Appointment not found.", 404);

    // Auto-update customer totalVisits + lastVisitAt on completion
    if (nextStatus === "completed") {
      const customer = aptObj.customer as { id?: string } | undefined;
      if (customer?.id && mongoose.Types.ObjectId.isValid(customer.id)) {
        await SalonCustomer.updateOne(
          { _id: customer.id, salonId },
          { $inc: { totalVisits: 1 }, $set: { lastVisitAt: new Date() } },
        ).catch(() => {});
      }
    }

    return successResponse(
      {
        appointment: serializeAppointment(
          updated as Record<string, unknown>,
          auth.frontendRole,
        ),
      },
      `Appointment status updated to "${nextStatus}".`,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to update appointment status.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
