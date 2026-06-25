import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateUpdateServicePayload } from "@/src/lib/validators/salon-service";
import { generateSlug } from "@/src/lib/slug";
import { SalonService } from "@/src/models/SalonService";

function shapeService(doc: Record<string, unknown>) {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

type RouteContext = { params: Promise<{ serviceId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist", "stylist"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { serviceId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return errorResponse("Invalid service ID.", 400);
    }

    const service = await SalonService.findOne({
      _id: serviceId,
      salonId,
    }).lean();

    if (!service) return errorResponse("Service not found.", 404);

    return successResponse({
      service: shapeService(service as Record<string, unknown>),
    });
  } catch {
    return errorResponse("Unable to fetch service.", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { serviceId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return errorResponse("Invalid service ID.", 400);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateUpdateServicePayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const updates: Record<string, unknown> = { ...validation.data };

    if (updates.name) {
      updates.slug = generateSlug(updates.name as string);
    }

    const service = await SalonService.findOneAndUpdate(
      { _id: serviceId, salonId },
      { $set: updates },
      { new: true, runValidators: true },
    ).lean();

    if (!service) return errorResponse("Service not found.", 404);

    return successResponse({
      service: shapeService(service as Record<string, unknown>),
    }, "Service updated successfully.");
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to update service.", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { serviceId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return errorResponse("Invalid service ID.", 400);
    }

    const service = await SalonService.findOneAndUpdate(
      { _id: serviceId, salonId },
      { $set: { status: "inactive" } },
      { new: true },
    ).lean();

    if (!service) return errorResponse("Service not found.", 404);

    return successResponse(null, "Service deactivated successfully.");
  } catch {
    return errorResponse("Unable to deactivate service.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
