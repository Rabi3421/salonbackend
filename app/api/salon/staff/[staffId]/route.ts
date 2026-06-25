import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateUpdateStaffPayload } from "@/src/lib/validators/salon-staff";
import { serializeStaff } from "@/src/lib/serializers/salon-staff";
import { SalonStaff } from "@/src/models/SalonStaff";

type RouteContext = { params: Promise<{ staffId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { staffId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return errorResponse("Invalid staff ID.", 400);
    }

    const staffMember = await SalonStaff.findOne({
      _id: staffId,
      salonId,
    }).lean();

    if (!staffMember) return errorResponse("Staff member not found.", 404);

    return successResponse({
      staffMember: serializeStaff(
        staffMember as Record<string, unknown>,
        auth.frontendRole,
      ),
    });
  } catch {
    return errorResponse("Unable to fetch staff member.", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { staffId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return errorResponse("Invalid staff ID.", 400);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateUpdateStaffPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const updates = validation.data;

    // If email is being changed, check for duplicates
    if (updates.email) {
      const dupEmail = await SalonStaff.findOne({
        salonId,
        email: updates.email,
        _id: { $ne: staffId },
      })
        .select("_id")
        .lean();

      if (dupEmail) {
        return errorResponse(
          `Another staff member with email ${updates.email} already exists.`,
          409,
        );
      }
    }

    // If phone is being changed, check for duplicates
    if (updates.phone) {
      const dupPhone = await SalonStaff.findOne({
        salonId,
        phone: updates.phone,
        _id: { $ne: staffId },
      })
        .select("_id")
        .lean();

      if (dupPhone) {
        return errorResponse(
          `Another staff member with phone ${updates.phone} already exists.`,
          409,
        );
      }
    }

    const staffMember = await SalonStaff.findOneAndUpdate(
      { _id: staffId, salonId },
      { $set: updates },
      { new: true, runValidators: true },
    ).lean();

    if (!staffMember) return errorResponse("Staff member not found.", 404);

    return successResponse(
      {
        staffMember: serializeStaff(
          staffMember as Record<string, unknown>,
          auth.frontendRole,
        ),
      },
      "Staff member updated successfully.",
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to update staff member.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
