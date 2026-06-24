import type { NextRequest } from "next/server";
import crypto from "crypto";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { hashPassword } from "@/src/lib/auth/superadmin-auth";
import { generateSalonId } from "@/src/lib/generators/salon-id";
import { generateUniqueSalonSlug } from "@/src/lib/generators/slug";
import { generateSubscriptionId } from "@/src/lib/generators/subscription-id";
import { validateCreateSalon } from "@/src/lib/validators/salon";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import {
  DEFAULT_TRIAL_DAYS,
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
} from "@/src/constants/salon";
import { Salon } from "@/src/models/Salon";
import { SalonUser } from "@/src/models/SalonUser";
import { Subscription } from "@/src/models/Subscription";
import { Plan } from "@/src/models/Plan";
import { getPlatformSettings } from "@/src/lib/platform-settings";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);

    if (!superadmin) {
      return errorResponse("Unauthorized.", 401);
    }

    const url = request.nextUrl;
    const search = url.searchParams.get("search")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";
    const city = url.searchParams.get("city")?.trim() ?? "";
    const state = url.searchParams.get("state")?.trim() ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      MAX_PAGE_LIMIT,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? String(DEFAULT_PAGE_LIMIT), 10)),
    );

    const filter: Record<string, unknown> = {};

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      filter.$or = [
        { salonId: searchRegex },
        { name: searchRegex },
        { ownerName: searchRegex },
        { ownerEmail: searchRegex },
        { ownerPhone: searchRegex },
        { city: searchRegex },
      ];
    }

    if (status) {
      filter.accountStatus = status;
    }

    if (city) {
      filter.city = { $regex: city, $options: "i" };
    }

    if (state) {
      filter.state = { $regex: state, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const [salons, total, summary] = await Promise.all([
      Salon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Salon.countDocuments(filter),
      Salon.aggregate<{
        _id: string | null;
        count: number;
      }>([{ $group: { _id: "$accountStatus", count: { $sum: 1 } } }]),
    ]);

    const counts: Record<string, number> = {
      total: 0,
      trial: 0,
      active: 0,
      expired: 0,
      suspended: 0,
      cancelled: 0,
    };

    for (const s of summary) {
      if (s._id && s._id in counts) {
        counts[s._id] = s.count;
      }

      counts.total += s.count;
    }

    return successResponse({
      salons,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: counts,
    });
  } catch {
    return errorResponse("Unable to fetch salons.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);

    if (!superadmin) {
      return errorResponse("Unauthorized.", 401);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateCreateSalon(body);

    if (!validation.valid) {
      return errorResponse(validation.error, 400);
    }

    const input = validation.data;

    const existingSalon = await Salon.findOne({
      ownerEmail: input.ownerEmail,
    }).lean();

    if (existingSalon) {
      return errorResponse(
        "A salon with this owner email already exists.",
        409,
      );
    }

    const [salonId, slug, subscriptionId] = await Promise.all([
      generateSalonId(),
      input.slug
        ? generateUniqueSalonSlug(input.slug)
        : generateUniqueSalonSlug(input.name),
      generateSubscriptionId(),
    ]);

    let trialDays = input.trialDays ?? DEFAULT_TRIAL_DAYS;

    if (input.trialDays === undefined) {
      const settings = await getPlatformSettings();
      if (typeof settings.defaultTrialDays === "number") {
        trialDays = settings.defaultTrialDays;
      }
    }

    const now = new Date();
    const trialEndDate = new Date(
      now.getTime() + trialDays * 24 * 60 * 60 * 1000,
    );

    let currentPlanCode = "";

    if (input.planCode) {
      const plan = await Plan.findOne({
        planCode: input.planCode.toUpperCase(),
        isActive: true,
      }).lean();

      if (plan) {
        currentPlanCode = input.planCode.toUpperCase();
      }
    }

    let temporaryPassword: string | undefined;
    let passwordToHash: string;

    if (input.ownerPassword) {
      passwordToHash = input.ownerPassword;
    } else {
      temporaryPassword = crypto.randomBytes(12).toString("base64url");
      passwordToHash = temporaryPassword;
    }

    const passwordHash = await hashPassword(passwordToHash);

    const salon = await Salon.create({
      salonId,
      name: input.name,
      slug,
      ownerName: input.ownerName,
      ownerEmail: input.ownerEmail,
      ownerPhone: input.ownerPhone,
      businessType: input.businessType,
      address: input.address ?? "",
      city: input.city,
      state: input.state,
      pincode: input.pincode ?? "",
      gstNumber: input.gstNumber ?? "",
      logoUrl: input.logoUrl ?? "",
      websiteStatus: "inactive",
      accountStatus: "trial",
      trialStartDate: now,
      trialEndDate,
      currentPlanCode,
      subscriptionStatus: "trial",
      isActive: true,
    });

    const ownerUser = await SalonUser.create({
      salonId,
      name: input.ownerName,
      email: input.ownerEmail,
      phone: input.ownerPhone,
      passwordHash,
      role: "salon_owner",
      isActive: true,
    });

    const subscription = await Subscription.create({
      subscriptionId,
      salonId,
      planCode: currentPlanCode || "TRIAL",
      status: "trial",
      billingCycle: "trial",
      startDate: now,
      endDate: trialEndDate,
      nextBillingDate: trialEndDate,
      amount: 0,
    });

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.SALON_CREATED,
      entityType: "Salon",
      entityId: salonId,
      after: { salonId, name: input.name, ownerEmail: input.ownerEmail },
      request,
    });

    const ownerUserResponse = ownerUser.toObject();
    delete (ownerUserResponse as Record<string, unknown>).passwordHash;

    return successResponse(
      {
        salon,
        ownerUser: ownerUserResponse,
        subscription,
        ...(temporaryPassword ? { temporaryPassword } : {}),
      },
      "Salon created successfully.",
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }

    console.error("Salon creation error:", (error as Error).message);
    return errorResponse("Unable to create salon.", 500);
  }
}
