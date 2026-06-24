import type { NextRequest } from "next/server";
import crypto from "crypto";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { hashPassword } from "@/src/lib/auth/superadmin-auth";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { SALON_USER_ROLES, type SalonUserRole } from "@/src/constants/salon";
import { Salon } from "@/src/models/Salon";
import { SalonUser } from "@/src/models/SalonUser";

type RouteParams = { params: Promise<{ salonId: string }> };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-+]/g, "").replace(/^91/, "");
}

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

    const salon = await Salon.findOne({ salonId }).select("salonId").lean();

    if (!salon) {
      return errorResponse("Salon not found.", 404);
    }

    const users = await SalonUser.find({ salonId })
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse({ users });
  } catch {
    return errorResponse("Unable to fetch salon users.", 500);
  }
}

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

    const { salonId } = await params;

    const salon = await Salon.findOne({ salonId }).select("salonId").lean();

    if (!salon) {
      return errorResponse("Salon not found.", 404);
    }

    const body = (await request.json()) as Record<string, unknown>;

    if (
      !body.name ||
      typeof body.name !== "string" ||
      !body.name.trim()
    ) {
      return errorResponse("name is required.", 400);
    }

    if (
      !body.email ||
      typeof body.email !== "string" ||
      !body.email.trim()
    ) {
      return errorResponse("email is required.", 400);
    }

    if (
      !body.phone ||
      typeof body.phone !== "string" ||
      !body.phone.trim()
    ) {
      return errorResponse("phone is required.", 400);
    }

    if (
      !body.role ||
      typeof body.role !== "string" ||
      !SALON_USER_ROLES.includes(body.role as SalonUserRole)
    ) {
      return errorResponse(
        `role is required. Allowed: ${SALON_USER_ROLES.join(", ")}`,
        400,
      );
    }

    const email = body.email.toLowerCase().trim();

    if (!EMAIL_REGEX.test(email)) {
      return errorResponse("Invalid email format.", 400);
    }

    const phone = cleanPhone(body.phone.trim());

    if (!INDIAN_PHONE_REGEX.test(phone)) {
      return errorResponse(
        "Invalid phone number. Must be a 10-digit Indian mobile number.",
        400,
      );
    }

    const existingUser = await SalonUser.findOne({
      salonId,
      email,
    }).lean();

    if (existingUser) {
      return errorResponse(
        "A user with this email already exists in this salon.",
        409,
      );
    }

    let temporaryPassword: string | undefined;
    let passwordToHash: string;

    if (body.password && typeof body.password === "string") {
      passwordToHash = body.password;
    } else {
      temporaryPassword = crypto.randomBytes(12).toString("base64url");
      passwordToHash = temporaryPassword;
    }

    const hashedPassword = await hashPassword(passwordToHash);

    const user = await SalonUser.create({
      salonId,
      name: (body.name as string).trim(),
      email,
      phone,
      passwordHash: hashedPassword,
      role: body.role,
      isActive: true,
    });

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SALON_USER_CREATED,
      entityType: "SalonUser",
      entityId: String(user._id),
      after: { salonId, email, role: body.role },
      request,
    });

    const userResponse = user.toObject();
    delete (userResponse as Record<string, unknown>).passwordHash;

    return successResponse(
      {
        user: userResponse,
        ...(temporaryPassword ? { temporaryPassword } : {}),
      },
      "Salon user created successfully.",
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    return errorResponse("Unable to create salon user.", 500);
  }
}
