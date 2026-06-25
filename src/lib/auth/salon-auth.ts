import jwt, { type JwtPayload, TokenExpiredError } from "jsonwebtoken";
import crypto from "crypto";
import type { NextResponse } from "next/server";

import { getServerEnv } from "@/src/lib/env";

export const SALON_ACCESS_COOKIE_NAME = "salon_access_token";
export const SALON_REFRESH_COOKIE_NAME = "salon_refresh_token";

export const SALON_ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes
export const SALON_REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export type SalonTokenPayload = {
  userId: string;
  salonId: string;
  role: string;
};

export type SalonRefreshTokenPayload = {
  userId: string;
  salonId: string;
  tokenId: string;
};

export function signSalonAccessToken(payload: SalonTokenPayload): string {
  const { SALON_JWT_SECRET } = getServerEnv();
  return jwt.sign({ ...payload, type: "access" }, SALON_JWT_SECRET, {
    expiresIn: SALON_ACCESS_TOKEN_MAX_AGE,
  });
}

export function signSalonRefreshToken(
  payload: SalonRefreshTokenPayload,
): string {
  const { SALON_JWT_SECRET } = getServerEnv();
  return jwt.sign({ ...payload, type: "refresh" }, SALON_JWT_SECRET, {
    expiresIn: SALON_REFRESH_TOKEN_MAX_AGE,
  });
}

export function generateRefreshTokenId(): string {
  return crypto.randomUUID();
}

export type AccessTokenVerifyResult =
  | { valid: true; payload: SalonTokenPayload }
  | { valid: false; expired: boolean };

export function verifySalonAccessToken(
  token: string,
): AccessTokenVerifyResult {
  try {
    const { SALON_JWT_SECRET } = getServerEnv();
    const decoded = jwt.verify(token, SALON_JWT_SECRET) as JwtPayload;

    if (
      typeof decoded.userId !== "string" ||
      typeof decoded.salonId !== "string" ||
      typeof decoded.role !== "string"
    ) {
      return { valid: false, expired: false };
    }

    if (decoded.type === "refresh") {
      return { valid: false, expired: false };
    }

    return {
      valid: true,
      payload: {
        userId: decoded.userId,
        salonId: decoded.salonId,
        role: decoded.role,
      },
    };
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return { valid: false, expired: true };
    }
    return { valid: false, expired: false };
  }
}

export function verifySalonRefreshToken(
  token: string,
): SalonRefreshTokenPayload | null {
  try {
    const { SALON_JWT_SECRET } = getServerEnv();
    const decoded = jwt.verify(token, SALON_JWT_SECRET) as JwtPayload;

    if (
      typeof decoded.userId !== "string" ||
      typeof decoded.salonId !== "string" ||
      typeof decoded.tokenId !== "string" ||
      decoded.type !== "refresh"
    ) {
      return null;
    }

    return {
      userId: decoded.userId,
      salonId: decoded.salonId,
      tokenId: decoded.tokenId,
    };
  } catch {
    return null;
  }
}

export function getSalonAccessTokenFromRequest(
  request: Request,
): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SALON_ACCESS_COOKIE_NAME}=([^;]*)`),
  );
  if (match?.[1]) return match[1];

  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim() || null;
  }

  return null;
}

export function getSalonRefreshTokenFromRequest(
  request: Request,
): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SALON_REFRESH_COOKIE_NAME}=([^;]*)`),
  );
  if (match?.[1]) return match[1];
  return null;
}

export function setSalonAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
): void {
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set(SALON_ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: SALON_ACCESS_TOKEN_MAX_AGE,
  });

  response.cookies.set(SALON_REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: SALON_REFRESH_TOKEN_MAX_AGE,
  });
}

export function clearSalonAuthCookies(response: NextResponse): void {
  const isProduction = process.env.NODE_ENV === "production";
  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: 0,
  };

  response.cookies.set(SALON_ACCESS_COOKIE_NAME, "", opts);
  response.cookies.set(SALON_REFRESH_COOKIE_NAME, "", opts);
}
