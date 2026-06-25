import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateCreateServicePayload } from "@/src/lib/validators/salon-service";
import { generateSlug } from "@/src/lib/slug";
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from "@/src/constants/salon";
import { SalonService } from "@/src/models/SalonService";

function shapeService(doc: Record<string, unknown>) {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export async function GET(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist", "stylist"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;
    const url = new URL(request.url);

    const search = url.searchParams.get("search")?.trim() ?? "";
    const category = url.searchParams.get("category")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      MAX_PAGE_LIMIT,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? String(DEFAULT_PAGE_LIMIT), 10)),
    );

    const filter: Record<string, unknown> = { salonId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    if (category) filter.category = category;
    if (status === "active" || status === "inactive") filter.status = status;

    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      SalonService.find(filter)
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SalonService.countDocuments(filter),
    ]);

    return successResponse({
      services: (services as Record<string, unknown>[]).map(shapeService),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return errorResponse("Unable to fetch services.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateCreateServicePayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;
    const slug = generateSlug(input.name);

    const service = await SalonService.create({
      salonId,
      ...input,
      slug,
    });

    const serviceObj = service.toObject() as Record<string, unknown>;

    return successResponse(
      { service: shapeService(serviceObj) },
      "Service created successfully.",
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to create service.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
