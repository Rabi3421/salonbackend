import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { validateCreatePlan } from "@/src/lib/validators/plan";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from "@/src/constants/salon";
import { Plan } from "@/src/models/Plan";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const url = request.nextUrl;
    const search = url.searchParams.get("search")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      MAX_PAGE_LIMIT,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? String(DEFAULT_PAGE_LIMIT), 10)),
    );

    const filter: Record<string, unknown> = {};

    if (search) {
      const regex = { $regex: search, $options: "i" };
      filter.$or = [
        { planCode: regex },
        { name: regex },
        { description: regex },
      ];
    }

    if (status === "active") filter.isActive = true;
    else if (status === "inactive") filter.isActive = false;

    const skip = (page - 1) * limit;

    const [plans, total, activeCount, inactiveCount] = await Promise.all([
      Plan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Plan.countDocuments(filter),
      Plan.countDocuments({ isActive: true }),
      Plan.countDocuments({ isActive: false }),
    ]);

    return successResponse({
      plans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        total: activeCount + inactiveCount,
        active: activeCount,
        inactive: inactiveCount,
      },
    });
  } catch {
    return errorResponse("Unable to fetch plans.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateCreatePlan(body);

    if (!validation.valid) {
      return errorResponse(validation.error, 400);
    }

    const input = validation.data;

    const existing = await Plan.findOne({ planCode: input.planCode }).lean();
    if (existing) {
      return errorResponse("A plan with this code already exists.", 409);
    }

    const plan = await Plan.create(input);

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.PLAN_CREATED,
      entityType: "Plan",
      entityId: input.planCode,
      after: { planCode: input.planCode, name: input.name },
      request,
    });

    return successResponse({ plan }, "Plan created successfully.", 201);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to create plan.", 500);
  }
}
