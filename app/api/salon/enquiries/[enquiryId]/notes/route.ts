import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateAddNotePayload } from "@/src/lib/validators/salon-enquiry-dashboard";
import { serializeSalonEnquiry } from "@/src/lib/serializers/salon-enquiry";
import { Enquiry } from "@/src/models/Enquiry";

type RouteContext = { params: Promise<{ enquiryId: string }> };

export async function POST(request: Request, context: RouteContext) {
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
    const validation = validateAddNotePayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;

    const updateQuery: Record<string, unknown> = {
      $push: {
        internalNotes: {
          note: input.note,
          addedBy: String(auth.user.name ?? ""),
          addedByEmail: String(auth.user.email ?? ""),
          addedAt: new Date(),
        },
      },
    };

    const setFields: Record<string, unknown> = {};
    if (input.nextFollowUpAt) {
      setFields.nextFollowUpAt = new Date(input.nextFollowUpAt);
    }
    if (input.statusAfterNote) {
      setFields.status = input.statusAfterNote;
    }
    if (Object.keys(setFields).length > 0) {
      updateQuery.$set = setFields;
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
      "Note added successfully.",
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid JSON request body.", 400);
    }
    return errorResponse("Unable to add note.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
