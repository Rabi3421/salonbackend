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
  sanitizeSalonUser,
} from "@/src/lib/auth/salon-permissions";
import { SalonUser } from "@/src/models/SalonUser";
import type { SalonUserRole } from "@/src/constants/salon";

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

    const backendRole = user.role as SalonUserRole;
    const frontendRole = mapBackendSalonRoleToFrontend(backendRole);

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
