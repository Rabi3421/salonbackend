import type { NextRequest } from "next/server";
import crypto from "crypto";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { hashPassword } from "@/src/lib/auth/superadmin-auth";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Salon } from "@/src/models/Salon";
import { SalonUser } from "@/src/models/SalonUser";

type RouteParams = {
  params: Promise<{ salonId: string; userId: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);

    if (!superadmin) {
      return errorResponse("Unauthorized.", 401);
    }

    const { salonId, userId } = await params;

    const salon = await Salon.findOne({ salonId }).select("salonId").lean();

    if (!salon) {
      return errorResponse("Salon not found.", 404);
    }

    const user = await SalonUser.findOne({
      _id: userId,
      salonId,
    });

    if (!user) {
      return errorResponse("User not found.", 404);
    }

    let body: { newPassword?: unknown } = {};

    try {
      body = (await request.json()) as { newPassword?: unknown };
    } catch {
      body = {};
    }

    let temporaryPassword: string | undefined;
    let passwordToHash: string;

    if (body.newPassword !== undefined) {
      if (
        typeof body.newPassword !== "string" ||
        body.newPassword.trim().length < 6
      ) {
        return errorResponse("newPassword must be at least 6 characters.", 400);
      }

      passwordToHash = body.newPassword.trim();
    } else {
      temporaryPassword = crypto.randomBytes(12).toString("base64url");
      passwordToHash = temporaryPassword;
    }

    const hashedPassword = await hashPassword(passwordToHash);

    await SalonUser.updateOne(
      { _id: userId, salonId },
      { $set: { passwordHash: hashedPassword } },
    );

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SALON_USER_PASSWORD_RESET,
      entityType: "SalonUser",
      entityId: userId,
      after: { salonId, userId },
      request,
    });

    return successResponse(
      {
        userId,
        ...(temporaryPassword ? { temporaryPassword } : {}),
      },
      "Password reset successfully.",
    );
  } catch {
    return errorResponse("Unable to reset password.", 500);
  }
}
