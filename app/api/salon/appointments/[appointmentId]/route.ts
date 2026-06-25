import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateUpdateAppointmentPayload } from "@/src/lib/validators/salon-appointment";
import { serializeAppointment } from "@/src/lib/serializers/salon-appointment";
import {
  calculateTotal,
  calculateEndTime,
  isStylistAssigned,
} from "@/src/lib/appointments/appointment-utils";
import { SalonAppointment } from "@/src/models/SalonAppointment";
import { SalonCustomer } from "@/src/models/SalonCustomer";
import { SalonService } from "@/src/models/SalonService";
import { SalonStaff } from "@/src/models/SalonStaff";

type RouteContext = { params: Promise<{ appointmentId: string }> };

export async function GET(request: Request, context: RouteContext) {
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

    const appointment = await SalonAppointment.findOne({
      _id: appointmentId,
      salonId,
    }).lean();

    if (!appointment)
      return errorResponse("Appointment not found.", 404);

    const aptObj = appointment as Record<string, unknown>;

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

    return successResponse({
      appointment: serializeAppointment(aptObj, auth.frontendRole),
    });
  } catch {
    return errorResponse("Unable to fetch appointment.", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { appointmentId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return errorResponse("Invalid appointment ID.", 400);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateUpdateAppointmentPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;
    const updates: Record<string, unknown> = {};

    // Resolve customer updates
    if (input.customerName || input.customerPhone || input.customerEmail) {
      const existing = await SalonAppointment.findOne({
        _id: appointmentId,
        salonId,
      })
        .select("customer")
        .lean();
      if (!existing) return errorResponse("Appointment not found.", 404);
      const cur = (existing as Record<string, unknown>).customer as Record<
        string,
        unknown
      >;
      updates.customer = {
        id: cur.id ?? "",
        name: input.customerName ?? cur.name,
        phone: input.customerPhone ?? cur.phone,
        email: input.customerEmail ?? cur.email,
      };
    }

    // Resolve service updates
    let serviceSnapshots: {
      id: string;
      name: string;
      price: number;
      duration: number;
      category: string;
    }[] | undefined;

    if (input.serviceIds && input.serviceIds.length > 0) {
      const validIds = input.serviceIds.filter((id) =>
        mongoose.Types.ObjectId.isValid(id),
      );
      const services = await SalonService.find({
        _id: { $in: validIds },
        salonId,
        status: "active",
      })
        .select("name price duration category")
        .lean();
      if (services.length === 0) {
        return errorResponse("No valid active services found.", 400);
      }
      serviceSnapshots = (services as Record<string, unknown>[]).map((s) => ({
        id: String(s._id),
        name: String(s.name ?? ""),
        price: Number(s.price ?? 0),
        duration: Number(s.duration ?? 0),
        category: String(s.category ?? ""),
      }));
      updates.services = serviceSnapshots;
      updates.totalAmount = calculateTotal(serviceSnapshots);
    } else if (input.services && input.services.length > 0) {
      serviceSnapshots = input.services.map((s) => ({
        id: s.id ?? "",
        name: s.name,
        price: s.price,
        duration: s.duration,
        category: s.category ?? "",
      }));
      updates.services = serviceSnapshots;
      updates.totalAmount = calculateTotal(serviceSnapshots);
    }

    // Resolve stylist update
    if (input.stylistId !== undefined) {
      if (
        input.stylistId &&
        mongoose.Types.ObjectId.isValid(input.stylistId)
      ) {
        const staff = await SalonStaff.findOne({
          _id: input.stylistId,
          salonId,
          status: "active",
        })
          .select("name role avatar designation")
          .lean();
        if (staff) {
          const s = staff as Record<string, unknown>;
          updates.stylist = {
            id: String(s._id),
            name: String(s.name ?? ""),
            role: String(s.designation ?? s.role ?? ""),
            avatar: String(s.avatar ?? ""),
          };
        }
      } else if (!input.stylistId) {
        updates.stylist = null;
      }
    }

    if (input.date) updates.date = new Date(input.date);
    if (input.startTime) updates.startTime = input.startTime;
    if (input.notes !== undefined) updates.notes = input.notes;
    if (input.internalNotes !== undefined)
      updates.internalNotes = input.internalNotes;

    // Recalculate endTime if services or startTime changed
    if (serviceSnapshots || input.startTime) {
      const existing = await SalonAppointment.findOne({
        _id: appointmentId,
        salonId,
      })
        .select("startTime services")
        .lean();
      if (existing) {
        const e = existing as Record<string, unknown>;
        const st = input.startTime ?? String(e.startTime ?? "");
        const svcs = serviceSnapshots ??
          (e.services as { duration?: number }[]);
        updates.endTime =
          input.endTime ?? calculateEndTime(st, svcs);
      }
    }
    if (input.endTime) updates.endTime = input.endTime;

    updates.updatedBy = String(auth.user.name ?? "");

    const appointment = await SalonAppointment.findOneAndUpdate(
      { _id: appointmentId, salonId },
      { $set: updates },
      { new: true, runValidators: true },
    ).lean();

    if (!appointment)
      return errorResponse("Appointment not found.", 404);

    return successResponse(
      {
        appointment: serializeAppointment(
          appointment as Record<string, unknown>,
          auth.frontendRole,
        ),
      },
      "Appointment updated successfully.",
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to update appointment.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
