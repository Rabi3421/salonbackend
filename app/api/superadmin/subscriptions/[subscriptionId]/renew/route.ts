import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { validateRenew } from "@/src/lib/validators/subscription";
import { generateSubscriptionId } from "@/src/lib/generators/subscription-id";
import {
  calculateSubscriptionDates,
  calculateSubscriptionAmount,
  syncSalonSubscriptionState,
} from "@/src/lib/subscription-utils";
import { getPlanPricing, validateFinalMonthlyPrice } from "@/src/lib/subscription-policy";
import { getGraceEndForDueDate } from "@/src/lib/subscription-billing-dates";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Subscription } from "@/src/models/Subscription";
import { Salon } from "@/src/models/Salon";
import { Plan } from "@/src/models/Plan";

type RouteParams = { params: Promise<{ subscriptionId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { subscriptionId } = await params;
    const existing = await Subscription.findOne({ subscriptionId }).lean();
    if (!existing) return errorResponse("Subscription not found.", 404);

    const existObj = existing as Record<string, unknown>;

    const salon = await Salon.findOne({ salonId: existObj.salonId }).lean();
    if (!salon) return errorResponse("Salon not found.", 404);

    const plan = await Plan.findOne({ planCode: existObj.planCode }).lean();
    if (!plan) return errorResponse("Plan not found.", 404);

    const planObj = plan as Record<string, unknown>;

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateRenew(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;
    const cycle = input.billingCycle ??
      (existObj.billingCycle === "trial" ? "monthly" : (existObj.billingCycle as "monthly" | "yearly"));

    const defaultStart = existObj.endDate && new Date(existObj.endDate as string) > new Date()
      ? (existObj.endDate as Date).toISOString()
      : undefined;

    const dates = calculateSubscriptionDates({
      billingCycle: cycle,
      plan: {
        planCode: planObj.planCode as string,
        monthlyPrice: planObj.monthlyPrice as number,
        yearlyPrice: planObj.yearlyPrice as number,
        trialDays: planObj.trialDays as number,
      },
      startDate: input.startDate ?? defaultStart,
      endDate: input.endDate,
      nextBillingDate: input.nextBillingDate,
    });

    const amount = calculateSubscriptionAmount({
      billingCycle: cycle,
      plan: {
        planCode: planObj.planCode as string,
        monthlyPrice: planObj.monthlyPrice as number,
        yearlyPrice: planObj.yearlyPrice as number,
        trialDays: planObj.trialDays as number,
      },
      amount: input.amount,
    });
    const pricing = getPlanPricing(existObj.planCode);
    const priceValidation = validateFinalMonthlyPrice(existObj.planCode, amount);
    if (!priceValidation.valid) return errorResponse(priceValidation.error, 400);

    const newSubId = await generateSubscriptionId();

    const subscription = await Subscription.create({
      subscriptionId: newSubId,
      salonId: existObj.salonId,
      planCode: existObj.planCode,
      status: "active",
      billingCycle: cycle,
      startDate: dates.startDate,
      endDate: dates.endDate,
      nextBillingDate: dates.nextBillingDate,
      amount,
      planName: String(planObj.name ?? existObj.planCode),
      standardMonthlyPrice: pricing.standardMonthlyPrice,
      finalMonthlyPrice: amount,
      minimumMonthlyPrice: pricing.minimumMonthlyPrice,
      negotiatedMonthlyPrice: input.amount,
      priceLockedBySuperadmin: input.amount !== undefined,
      billingCollectionDay: 5,
      graceEndDay: 10,
      currentDueDate: dates.nextBillingDate,
      currentGraceEndDate: getGraceEndForDueDate(dates.nextBillingDate),
      nextDueDate: dates.nextBillingDate,
      nextGraceEndDate: getGraceEndForDueDate(dates.nextBillingDate),
      accessStatus: "active",
      paymentStatus: "paid",
      notes: input.notes ?? `Renewed from ${subscriptionId}`,
    });

    await syncSalonSubscriptionState({
      salonId: existObj.salonId as string,
      planCode: existObj.planCode as string,
      status: "active",
    });

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SUBSCRIPTION_RENEWED,
      entityType: "Subscription",
      entityId: newSubId,
      before: { previousSubscriptionId: subscriptionId },
      after: { subscriptionId: newSubId, billingCycle: cycle },
      request,
    });

    return successResponse({ subscription }, "Subscription renewed successfully.", 201);
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to renew subscription.", 500);
  }
}
