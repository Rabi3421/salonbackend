import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { comparePassword } from "@/src/lib/auth/superadmin-auth";
import {
  setCustomerAuthCookie,
  signCustomerAccessToken,
} from "@/src/lib/auth/customer-auth";
import { connectDB } from "@/src/lib/db";
import { serializeCustomerAccount } from "@/src/lib/serializers/customer-account";
import { resolveSalonFromRequest } from "@/src/lib/tenant/resolve-salon";
import { SalonCustomer } from "@/src/models/SalonCustomer";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export async function POST(request: Request) {
  try {
    const salonResult = await resolveSalonFromRequest(request);
    if (!salonResult.success) {
      return errorResponse(salonResult.error, salonResult.status);
    }

    const salonId = salonResult.salon.salonId as string;
    const body = (await request.json()) as Record<string, unknown>;
    const email = clean(body.email).toLowerCase();
    const password = clean(body.password);

    if (!email || !password) {
      return errorResponse("Email and password are required.", 400);
    }

    await connectDB();

    const customer = await SalonCustomer.findOne({
      salonId,
      email,
      hasAccount: true,
    }).select("+passwordHash");

    if (!customer || !customer.passwordHash) {
      return errorResponse("Invalid email or password.", 401);
    }

    if (customer.status === "blocked") {
      return errorResponse("This customer account is blocked.", 403);
    }

    const passwordMatches = await comparePassword(password, customer.passwordHash);
    if (!passwordMatches) {
      return errorResponse("Invalid email or password.", 401);
    }

    customer.lastLoginAt = new Date();
    await customer.save();

    const token = signCustomerAccessToken({
      customerId: String(customer._id),
      salonId,
      role: "end_user",
    });

    const response = successResponse(
      { customer: serializeCustomerAccount(customer.toObject()) },
      "Login successful.",
    );

    setCustomerAuthCookie(response, token);
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
