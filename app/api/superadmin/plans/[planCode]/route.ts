import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { validateUpdatePlan } from "@/src/lib/validators/plan";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Plan } from "@/src/models/Plan";
import { Salon } from "@/src/models/Salon";
import { Subscription } from "@/src/models/Subscription";

type RouteParams = { params: Promise<{ planCode: string }> };

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { planCode } = await params;
    const code = planCode.toUpperCase();

    const plan = await Plan.findOne({ planCode: code }).lean();
    if (!plan) return errorResponse("Plan not found.", 404);

    const [salonsUsingPlan, subscriptionsUsingPlan] = await Promise.all([
      Salon.countDocuments({ currentPlanCode: code }),
      Subscription.countDocuments({ planCode: code }),
    ]);

    return successResponse({
      plan,
      usage: { salonsUsingPlan, subscriptionsUsingPlan },
    });
  } catch {
    return errorResponse("Unable to fetch plan.", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { planCode } = await params;
    const code = planCode.toUpperCase();

    const plan = await Plan.findOne({ planCode: code });
    if (!plan) return errorResponse("Plan not found.", 404);

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateUpdatePlan(body);

    if (!validation.valid) {
      return errorResponse(validation.error, 400);
    }

    const input = validation.data;
    const before = plan.toObject();

    const update: Record<string, unknown> = {};
    if (input.name !== undefined) update.name = input.name;
    if (input.description !== undefined) update.description = input.description;
    if (input.monthlyPrice !== undefined) update.monthlyPrice = input.monthlyPrice;
    if (input.yearlyPrice !== undefined) update.yearlyPrice = input.yearlyPrice;
    if (input.trialDays !== undefined) update.trialDays = input.trialDays;
    if (input.maxStaff !== undefined) update.maxStaff = input.maxStaff;
    if (input.maxBranches !== undefined) update.maxBranches = input.maxBranches;
    if (input.maxAppointmentsPerMonth !== undefined) update.maxAppointmentsPerMonth = input.maxAppointmentsPerMonth;
    if (input.isActive !== undefined) update.isActive = input.isActive;

    if (input.modules !== undefined) {
      const existing = plan.modules?.toObject?.() ?? {};
      update.modules = { ...existing, ...input.modules };
    }

    const updated = await Plan.findOneAndUpdate(
      { planCode: code },
      { $set: update },
      { new: true },
    ).lean();

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.PLAN_UPDATED,
      entityType: "Plan",
      entityId: code,
      before,
      after: update,
      request,
    });

    return successResponse({ plan: updated }, "Plan updated successfully.");
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to update plan.", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { planCode } = await params;
    const code = planCode.toUpperCase();

    const plan = await Plan.findOne({ planCode: code });
    if (!plan) return errorResponse("Plan not found.", 404);

    if (!plan.isActive) {
      return successResponse(null, "Plan is already inactive.");
    }

    await Plan.updateOne({ planCode: code }, { $set: { isActive: false } });

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.PLAN_DEACTIVATED,
      entityType: "Plan",
      entityId: code,
      before: { isActive: true },
      after: { isActive: false },
      request,
    });

    return successResponse(null, "Plan deactivated successfully.");
  } catch {
    return errorResponse("Unable to deactivate plan.", 500);
  }
}
