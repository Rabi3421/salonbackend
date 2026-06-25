import { NextResponse } from "next/server";

import { successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import {
  clearSalonAuthCookies,
  getSalonRefreshTokenFromRequest,
  verifySalonRefreshToken,
} from "@/src/lib/auth/salon-auth";
import { SalonUser } from "@/src/models/SalonUser";

export async function POST(request: Request) {
  const response = successResponse(null, "Logged out successfully.");
  clearSalonAuthCookies(response);

  try {
    const refreshTokenRaw = getSalonRefreshTokenFromRequest(request);
    if (refreshTokenRaw) {
      const payload = verifySalonRefreshToken(refreshTokenRaw);
      if (payload) {
        await connectDB();
        await SalonUser.updateOne(
          { _id: payload.userId, refreshTokenId: payload.tokenId },
          { $set: { refreshTokenId: null } },
        );
      }
    }
  } catch {
    // Cookies are already cleared — safe to ignore DB errors on logout
  }

  return response;
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
