import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateUpdatePackagePayload } from "@/src/lib/validators/salon-package";
import { generateSlug } from "@/src/lib/slug";
import { SalonPackage } from "@/src/models/SalonPackage";

function shapePackage(doc: Record<string, unknown>) {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

type RouteContext = { params: Promise<{ packageId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { packageId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return errorResponse("Invalid package ID.", 400);
    }

    const pkg = await SalonPackage.findOne({
      _id: packageId,
      salonId,
    }).lean();

    if (!pkg) return errorResponse("Package not found.", 404);

    return successResponse({
      package: shapePackage(pkg as Record<string, unknown>),
    });
  } catch {
    return errorResponse("Unable to fetch package.", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { packageId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return errorResponse("Invalid package ID.", 400);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateUpdatePackagePayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const updates: Record<string, unknown> = { ...validation.data };

    if (updates.name) {
      updates.slug = generateSlug(updates.name as string);
    }

    const pkg = await SalonPackage.findOneAndUpdate(
      { _id: packageId, salonId },
      { $set: updates },
      { new: true, runValidators: true },
    ).lean();

    if (!pkg) return errorResponse("Package not found.", 404);

    return successResponse({
      package: shapePackage(pkg as Record<string, unknown>),
    }, "Package updated successfully.");
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to update package.", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { packageId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return errorResponse("Invalid package ID.", 400);
    }

    const pkg = await SalonPackage.findOneAndUpdate(
      { _id: packageId, salonId },
      { $set: { status: "inactive" } },
      { new: true },
    ).lean();

    if (!pkg) return errorResponse("Package not found.", 404);

    return successResponse(null, "Package deactivated successfully.");
  } catch {
    return errorResponse("Unable to deactivate package.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
