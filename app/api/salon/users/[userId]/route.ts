import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateUpdateSalonUserPayload } from "@/src/lib/validators/salon-user-dashboard";
import { serializeSalonDashboardUser } from "@/src/lib/serializers/salon-user-dashboard";
import {
  mapFrontendSalonRoleToBackend,
  type FrontendSalonRole,
} from "@/src/lib/auth/salon-permissions";
import { hashPassword } from "@/src/lib/auth/superadmin-auth";
import { SalonUser } from "@/src/models/SalonUser";

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { userId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return errorResponse("Invalid user ID.", 400);
    }

    const user = await SalonUser.findOne({ _id: userId, salonId })
      .select("-passwordHash")
      .lean();

    if (!user) return errorResponse("User not found.", 404);

    return successResponse({
      user: serializeSalonDashboardUser(user as Record<string, unknown>),
    });
  } catch {
    return errorResponse("Unable to fetch user.", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { userId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return errorResponse("Invalid user ID.", 400);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateUpdateSalonUserPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;

    // Load current user
    const currentUser = await SalonUser.findOne({ _id: userId, salonId })
      .select("role isActive")
      .lean();
    if (!currentUser)
      return errorResponse("User not found.", 404);

    const cur = currentUser as Record<string, unknown>;

    // Prevent deactivating last active owner
    if (input.isActive === false && cur.role === "salon_owner") {
      const activeOwners = await SalonUser.countDocuments({
        salonId,
        role: "salon_owner",
        isActive: true,
      });
      if (activeOwners <= 1) {
        return errorResponse(
          "Cannot deactivate the last active owner.",
          400,
        );
      }
    }

    // Duplicate email check
    if (input.email) {
      const dup = await SalonUser.findOne({
        salonId,
        email: input.email,
        _id: { $ne: userId },
      })
        .select("_id")
        .lean();
      if (dup) {
        return errorResponse(
          `Another user with email ${input.email} already exists.`,
          409,
        );
      }
    }

    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.email !== undefined) updates.email = input.email;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.isActive !== undefined) updates.isActive = input.isActive;
    if (input.role !== undefined) {
      updates.role = mapFrontendSalonRoleToBackend(
        input.role as FrontendSalonRole,
      );
    }
    if (input.password) {
      updates.passwordHash = await hashPassword(input.password);
    }

    const user = await SalonUser.findOneAndUpdate(
      { _id: userId, salonId },
      { $set: updates },
      { new: true },
    )
      .select("-passwordHash")
      .lean();

    if (!user) return errorResponse("User not found.", 404);

    return successResponse(
      { user: serializeSalonDashboardUser(user as Record<string, unknown>) },
      "User updated successfully.",
    );
  } catch (error) {
    if (error instanceof SyntaxError)
      return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to update user.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
