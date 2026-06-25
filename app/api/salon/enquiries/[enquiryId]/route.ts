import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateUpdateEnquiryPayload } from "@/src/lib/validators/salon-enquiry-dashboard";
import { serializeSalonEnquiry } from "@/src/lib/serializers/salon-enquiry";
import { Enquiry } from "@/src/models/Enquiry";

type RouteContext = { params: Promise<{ enquiryId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { enquiryId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(enquiryId)) {
      return errorResponse("Invalid enquiry ID.", 400);
    }

    const enquiry = await Enquiry.findOne({
      _id: enquiryId,
      salonId,
    }).lean();

    if (!enquiry) return errorResponse("Enquiry not found.", 404);

    return successResponse({
      enquiry: serializeSalonEnquiry(enquiry as Record<string, unknown>),
    });
  } catch {
    return errorResponse("Unable to fetch enquiry.", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { enquiryId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(enquiryId)) {
      return errorResponse("Invalid enquiry ID.", 400);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateUpdateEnquiryPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;
    const updates: Record<string, unknown> = {};
    const pushOps: Record<string, unknown> = {};

    if (input.status) updates.status = input.status;
    if (input.priority) updates.priority = input.priority;
    if (input.assignedTo !== undefined) updates.assignedTo = input.assignedTo;
    if (input.nextFollowUpAt !== undefined) {
      updates.nextFollowUpAt = input.nextFollowUpAt
        ? new Date(input.nextFollowUpAt)
        : null;
    }

    if (input.status === "closed") updates.closedAt = new Date();
    if (input.status === "resolved") updates.resolvedAt = new Date();

    if (input.note) {
      pushOps.internalNotes = {
        note: input.note,
        addedBy: String(auth.user.name ?? ""),
        addedByEmail: String(auth.user.email ?? ""),
        addedAt: new Date(),
      };
    }

    const updateQuery: Record<string, unknown> = {};
    if (Object.keys(updates).length > 0) updateQuery.$set = updates;
    if (Object.keys(pushOps).length > 0) updateQuery.$push = pushOps;

    if (Object.keys(updateQuery).length === 0) {
      return errorResponse("No fields to update.", 400);
    }

    const enquiry = await Enquiry.findOneAndUpdate(
      { _id: enquiryId, salonId },
      updateQuery,
      { new: true, runValidators: true },
    ).lean();

    if (!enquiry) return errorResponse("Enquiry not found.", 404);

    return successResponse(
      {
        enquiry: serializeSalonEnquiry(enquiry as Record<string, unknown>),
      },
      "Enquiry updated successfully.",
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to update enquiry.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
