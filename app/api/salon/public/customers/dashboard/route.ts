import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireCustomer } from "@/src/lib/auth/require-customer";
import { serializeCustomerAccount } from "@/src/lib/serializers/customer-account";
import { SalonAppointment } from "@/src/models/SalonAppointment";

function appointmentShape(doc: Record<string, unknown>) {
  const customer = (doc.customer ?? {}) as Record<string, unknown>;
  const stylist = (doc.stylist ?? {}) as Record<string, unknown>;
  const services = Array.isArray(doc.services)
    ? (doc.services as Record<string, unknown>[]).map((service) => ({
        id: String(service.id ?? ""),
        name: String(service.name ?? ""),
        price: Number(service.price ?? 0),
        duration: Number(service.duration ?? 0),
        category: String(service.category ?? ""),
      }))
    : [];

  return {
    id: String(doc._id ?? doc.id ?? ""),
    appointmentNo: String(doc.appointmentNo ?? ""),
    customerName: String(customer.name ?? ""),
    services,
    stylistName: String(stylist.name ?? ""),
    date: doc.date ? new Date(String(doc.date)).toISOString() : "",
    startTime: String(doc.startTime ?? ""),
    endTime: String(doc.endTime ?? ""),
    status: String(doc.status ?? ""),
    source: String(doc.source ?? ""),
    totalAmount: Number(doc.totalAmount ?? 0),
    paidAmount: Number(doc.paidAmount ?? 0),
    notes: String(doc.notes ?? ""),
  };
}

export async function GET(request: Request) {
  try {
    const auth = await requireCustomer(request);
    if (!auth.success) {
      return errorResponse(auth.error, auth.status);
    }

    const customer = serializeCustomerAccount(auth.customer);
    const now = new Date();
    const identityMatch = {
      $or: [
        { "customer.id": customer.id },
        ...(customer.email ? [{ "customer.email": customer.email }] : []),
        ...(customer.phone ? [{ "customer.phone": customer.phone }] : []),
      ],
    };

    const [upcomingDocs, recentDocs, totalAppointments, completedAppointments] =
      await Promise.all([
        SalonAppointment.find({
          salonId: auth.salonId,
          ...identityMatch,
          date: { $gte: now },
          status: { $nin: ["cancelled", "no_show"] },
        })
          .sort({ date: 1, startTime: 1 })
          .limit(5)
          .lean(),
        SalonAppointment.find({
          salonId: auth.salonId,
          ...identityMatch,
        })
          .sort({ date: -1, startTime: -1 })
          .limit(8)
          .lean(),
        SalonAppointment.countDocuments({
          salonId: auth.salonId,
          ...identityMatch,
        }),
        SalonAppointment.countDocuments({
          salonId: auth.salonId,
          ...identityMatch,
          status: "completed",
        }),
      ]);

    return successResponse({
      customer,
      salon: {
        salonId: String(auth.salon.salonId ?? ""),
        name: String(auth.salon.name ?? ""),
        phone: String(auth.salon.phone ?? ""),
        email: String(auth.salon.email ?? ""),
      },
      stats: {
        totalAppointments,
        completedAppointments,
        totalVisits: customer.totalVisits,
        totalSpent: customer.totalSpent,
        dueAmount: customer.dueAmount,
      },
      upcomingAppointments: upcomingDocs.map((doc) =>
        appointmentShape(doc as Record<string, unknown>),
      ),
      recentAppointments: recentDocs.map((doc) =>
        appointmentShape(doc as Record<string, unknown>),
      ),
    });
  } catch {
    return errorResponse("Unable to load customer dashboard.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
