import { NextResponse } from "next/server";

import { successResponse } from "@/src/lib/api-response";
import { clearCustomerAuthCookie } from "@/src/lib/auth/customer-auth";

export async function POST() {
  const response = successResponse({}, "Logged out successfully.");
  clearCustomerAuthCookie(response);
  return response;
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
