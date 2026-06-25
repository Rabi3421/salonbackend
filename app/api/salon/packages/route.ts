import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateCreatePackagePayload } from "@/src/lib/validators/salon-package";
import { generateSlug } from "@/src/lib/slug";
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from "@/src/constants/salon";
import { SalonPackage } from "@/src/models/SalonPackage";

function shapePackage(doc: Record<string, unknown>) {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export async function GET(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;
    const url = new URL(request.url);

    const search = url.searchParams.get("search")?.trim() ?? "";
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
      ];
    }
    if (status === "active" || status === "inactive") filter.status = status;

    const skip = (page - 1) * limit;

    const [packages, total] = await Promise.all([
      SalonPackage.find(filter)
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SalonPackage.countDocuments(filter),
    ]);

    return successResponse({
      packages: (packages as Record<string, unknown>[]).map(shapePackage),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return errorResponse("Unable to fetch packages.", 500);
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
    const validation = validateCreatePackagePayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;
    const slug = generateSlug(input.name);

    const pkg = await SalonPackage.create({
      salonId,
      ...input,
      slug,
    });

    const pkgObj = pkg.toObject() as Record<string, unknown>;

    return successResponse(
      { package: shapePackage(pkgObj) },
      "Package created successfully.",
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to create package.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
