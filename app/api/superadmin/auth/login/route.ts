import { type NextRequest, NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { ensureDefaultSuperadmin } from "@/src/lib/auth/ensure-superadmin";
import {
  comparePassword,
  signSuperadminToken,
  SUPERADMIN_COOKIE_NAME,
  SUPERADMIN_TOKEN_MAX_AGE_SECONDS,
} from "@/src/lib/auth/superadmin-auth";
import { getServerEnv } from "@/src/lib/env";
import { Superadmin } from "@/src/models/Superadmin";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!body.email || !body.password) {
      return errorResponse("Email and password are required.", 400);
    }

    await connectDB();
    await ensureDefaultSuperadmin();

    const superadmin = await Superadmin.findOne({
      email: body.email.toLowerCase().trim(),
    }).select("+passwordHash");

    if (!superadmin) {
      return errorResponse("Invalid email or password.", 401);
    }

    if (!superadmin.isActive) {
      return errorResponse("Superadmin account is inactive.", 403);
    }

    const passwordMatches = await comparePassword(
      body.password,
      superadmin.passwordHash,
    );

    if (!passwordMatches) {
      return errorResponse("Invalid email or password.", 401);
    }

    superadmin.lastLoginAt = new Date();
    await superadmin.save();

    const token = signSuperadminToken({
      id: String(superadmin._id),
      email: superadmin.email,
      role: "superadmin",
    });

    const response = successResponse(
      {
        user: {
          id: String(superadmin._id),
          name: superadmin.name,
          email: superadmin.email,
          phone: superadmin.phone,
          role: superadmin.role,
        },
      },
      "Logged in successfully.",
    );

    const { NODE_ENV } = getServerEnv();
    response.cookies.set(SUPERADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: NODE_ENV === "production",
      path: "/",
      maxAge: SUPERADMIN_TOKEN_MAX_AGE_SECONDS,
    });

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
