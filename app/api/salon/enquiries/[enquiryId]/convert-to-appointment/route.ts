import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateConvertEnquiryPayload } from "@/src/lib/validators/salon-enquiry-dashboard";
import { serializeSalonEnquiry } from "@/src/lib/serializers/salon-enquiry";
import { generateAppointmentNo } from "@/src/lib/generators/appointment-id";
import { generateCustomerNo } from "@/src/lib/generators/customer-id";
import { Enquiry } from "@/src/models/Enquiry";
import { SalonCustomer } from "@/src/models/SalonCustomer";
import { SalonAppointment } from "@/src/models/SalonAppointment";
import { SalonStaff } from "@/src/models/SalonStaff";

type RouteContext = { params: Promise<{ enquiryId: string }> };

function shapeDoc(doc: Record<string, unknown>): Record<string, unknown> {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { enquiryId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(enquiryId)) {
      return errorResponse("Invalid enquiry ID.", 400);
    }

    const enquiry = await Enquiry.findOne({ _id: enquiryId, salonId }).lean();
    if (!enquiry) return errorResponse("Enquiry not found.", 404);

    const enqObj = enquiry as Record<string, unknown>;

    if (enqObj.status === "converted") {
      return errorResponse("Enquiry has already been converted.", 400);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateConvertEnquiryPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;
    const enqName = String(enqObj.name ?? "");
    const enqPhone = String(enqObj.phone ?? "");
    const enqEmail = String(enqObj.email ?? "");
    const enqMessage = String(enqObj.message ?? "");

    let createdCustomer: Record<string, unknown> | null = null;
    let createdAppointment: Record<string, unknown> | null = null;
    let convertedCustomerId = String(enqObj.convertedCustomerId ?? "");
    let convertedAppointmentId = String(
      enqObj.convertedAppointmentId ?? "",
    );

    // --- Create or reuse customer ---
    if (input.createCustomer && enqPhone) {
      const existing = await SalonCustomer.findOne({
        salonId,
        phone: enqPhone,
        status: { $ne: "blocked" },
      }).lean();

      if (existing) {
        createdCustomer = shapeDoc(existing as Record<string, unknown>);
        convertedCustomerId = String(
          (existing as Record<string, unknown>)._id,
        );
      } else {
        const customerNo = await generateCustomerNo(salonId);
        const customer = await SalonCustomer.create({
          salonId,
          customerNo,
          name: enqName,
          phone: enqPhone,
          email: enqEmail,
          source: "website",
          notes: enqMessage ? `From enquiry: ${enqMessage.slice(0, 200)}` : "",
        });
        createdCustomer = shapeDoc(
          customer.toObject() as Record<string, unknown>,
        );
        convertedCustomerId = String(customer._id);
      }
    }

    // --- Create appointment ---
    if (input.createAppointment) {
      let stylistSnapshot:
        | { id: string; name: string; role: string; avatar: string }
        | undefined;

      if (
        input.stylistId &&
        mongoose.Types.ObjectId.isValid(input.stylistId)
      ) {
        const staff = await SalonStaff.findOne({
          _id: input.stylistId,
          salonId,
          status: "active",
        })
          .select("name designation avatar")
          .lean();
        if (staff) {
          const s = staff as Record<string, unknown>;
          stylistSnapshot = {
            id: String(s._id),
            name: String(s.name ?? ""),
            role: String(s.designation ?? ""),
            avatar: String(s.avatar ?? ""),
          };
        }
      }

      const appointmentNo = await generateAppointmentNo(salonId);
      const serviceSnapshot = {
        id: "",
        name: input.serviceName || String(enqObj.preferredService ?? "Consultation"),
        price: 0,
        duration: 60,
        category: "",
      };

      const aptDate = input.appointmentDate
        ? new Date(input.appointmentDate)
        : new Date();
      const aptTime = input.appointmentTime || "10:00";

      const appointment = await SalonAppointment.create({
        salonId,
        appointmentNo,
        customer: {
          id: convertedCustomerId,
          name: enqName,
          phone: enqPhone,
          email: enqEmail,
        },
        services: [serviceSnapshot],
        stylist: stylistSnapshot,
        date: aptDate,
        startTime: aptTime,
        status: "requested",
        source: "website",
        totalAmount: 0,
        notes: input.notes || enqMessage.slice(0, 500),
        createdBy: String(auth.user.name ?? ""),
        statusHistory: [
          {
            status: "requested",
            note: `Converted from enquiry ${String(enqObj.enquiryId ?? "")}`,
            changedBy: String(auth.user.name ?? ""),
            changedAt: new Date(),
          },
        ],
      });

      createdAppointment = shapeDoc(
        appointment.toObject() as Record<string, unknown>,
      );
      convertedAppointmentId = String(appointment._id);
    }

    // --- Update enquiry ---
    const updatedEnquiry = await Enquiry.findOneAndUpdate(
      { _id: enquiryId, salonId },
      {
        $set: {
          status: "converted",
          convertedCustomerId,
          convertedAppointmentId,
        },
        $push: {
          internalNotes: {
            note: `Converted to ${input.createCustomer ? "customer" : ""}${input.createCustomer && input.createAppointment ? " + " : ""}${input.createAppointment ? "appointment" : ""} by ${String(auth.user.name ?? "")}`,
            addedBy: String(auth.user.name ?? ""),
            addedByEmail: String(auth.user.email ?? ""),
            addedAt: new Date(),
          },
        },
      },
      { new: true },
    ).lean();

    return successResponse(
      {
        enquiry: updatedEnquiry
          ? serializeSalonEnquiry(
              updatedEnquiry as Record<string, unknown>,
            )
          : null,
        customer: createdCustomer,
        appointment: createdAppointment,
      },
      "Enquiry converted successfully.",
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to convert enquiry.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
