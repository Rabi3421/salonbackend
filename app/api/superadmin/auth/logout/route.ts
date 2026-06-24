import { NextResponse } from "next/server";

import { successResponse } from "@/src/lib/api-response";
import { SUPERADMIN_COOKIE_NAME } from "@/src/lib/auth/superadmin-auth";

export async function POST() {
  const response = successResponse(null, "Logged out successfully.");

  response.cookies.set(SUPERADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
