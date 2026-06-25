import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateCreateAppointmentPayload } from "@/src/lib/validators/salon-appointment";
import { generateAppointmentNo } from "@/src/lib/generators/appointment-id";
import {
  serializeAppointment,
  serializeAppointmentList,
} from "@/src/lib/serializers/salon-appointment";
import {
  calculateTotal,
  calculateEndTime,
} from "@/src/lib/appointments/appointment-utils";
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from "@/src/constants/salon";
import { SalonAppointment } from "@/src/models/SalonAppointment";
import { SalonCustomer } from "@/src/models/SalonCustomer";
import { SalonService } from "@/src/models/SalonService";
import { SalonStaff } from "@/src/models/SalonStaff";

export async function GET(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist", "stylist"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;
    const url = new URL(request.url);

    const search = url.searchParams.get("search")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";
    const date = url.searchParams.get("date")?.trim() ?? "";
    const stylistId = url.searchParams.get("stylistId")?.trim() ?? "";
    const page = Math.max(
      1,
      parseInt(url.searchParams.get("page") ?? "1", 10),
    );
    const limit = Math.min(
      MAX_PAGE_LIMIT,
      Math.max(
        1,
        parseInt(
          url.searchParams.get("limit") ?? String(DEFAULT_PAGE_LIMIT),
          10,
        ),
      ),
    );

    const filter: Record<string, unknown> = { salonId };

    if (search) {
      filter.$or = [
        { "customer.name": { $regex: search, $options: "i" } },
        { "customer.phone": { $regex: search, $options: "i" } },
        { "services.name": { $regex: search, $options: "i" } },
        { appointmentNo: { $regex: search, $options: "i" } },
      ];
    }

    if (status) filter.status = status;

    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        filter.date = { $gte: start, $lte: end };
      }
    }

    if (stylistId) filter["stylist.id"] = stylistId;

    // Stylist restriction: only see own appointments
    if (auth.frontendRole === "stylist") {
      const userId = String(auth.user.id ?? "");
      const userName = String(auth.user.name ?? "");
      filter.$or = [
        { "stylist.id": userId },
        { "stylist.name": userName },
      ];
    }

    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      SalonAppointment.find(filter)
        .sort({ date: 1, startTime: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SalonAppointment.countDocuments(filter),
    ]);

    return successResponse({
      appointments: serializeAppointmentList(
        appointments as Record<string, unknown>[],
        auth.frontendRole,
      ),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return errorResponse("Unable to fetch appointments.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateCreateAppointmentPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;

    // --- Resolve customer ---
    let customerSnapshot: {
      id: string;
      name: string;
      phone: string;
      email: string;
    };

    if (input.existingCustomerId) {
      if (!mongoose.Types.ObjectId.isValid(input.existingCustomerId)) {
        return errorResponse("Invalid customer ID.", 400);
      }
      const customer = await SalonCustomer.findOne({
        _id: input.existingCustomerId,
        salonId,
      })
        .select("name phone email")
        .lean();
      if (!customer)
        return errorResponse("Customer not found.", 404);
      const c = customer as Record<string, unknown>;
      customerSnapshot = {
        id: String(c._id),
        name: String(c.name ?? ""),
        phone: String(c.phone ?? ""),
        email: String(c.email ?? ""),
      };
    } else {
      customerSnapshot = {
        id: "",
        name: input.customerName ?? "",
        phone: input.customerPhone ?? "",
        email: input.customerEmail ?? "",
      };
    }

    // --- Resolve services ---
    let serviceSnapshots: {
      id: string;
      name: string;
      price: number;
      duration: number;
      category: string;
    }[];

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

      serviceSnapshots = (services as Record<string, unknown>[]).map(
        (s) => ({
          id: String(s._id),
          name: String(s.name ?? ""),
          price: Number(s.price ?? 0),
          duration: Number(s.duration ?? 0),
          category: String(s.category ?? ""),
        }),
      );
    } else if (input.services && input.services.length > 0) {
      serviceSnapshots = input.services.map((s) => ({
        id: s.id ?? "",
        name: s.name,
        price: s.price,
        duration: s.duration,
        category: s.category ?? "",
      }));
    } else {
      return errorResponse("At least one service is required.", 400);
    }

    // --- Resolve stylist ---
    let stylistSnapshot:
      | { id: string; name: string; role: string; avatar: string }
      | undefined;

    if (input.stylistId) {
      if (!mongoose.Types.ObjectId.isValid(input.stylistId)) {
        return errorResponse("Invalid stylist ID.", 400);
      }
      const staff = await SalonStaff.findOne({
        _id: input.stylistId,
        salonId,
        status: "active",
      })
        .select("name role avatar designation")
        .lean();
      if (staff) {
        const s = staff as Record<string, unknown>;
        stylistSnapshot = {
          id: String(s._id),
          name: String(s.name ?? ""),
          role: String(s.designation ?? s.role ?? ""),
          avatar: String(s.avatar ?? ""),
        };
      }
    }

    const totalAmount = calculateTotal(serviceSnapshots);
    const endTime =
      input.endTime || calculateEndTime(input.startTime, serviceSnapshots);
    const appointmentNo = await generateAppointmentNo(salonId);

    const appointment = await SalonAppointment.create({
      salonId,
      appointmentNo,
      customer: customerSnapshot,
      services: serviceSnapshots,
      stylist: stylistSnapshot,
      date: new Date(input.date),
      startTime: input.startTime,
      endTime,
      status: "requested",
      source: input.source,
      totalAmount,
      notes: input.notes,
      internalNotes: input.internalNotes,
      createdBy: String(auth.user.name ?? ""),
      statusHistory: [
        {
          status: "requested",
          note: "Appointment created",
          changedBy: String(auth.user.name ?? ""),
          changedAt: new Date(),
        },
      ],
    });

    const appointmentObj = appointment.toObject() as Record<string, unknown>;

    return successResponse(
      {
        appointment: serializeAppointment(appointmentObj, auth.frontendRole),
      },
      "Appointment created successfully.",
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to create appointment.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
