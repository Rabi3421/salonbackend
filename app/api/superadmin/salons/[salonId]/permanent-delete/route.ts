import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Salon } from "@/src/models/Salon";
import { SalonUser } from "@/src/models/SalonUser";
import { Subscription } from "@/src/models/Subscription";
import { Payment } from "@/src/models/Payment";
import { SalonAppointment } from "@/src/models/SalonAppointment";
import { SalonBill } from "@/src/models/SalonBill";
import { SalonBillPayment } from "@/src/models/SalonBillPayment";
import { SalonCustomer } from "@/src/models/SalonCustomer";
import { SalonService } from "@/src/models/SalonService";
import { SalonPackage } from "@/src/models/SalonPackage";
import { SalonStaff } from "@/src/models/SalonStaff";
import { SalonSettings } from "@/src/models/SalonSettings";
import { SalonInventoryProduct } from "@/src/models/SalonInventoryProduct";
import { SalonStockAdjustment } from "@/src/models/SalonStockAdjustment";
import { SalonWebsiteContent } from "@/src/models/SalonWebsiteContent";
import { Enquiry } from "@/src/models/Enquiry";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ salonId: string }> },
) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { salonId } = await params;

    const body = await request.json().catch(() => ({})) as { confirm?: boolean };
    if (!body.confirm) {
      return errorResponse("Confirmation required. Send { confirm: true } to permanently delete.", 400);
    }

    const salon = await Salon.findOne({ salonId }).lean();
    if (!salon) return errorResponse("Salon not found.", 404);

    const salonName = (salon as Record<string, unknown>).name ?? salonId;

    const deletions = await Promise.all([
      SalonUser.deleteMany({ salonId }),
      Subscription.deleteMany({ salonId }),
      Payment.deleteMany({ salonId }),
      SalonAppointment.deleteMany({ salonId }),
      SalonBill.deleteMany({ salonId }),
      SalonBillPayment.deleteMany({ salonId }),
      SalonCustomer.deleteMany({ salonId }),
      SalonService.deleteMany({ salonId }),
      SalonPackage.deleteMany({ salonId }),
      SalonStaff.deleteMany({ salonId }),
      SalonSettings.deleteMany({ salonId }),
      SalonInventoryProduct.deleteMany({ salonId }),
      SalonStockAdjustment.deleteMany({ salonId }),
      SalonWebsiteContent.deleteMany({ salonId }),
      Enquiry.deleteMany({ salonId }),
    ]);

    const labels = [
      "users", "subscriptions", "payments", "appointments", "bills",
      "billPayments", "customers", "services", "packages", "staff",
      "settings", "inventory", "stockAdjustments", "websiteContent", "enquiries",
    ];

    const summary: Record<string, number> = {};
    deletions.forEach((result, i) => {
      summary[labels[i]] = result.deletedCount;
    });

    await Salon.deleteOne({ salonId });

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SALON_CANCELLED,
      entityType: "Salon",
      entityId: salonId,
      after: { action: "permanent_delete", salonName, deletedCollections: summary },
      request,
    });

    return successResponse(
      { salonId, salonName, deleted: summary },
      `Salon "${salonName}" and all related data permanently deleted.`,
    );
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON.", 400);
    console.error("Permanent delete error:", (error as Error).message);
    return errorResponse("Unable to delete salon.", 500);
  }
}
