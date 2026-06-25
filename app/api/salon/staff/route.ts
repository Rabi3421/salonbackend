import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateCreateStaffPayload } from "@/src/lib/validators/salon-staff";
import { generateStaffNo } from "@/src/lib/generators/staff-id";
import { serializeStaff, serializeStaffList } from "@/src/lib/serializers/salon-staff";
import { mapFrontendSalonRoleToBackend } from "@/src/lib/auth/salon-permissions";
import { hashPassword } from "@/src/lib/auth/superadmin-auth";
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from "@/src/constants/salon";
import { SalonStaff } from "@/src/models/SalonStaff";
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
    const serviceId = url.searchParams.get("serviceId")?.trim() ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      MAX_PAGE_LIMIT,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? String(DEFAULT_PAGE_LIMIT), 10)),
    );

    const filter: Record<string, unknown> = { salonId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { designation: { $regex: search, $options: "i" } },
      ];
    }
    if (role) filter.role = role;
    if (status === "active" || status === "inactive" || status === "on_leave") {
      filter.status = status;
    }
    if (serviceId) filter.assignedServiceIds = serviceId;

    const skip = (page - 1) * limit;

    const [staff, total] = await Promise.all([
      SalonStaff.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SalonStaff.countDocuments(filter),
    ]);

    return successResponse({
      staff: serializeStaffList(
        staff as Record<string, unknown>[],
        auth.frontendRole,
      ),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return errorResponse("Unable to fetch staff.", 500);
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
    const validation = validateCreateStaffPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;

    // Duplicate email check within same salon
    const existingEmail = await SalonStaff.findOne({
      salonId,
      email: input.email,
    })
      .select("_id")
      .lean();

    if (existingEmail) {
      return errorResponse(
        `A staff member with email ${input.email} already exists.`,
        409,
      );
    }

    // Duplicate phone check within same salon
    const existingPhone = await SalonStaff.findOne({
      salonId,
      phone: input.phone,
    })
      .select("_id")
      .lean();

    if (existingPhone) {
      return errorResponse(
        `A staff member with phone ${input.phone} already exists.`,
        409,
      );
    }

    const staffNo = await generateStaffNo(salonId);

    // Auto-create login user if not already existing
    let userId = "";
    const existingUser = await SalonUser.findOne({ salonId, email: input.email }).select("_id").lean();
    if (existingUser) {
      userId = String((existingUser as Record<string, unknown>)._id);
    } else {
      const backendRole = mapFrontendSalonRoleToBackend(input.role as FrontendSalonRole);
      const defaultPassword = await hashPassword("Salon@1234");
      const newUser = await SalonUser.create({
        salonId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash: defaultPassword,
        role: backendRole,
        isActive: true,
      });
      userId = String(newUser._id);
    }

    const staffMember = await SalonStaff.create({
      salonId,
      staffNo,
      userId,
      ...input,
    });

    const staffObj = staffMember.toObject() as Record<string, unknown>;

    return successResponse(
      { staffMember: serializeStaff(staffObj, auth.frontendRole) },
      "Staff member created successfully.",
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to create staff member.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
