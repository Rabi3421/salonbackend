import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { resolveSalonFromRequest } from "@/src/lib/tenant/resolve-salon";
import { validateCreateEnquiry } from "@/src/lib/validators/enquiry";
import { generateEnquiryId } from "@/src/lib/generators/enquiry-id";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Enquiry } from "@/src/models/Enquiry";

export async function POST(request: Request) {
  try {
    const salonResult = await resolveSalonFromRequest(request);
    if (!salonResult.success) {
      return errorResponse(salonResult.error, salonResult.status);
    }

    await connectDB();

    const body = (await request.json()) as Record<string, unknown>;
    body.salonId = salonResult.salon.salonId;

    const validation = validateCreateEnquiry(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;
    const enquiryId = await generateEnquiryId();

    await Enquiry.create({
      enquiryId,
      salonId: input.salonId ?? "",
      type: input.type,
      name: input.name,
      phone: input.phone,
      email: input.email,
      message: input.message,
      status: "new",
      priority: input.priority,
      source: input.source || "salon_website",
      notes: input.notes,
    });

    await createAuditLog({
      actorType: "system",
      actorId: "",
      actorEmail: input.email,
      action: AUDIT_ACTIONS.ENQUIRY_CREATED,
      entityType: "Enquiry",
      entityId: enquiryId,
      after: { enquiryId, salonId: input.salonId, type: input.type },
      request,
    });

    return successResponse(
      { enquiryId },
      "Enquiry submitted successfully.",
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid request.", 400);
    return errorResponse("Unable to submit enquiry.", 500);
  }
}
