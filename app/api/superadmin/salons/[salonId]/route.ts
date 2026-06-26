import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { validateUpdateSalon } from "@/src/lib/validators/salon";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Salon } from "@/src/models/Salon";
import { SalonUser } from "@/src/models/SalonUser";
import { Subscription } from "@/src/models/Subscription";
import { Payment } from "@/src/models/Payment";

type RouteParams = { params: Promise<{ salonId: string }> };

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);

    if (!superadmin) {
      return errorResponse("Unauthorized.", 401);
    }

    const { salonId } = await params;

    const salon = await Salon.findOne({ salonId }).lean();

    if (!salon) {
      return errorResponse("Salon not found.", 404);
    }

    const [owner, currentSubscription, paymentSummary] = await Promise.all([
      SalonUser.findOne({ salonId, role: "salon_owner" })
        .select("-passwordHash")
        .lean(),
      Subscription.findOne({ salonId })
        .sort({ createdAt: -1 })
        .lean(),
      Payment.aggregate<{ totalPayments: number; totalPaid: number }>([
        { $match: { salonId } },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalPaid: {
              $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] },
            },
          },
        },
      ]),
    ]);

    return successResponse({
      salon,
      owner,
      currentSubscription,
      payments: {
        totalPayments: paymentSummary[0]?.totalPayments ?? 0,
        totalPaid: paymentSummary[0]?.totalPaid ?? 0,
      },
    });
  } catch {
    return errorResponse("Unable to fetch salon details.", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);

    if (!superadmin) {
      return errorResponse("Unauthorized.", 401);
    }

    const { salonId } = await params;

    const salon = await Salon.findOne({ salonId });

    if (!salon) {
      return errorResponse("Salon not found.", 404);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateUpdateSalon(body);

    if (!validation.valid) {
      return errorResponse(validation.error, 400);
    }

    const input = validation.data;
    const before = salon.toObject();

    const salonUpdate: Record<string, unknown> = {};

    if (input.name !== undefined) salonUpdate.name = input.name;
    if (input.ownerName !== undefined) salonUpdate.ownerName = input.ownerName;
    if (input.ownerEmail !== undefined) salonUpdate.ownerEmail = input.ownerEmail;
    if (input.ownerPhone !== undefined) salonUpdate.ownerPhone = input.ownerPhone;
    if (input.businessType !== undefined) salonUpdate.businessType = input.businessType;
    if (input.address !== undefined) salonUpdate.address = input.address;
    if (input.city !== undefined) salonUpdate.city = input.city;
    if (input.state !== undefined) salonUpdate.state = input.state;
    if (input.pincode !== undefined) salonUpdate.pincode = input.pincode;
    if (input.gstNumber !== undefined) salonUpdate.gstNumber = input.gstNumber;
    if (input.logoUrl !== undefined) salonUpdate.logoUrl = input.logoUrl;
    if (input.websiteStatus !== undefined) salonUpdate.websiteStatus = input.websiteStatus;
    if (input.currentPlanCode !== undefined) salonUpdate.currentPlanCode = input.currentPlanCode;

    const updatedSalon = await Salon.findOneAndUpdate(
      { salonId },
      { $set: salonUpdate },
      { new: true },
    ).lean();

    if (input.ownerName || input.ownerEmail || input.ownerPhone) {
      const ownerUpdate: Record<string, unknown> = {};

      if (input.ownerName) ownerUpdate.name = input.ownerName;
      if (input.ownerEmail) ownerUpdate.email = input.ownerEmail;
      if (input.ownerPhone) ownerUpdate.phone = input.ownerPhone;

      await SalonUser.updateOne(
        { salonId, role: "salon_owner" },
        { $set: ownerUpdate },
      );
    }

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SALON_UPDATED,
      entityType: "Salon",
      entityId: salonId,
      before,
      after: salonUpdate,
      request,
    });

    return successResponse({ salon: updatedSalon }, "Salon updated successfully.");
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    return errorResponse("Unable to update salon.", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);

    if (!superadmin) {
      return errorResponse("Unauthorized.", 401);
    }

    const { salonId } = await params;

    const salon = await Salon.findOne({ salonId });

    if (!salon) {
      return errorResponse("Salon not found.", 404);
    }

    const before = salon.toObject();

    await Salon.updateOne(
      { salonId },
      {
        $set: {
          accountStatus: "cancelled",
          isActive: false,
          websiteStatus: "inactive",
        },
      },
    );

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SALON_CANCELLED,
      entityType: "Salon",
      entityId: salonId,
      before,
      after: { accountStatus: "cancelled", isActive: false, websiteStatus: "inactive" },
      request,
    });

    return successResponse(null, "Salon cancelled successfully.");
  } catch {
    return errorResponse("Unable to cancel salon.", 500);
  }
}
