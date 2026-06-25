import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { calculateEndTime, calculateTotal } from "@/src/lib/appointments/appointment-utils";
import { connectDB } from "@/src/lib/db";
import { generateAppointmentNo } from "@/src/lib/generators/appointment-id";
import { serializeAppointment } from "@/src/lib/serializers/salon-appointment";
import { resolveSalonFromRequest } from "@/src/lib/tenant/resolve-salon";
import { validateCreateAppointmentPayload } from "@/src/lib/validators/salon-appointment";
import { SalonAppointment } from "@/src/models/SalonAppointment";

export async function POST(request: Request) {
  try {
    const salonResult = await resolveSalonFromRequest(request);
    if (!salonResult.success) {
      return errorResponse(salonResult.error, salonResult.status);
    }

    await connectDB();

    const salonId = salonResult.salon.salonId as string;
    const body = (await request.json()) as Record<string, unknown>;
    body.source = "website";

    const validation = validateCreateAppointmentPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;
    const services = (input.services ?? []).map((service) => ({
      id: service.id ?? "",
      name: service.name,
      price: service.price,
      duration: service.duration,
      category: service.category ?? "",
    }));

    if (services.length === 0) {
      return errorResponse("At least one service is required.", 400);
    }

    const totalAmount = calculateTotal(services);
    const endTime = input.endTime || calculateEndTime(input.startTime, services);
    const appointmentNo = await generateAppointmentNo(salonId);

    const appointment = await SalonAppointment.create({
      salonId,
      appointmentNo,
      customer: {
        id: "",
        name: input.customerName ?? "",
        phone: input.customerPhone ?? "",
        email: input.customerEmail ?? "",
      },
      services,
      date: new Date(input.date),
      startTime: input.startTime,
      endTime,
      status: "requested",
      source: "website",
      totalAmount,
      notes: input.notes,
      internalNotes: "Created from public website booking form.",
      createdBy: "Public website",
      statusHistory: [
        {
          status: "requested",
          note: "Appointment requested from public website",
          changedBy: "Public website",
          changedAt: new Date(),
        },
      ],
    });

    return successResponse(
      {
        appointment: serializeAppointment(appointment.toObject(), "owner"),
        appointmentNo,
      },
      "Appointment requested successfully.",
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to create appointment.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
