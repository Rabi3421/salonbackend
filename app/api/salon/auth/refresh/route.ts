import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { resolveSalonFromRequest } from "@/src/lib/tenant/resolve-salon";
import {
  getSalonRefreshTokenFromRequest,
  verifySalonRefreshToken,
  signSalonAccessToken,
  SALON_ACCESS_COOKIE_NAME,
  SALON_ACCESS_TOKEN_MAX_AGE,
} from "@/src/lib/auth/salon-auth";
import { SalonUser } from "@/src/models/SalonUser";
import type { SalonUserRole } from "@/src/constants/salon";

export async function POST(request: Request) {
  try {
    const salonResult = await resolveSalonFromRequest(request);
    if (!salonResult.success) {
      return errorResponse(salonResult.error, salonResult.status);
    }

    const headerSalonId = salonResult.salon.salonId as string;

    const refreshTokenRaw = getSalonRefreshTokenFromRequest(request);
    if (!refreshTokenRaw) {
      return errorResponse("No refresh token.", 401);
    }

    const payload = verifySalonRefreshToken(refreshTokenRaw);
    if (!payload) {
      return errorResponse("Invalid or expired refresh token.", 401);
    }

    if (payload.salonId !== headerSalonId) {
      return errorResponse("Token does not match salon.", 403);
    }

    await connectDB();

    const user = await SalonUser.findOne({
      _id: payload.userId,
      salonId: headerSalonId,
    })
      .select("+refreshTokenId")
      .lean();

    if (!user) {
      return errorResponse("User not found.", 401);
    }

    const userObj = user as Record<string, unknown>;

    if (!userObj.isActive) {
      return errorResponse("User account is inactive.", 403);
    }

    if (userObj.refreshTokenId !== payload.tokenId) {
      return errorResponse("Refresh token revoked.", 401);
    }

    const accessToken = signSalonAccessToken({
      userId: payload.userId,
      salonId: headerSalonId,
      role: userObj.role as string,
    });

    const isProduction = process.env.NODE_ENV === "production";
    const response = successResponse(null, "Token refreshed.");

    response.cookies.set(SALON_ACCESS_COOKIE_NAME, accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: SALON_ACCESS_TOKEN_MAX_AGE,
    });

    return response;
  } catch {
    return errorResponse("Unable to refresh token.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
