import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateCreateSalonUserPayload } from "@/src/lib/validators/salon-user-dashboard";
import {
  serializeSalonDashboardUser,
  serializeSalonDashboardUserList,
} from "@/src/lib/serializers/salon-user-dashboard";
import { mapFrontendSalonRoleToBackend } from "@/src/lib/auth/salon-permissions";
import { hashPassword } from "@/src/lib/auth/superadmin-auth";
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from "@/src/constants/salon";
import { SalonUser } from "@/src/models/SalonUser";
import type { FrontendSalonRole } from "@/src/lib/auth/salon-permissions";

export async function GET(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;
    const url = new URL(request.url);

    const search = url.searchParams.get("search")?.trim() ?? "";
    const role = url.searchParams.get("role")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      MAX_PAGE_LIMIT,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? String(DEFAULT_PAGE_LIMIT), 10)),
    );

    const filter: Record<string, unknown> = { salonId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      const backendRole = mapFrontendSalonRoleToBackend(role as FrontendSalonRole);
      filter.role = backendRole;
    }

    if (status === "active") filter.isActive = true;
    else if (status === "inactive") filter.isActive = false;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      SalonUser.find(filter)
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SalonUser.countDocuments(filter),
    ]);

    return successResponse({
      users: serializeSalonDashboardUserList(users as Record<string, unknown>[]),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return errorResponse("Unable to fetch users.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateCreateSalonUserPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;

    // Duplicate email check
    const existing = await SalonUser.findOne({
      salonId,
      email: input.email,
    })
      .select("_id")
      .lean();

    if (existing) {
      return errorResponse(`A user with email ${input.email} already exists.`, 409);
    }

    const backendRole = mapFrontendSalonRoleToBackend(
      input.role as FrontendSalonRole,
    );
    const passwordHash = await hashPassword(input.password);

    const user = await SalonUser.create({
      salonId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: backendRole,
      isActive: input.isActive,
    });

    const userObj = user.toObject() as Record<string, unknown>;
    delete userObj.passwordHash;

    return successResponse(
      { user: serializeSalonDashboardUser(userObj) },
      "User created successfully.",
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to create user.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
