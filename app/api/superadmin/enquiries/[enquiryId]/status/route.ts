import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { validateStatusUpdate } from "@/src/lib/validators/enquiry";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Enquiry } from "@/src/models/Enquiry";

type RouteParams = { params: Promise<{ enquiryId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { enquiryId } = await params;
    const enquiry = await Enquiry.findOne({ enquiryId });
    if (!enquiry) return errorResponse("Enquiry not found.", 404);

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateStatusUpdate(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const { status, note } = validation.data;
    const before = enquiry.toObject();

    const update: Record<string, unknown> = { status };
    if (status === "resolved") update.resolvedAt = new Date();
    if (status === "closed") update.closedAt = new Date();

    const pushOps: Record<string, unknown> = {};
    if (note) {
      pushOps.internalNotes = {
        note,
        addedBy: String(superadmin._id),
        addedByEmail: superadmin.email,
        addedAt: new Date(),
      };
    }

    const updated = await Enquiry.findOneAndUpdate(
      { enquiryId },
      {
        $set: update,
        ...(Object.keys(pushOps).length > 0 ? { $push: pushOps } : {}),
      },
      { new: true },
    ).lean();

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.ENQUIRY_STATUS_UPDATED,
      entityType: "Enquiry",
      entityId: enquiryId,
      before: { status: before.status },
      after: { status, note },
      request,
    });

    return successResponse({ enquiry: updated }, "Enquiry status updated successfully.");
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to update enquiry status.", 500);
  }
}
