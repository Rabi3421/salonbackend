import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { hashPassword } from "@/src/lib/auth/superadmin-auth";
import { generateCustomerNo } from "@/src/lib/generators/customer-id";
import { resolveSalonFromRequest } from "@/src/lib/tenant/resolve-salon";
import { SalonCustomer } from "@/src/models/SalonCustomer";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function buildNameFromEmail(email: string): string {
  const localPart = email.split("@")[0] || "Customer";
  return localPart
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Customer";
}

function safeCustomerShape(customer: Record<string, unknown>) {
  return {
    id: String(customer._id ?? customer.id ?? ""),
    customerNo: String(customer.customerNo ?? ""),
    name: String(customer.name ?? ""),
    phone: String(customer.phone ?? ""),
    email: String(customer.email ?? ""),
    salonId: String(customer.salonId ?? ""),
    hasAccount: Boolean(customer.hasAccount),
  };
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
    const name = buildNameFromEmail(email);

    if (!email || !EMAIL_REGEX.test(email)) {
      return errorResponse("A valid email is required.", 400);
    }
    if (password.length < 8) {
      return errorResponse("Password must be at least 8 characters.", 400);
    }

    const existingAccount = await SalonCustomer.findOne({
      salonId,
      email,
      hasAccount: true,
    })
      .select("_id")
      .lean();

    if (existingAccount) {
      return errorResponse("An account already exists with this email.", 409);
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    const existingCustomer = await SalonCustomer.findOne({ salonId, email })
      .select("_id")
      .lean();

    let customer: Record<string, unknown> | null;

    if (existingCustomer) {
      customer = await SalonCustomer.findOneAndUpdate(
        { _id: existingCustomer._id, salonId },
        {
          $set: {
            name,
            email,
            passwordHash,
            hasAccount: true,
            accountCreatedAt: now,
            source: "website",
            status: "active",
          },
        },
        { new: true },
      ).lean();
    } else {
      const customerNo = await generateCustomerNo(salonId);
      customer = await SalonCustomer.create({
        salonId,
        customerNo,
        name,
        phone: "",
        email,
        passwordHash,
        hasAccount: true,
        accountCreatedAt: now,
        source: "website",
        status: "active",
      }).then((doc) => doc.toObject() as Record<string, unknown>);
    }

    if (!customer) return errorResponse("Unable to create customer account.", 500);

    return successResponse(
      { customer: safeCustomerShape(customer) },
      "Customer account created successfully.",
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to create customer account.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
