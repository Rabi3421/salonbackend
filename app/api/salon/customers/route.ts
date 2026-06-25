import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateCreateCustomerPayload } from "@/src/lib/validators/salon-customer";
import { generateCustomerNo } from "@/src/lib/generators/customer-id";
import { serializeCustomer, serializeCustomerList } from "@/src/lib/serializers/salon-customer";
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from "@/src/constants/salon";
import { SalonCustomer } from "@/src/models/SalonCustomer";

export async function GET(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist", "stylist", "accountant"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;
    const url = new URL(request.url);

    const search = url.searchParams.get("search")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";
    const source = url.searchParams.get("source")?.trim() ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      MAX_PAGE_LIMIT,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? String(DEFAULT_PAGE_LIMIT), 10)),
    );

    const filter: Record<string, unknown> = { salonId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (status === "active" || status === "inactive" || status === "blocked") {
      filter.status = status;
    }
    if (source) filter.source = source;

    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      SalonCustomer.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SalonCustomer.countDocuments(filter),
    ]);

    return successResponse({
      customers: serializeCustomerList(
        customers as Record<string, unknown>[],
        auth.frontendRole,
      ),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return errorResponse("Unable to fetch customers.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateCreateCustomerPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;

    // Duplicate phone check within same salon
    const existing = await SalonCustomer.findOne({
      salonId,
      phone: input.phone,
      status: { $ne: "blocked" },
    })
      .select("_id name phone")
      .lean();

    if (existing) {
      return errorResponse(
        `A customer with phone ${input.phone} already exists.`,
        409,
      );
    }

    const customerNo = await generateCustomerNo(salonId);

    const customer = await SalonCustomer.create({
      salonId,
      customerNo,
      ...input,
    });

    const customerObj = customer.toObject() as Record<string, unknown>;

    return successResponse(
      { customer: serializeCustomer(customerObj, auth.frontendRole) },
      "Customer created successfully.",
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to create customer.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
