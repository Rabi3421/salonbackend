import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { validateAssignSubscription } from "@/src/lib/validators/subscription";
import { generateSubscriptionId } from "@/src/lib/generators/subscription-id";
import {
  calculateSubscriptionDates,
  calculateSubscriptionAmount,
  syncSalonSubscriptionState,
} from "@/src/lib/subscription-utils";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from "@/src/constants/salon";
import { Subscription } from "@/src/models/Subscription";
import { Salon } from "@/src/models/Salon";
import { Plan } from "@/src/models/Plan";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const url = request.nextUrl;
    const search = url.searchParams.get("search")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";
    const billingCycle = url.searchParams.get("billingCycle")?.trim() ?? "";
    const salonId = url.searchParams.get("salonId")?.trim() ?? "";
    const planCode = url.searchParams.get("planCode")?.trim() ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      MAX_PAGE_LIMIT,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? String(DEFAULT_PAGE_LIMIT), 10)),
    );

    const filter: Record<string, unknown> = {};

    if (search) {
      const regex = { $regex: search, $options: "i" };
      filter.$or = [
        { subscriptionId: regex },
        { salonId: regex },
        { planCode: regex },
        { notes: regex },
      ];
    }

    if (status) filter.status = status;
    if (billingCycle) filter.billingCycle = billingCycle;
    if (salonId) filter.salonId = salonId;
    if (planCode) filter.planCode = planCode.toUpperCase();

    const skip = (page - 1) * limit;

    const [subscriptions, total, statusSummary, cycleSummary] = await Promise.all([
      Subscription.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Subscription.countDocuments(filter),
      Subscription.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Subscription.aggregate<{ _id: string; count: number }>([
        { $match: { billingCycle: { $in: ["monthly", "yearly"] } } },
        { $group: { _id: "$billingCycle", count: { $sum: 1 } } },
      ]),
    ]);

    const salonIds = [...new Set(subscriptions.map((s) => s.salonId as string))];
    const salons = salonIds.length > 0
      ? await Salon.find({ salonId: { $in: salonIds } })
          .select("salonId name ownerPhone city")
          .lean()
      : [];
    const salonMap = new Map(salons.map((s) => [s.salonId as string, s]));

    const enriched = subscriptions.map((sub) => {
      const salon = salonMap.get(sub.salonId as string);
      return {
        ...sub,
        salonName: (salon as Record<string, unknown>)?.name ?? "",
        salonPhone: (salon as Record<string, unknown>)?.ownerPhone ?? "",
        salonCity: (salon as Record<string, unknown>)?.city ?? "",
      };
    });

    const summary: Record<string, number> = {
      total: 0, trial: 0, active: 0, expired: 0, suspended: 0, cancelled: 0, monthly: 0, yearly: 0,
    };
    for (const s of statusSummary) {
      if (s._id in summary) summary[s._id] = s.count;
      summary.total += s.count;
    }
    for (const c of cycleSummary) {
      if (c._id in summary) summary[c._id] = c.count;
    }

    return successResponse({
      subscriptions: enriched,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      summary,
    });
  } catch {
    return errorResponse("Unable to fetch subscriptions.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateAssignSubscription(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;

    const salon = await Salon.findOne({ salonId: input.salonId }).lean();
    if (!salon) return errorResponse("Salon not found.", 404);

    const plan = await Plan.findOne({ planCode: input.planCode, isActive: true }).lean();
    if (!plan) return errorResponse("Active plan not found.", 404);

    const planObj = plan as Record<string, unknown>;
    const subscriptionId = await generateSubscriptionId();
    const dates = calculateSubscriptionDates({
      billingCycle: input.billingCycle,
      plan: {
        planCode: planObj.planCode as string,
        monthlyPrice: planObj.monthlyPrice as number,
        yearlyPrice: planObj.yearlyPrice as number,
        trialDays: planObj.trialDays as number,
      },
      startDate: input.startDate,
      endDate: input.endDate,
      nextBillingDate: input.nextBillingDate,
    });
    const amount = calculateSubscriptionAmount({
      billingCycle: input.billingCycle,
      plan: {
        planCode: planObj.planCode as string,
        monthlyPrice: planObj.monthlyPrice as number,
        yearlyPrice: planObj.yearlyPrice as number,
        trialDays: planObj.trialDays as number,
      },
      amount: input.amount,
    });

    const subStatus = input.billingCycle === "trial" ? "trial" : "active";

    const subscription = await Subscription.create({
      subscriptionId,
      salonId: input.salonId,
      planCode: input.planCode,
      status: subStatus,
      billingCycle: input.billingCycle,
      startDate: dates.startDate,
      endDate: dates.endDate,
      nextBillingDate: dates.nextBillingDate,
      amount,
      notes: input.notes ?? "",
    });

    await syncSalonSubscriptionState({
      salonId: input.salonId,
      planCode: input.planCode,
      status: subStatus,
    });

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SUBSCRIPTION_ASSIGNED,
      entityType: "Subscription",
      entityId: subscriptionId,
      after: { subscriptionId, salonId: input.salonId, planCode: input.planCode },
      request,
    });

    return successResponse({ subscription }, "Subscription assigned successfully.", 201);
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to assign subscription.", 500);
  }
}
