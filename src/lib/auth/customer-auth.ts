import jwt, { type JwtPayload, TokenExpiredError } from "jsonwebtoken";
import type { NextResponse } from "next/server";

import { getServerEnv } from "@/src/lib/env";

export const CUSTOMER_ACCESS_COOKIE_NAME = "customer_access_token";

export const CUSTOMER_ACCESS_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

export type CustomerTokenPayload = {
  customerId: string;
  salonId: string;
  role: "end_user";
};

export type CustomerAccessTokenVerifyResult =
  | { valid: true; payload: CustomerTokenPayload }
  | { valid: false; expired: boolean };

export function signCustomerAccessToken(payload: CustomerTokenPayload): string {
  const { SALON_JWT_SECRET } = getServerEnv();
  return jwt.sign({ ...payload, type: "customer_access" }, SALON_JWT_SECRET, {
    expiresIn: CUSTOMER_ACCESS_TOKEN_MAX_AGE,
  });
}

export function verifyCustomerAccessToken(
  token: string,
): CustomerAccessTokenVerifyResult {
  try {
    const { SALON_JWT_SECRET } = getServerEnv();
    const decoded = jwt.verify(token, SALON_JWT_SECRET) as JwtPayload;

    if (
      decoded.type !== "customer_access" ||
      typeof decoded.customerId !== "string" ||
      typeof decoded.salonId !== "string" ||
      decoded.role !== "end_user"
    ) {
      return { valid: false, expired: false };
    }

    return {
      valid: true,
      payload: {
        customerId: decoded.customerId,
        salonId: decoded.salonId,
        role: "end_user",
      },
    };
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return { valid: false, expired: true };
    }
    return { valid: false, expired: false };
  }
}

export function getCustomerAccessTokenFromRequest(
  request: Request,
): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${CUSTOMER_ACCESS_COOKIE_NAME}=([^;]*)`),
  );
  return match?.[1] ?? null;
}

export function setCustomerAuthCookie(
  response: NextResponse,
  accessToken: string,
) {
  response.cookies.set(CUSTOMER_ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CUSTOMER_ACCESS_TOKEN_MAX_AGE,
  });
}

export function clearCustomerAuthCookie(response: NextResponse) {
  response.cookies.set(CUSTOMER_ACCESS_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
