import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { validateUpdateEnquiry } from "@/src/lib/validators/enquiry";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Enquiry } from "@/src/models/Enquiry";
import { Salon } from "@/src/models/Salon";

type RouteParams = { params: Promise<{ enquiryId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { enquiryId } = await params;
    const enquiry = await Enquiry.findOne({ enquiryId }).lean();
    if (!enquiry) return errorResponse("Enquiry not found.", 404);

    const enqObj = enquiry as Record<string, unknown>;
    let salon = null;
    if (enqObj.salonId) {
      salon = await Salon.findOne({ salonId: enqObj.salonId })
        .select("salonId name ownerName ownerEmail ownerPhone city")
        .lean();
    }

    return successResponse({ enquiry, salon });
  } catch {
    return errorResponse("Unable to fetch enquiry.", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { enquiryId } = await params;
    const enquiry = await Enquiry.findOne({ enquiryId });
    if (!enquiry) return errorResponse("Enquiry not found.", 404);

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateUpdateEnquiry(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;
    const before = enquiry.toObject();

    const updated = await Enquiry.findOneAndUpdate(
      { enquiryId },
      { $set: input },
      { new: true },
    ).lean();

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.ENQUIRY_UPDATED,
      entityType: "Enquiry",
      entityId: enquiryId,
      before,
      after: input,
      request,
    });

    return successResponse({ enquiry: updated }, "Enquiry updated successfully.");
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to update enquiry.", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { enquiryId } = await params;
    const enquiry = await Enquiry.findOne({ enquiryId });
    if (!enquiry) return errorResponse("Enquiry not found.", 404);

    let targetStatus = "closed";
    try {
      const body = (await request.json()) as { status?: string };
      if (body.status === "spam") targetStatus = "spam";
    } catch { /* optional body */ }

    const update: Record<string, unknown> = { status: targetStatus };
    if (targetStatus === "closed") update.closedAt = new Date();

    await Enquiry.updateOne({ enquiryId }, { $set: update });

    const action = targetStatus === "spam"
      ? AUDIT_ACTIONS.ENQUIRY_MARKED_SPAM
      : AUDIT_ACTIONS.ENQUIRY_CLOSED;

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action,
      entityType: "Enquiry",
      entityId: enquiryId,
      before: { status: enquiry.status },
      after: { status: targetStatus },
      request,
    });

    return successResponse(null, `Enquiry ${targetStatus === "spam" ? "marked as spam" : "closed"} successfully.`);
  } catch {
    return errorResponse("Unable to close enquiry.", 500);
  }
}
