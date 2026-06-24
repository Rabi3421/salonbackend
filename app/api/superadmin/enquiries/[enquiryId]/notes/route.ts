import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Enquiry } from "@/src/models/Enquiry";

type RouteParams = { params: Promise<{ enquiryId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const { enquiryId } = await params;
    const enquiry = await Enquiry.findOne({ enquiryId });
    if (!enquiry) return errorResponse("Enquiry not found.", 404);

    const body = (await request.json()) as { note?: string };

    if (!body.note || typeof body.note !== "string" || !body.note.trim()) {
      return errorResponse("note is required.", 400);
    }

    const noteEntry = {
      note: body.note.trim(),
      addedBy: String(superadmin._id),
      addedByEmail: superadmin.email,
      addedAt: new Date(),
    };

    const updated = await Enquiry.findOneAndUpdate(
      { enquiryId },
      { $push: { internalNotes: noteEntry } },
      { new: true },
    ).lean();

    await createAuditLog({
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.ENQUIRY_NOTE_ADDED,
      entityType: "Enquiry",
      entityId: enquiryId,
      after: { note: body.note.trim() },
      request,
    });

    return successResponse({ enquiry: updated }, "Note added successfully.");
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to add note.", 500);
  }
}
