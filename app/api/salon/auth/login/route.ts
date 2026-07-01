import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { resolveSalonFromRequest } from "@/src/lib/tenant/resolve-salon";
import { comparePassword } from "@/src/lib/auth/superadmin-auth";
import {
  signSalonAccessToken,
  signSalonRefreshToken,
  generateRefreshTokenId,
  setSalonAuthCookies,
} from "@/src/lib/auth/salon-auth";
import {
  mapBackendSalonRoleToFrontend,
  normalizeBackendSalonRole,
  sanitizeSalonUser,
} from "@/src/lib/auth/salon-permissions";
import {
  getLatestSubscriptionForSalon,
  canRoleAccessPlan,
  buildSubscriptionPayload,
} from "@/src/lib/subscription-access-service";
import { SalonUser } from "@/src/models/SalonUser";

export async function POST(request: Request) {
  try {
    const salonResult = await resolveSalonFromRequest(request);
    if (!salonResult.success) {
      return errorResponse(salonResult.error, salonResult.status);
    }

    const salonId = salonResult.salon.salonId as string;

    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!body.email || !body.password) {
      return errorResponse("Email and password are required.", 400);
    }

    await connectDB();

    const user = await SalonUser.findOne({
      email: body.email.toLowerCase().trim(),
      salonId,
    }).select("+passwordHash");

    if (!user) {
      return errorResponse("Invalid email or password.", 401);
    }

    if (!user.isActive) {
      return errorResponse(
        "Your account is inactive. Contact the salon owner.",
        403,
      );
    }

    const passwordMatches = await comparePassword(
      body.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      return errorResponse("Invalid email or password.", 401);
    }

    const backendRole = normalizeBackendSalonRole(user.role as string);
    const frontendRole = mapBackendSalonRoleToFrontend(backendRole);
    const subscription = await getLatestSubscriptionForSalon(salonId);
    const subscriptionPayload = buildSubscriptionPayload(subscription as Record<string, unknown> | null);

    const subStatus = subscriptionPayload?.subscriptionStatus ?? "";
    if (["blocked", "cancelled", "access_blocked", "suspended", "expired"].includes(subStatus)) {
      const msg = subStatus === "cancelled"
        ? "Your subscription is cancelled. Please contact support."
        : "Your salon access is blocked due to pending payment. Please contact support.";
      return errorResponse(msg, 403);
    }

    if (subscription && !canRoleAccessPlan(frontendRole, (subscription as Record<string, unknown>).planCode)) {
      return errorResponse(
        "Your role is not available on the current subscription plan.",
        403,
      );
    }

    const accessToken = signSalonAccessToken({
      userId: String(user._id),
      salonId,
      role: backendRole,
    });

    const refreshTokenId = generateRefreshTokenId();
    const refreshToken = signSalonRefreshToken({
      userId: String(user._id),
      salonId,
      tokenId: refreshTokenId,
    });

    user.lastLoginAt = new Date();
    user.refreshTokenId = refreshTokenId;
    await user.save();

    const userObj = user.toObject() as Record<string, unknown>;
    const safeUser = sanitizeSalonUser(userObj);

    const response = successResponse(
      {
        user: {
          ...safeUser,
          role: frontendRole,
          salonId,
          subscription: subscriptionPayload,
        },
      },
      "Login successful.",
    );

    setSalonAuthCookies(response, accessToken, refreshToken);

    return response;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to login.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
