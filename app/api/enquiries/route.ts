import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { validateCreateEnquiry } from "@/src/lib/validators/enquiry";
import { generateEnquiryId } from "@/src/lib/generators/enquiry-id";
import { createAuditLog } from "@/src/lib/audit-log";
import { getPlatformSettings } from "@/src/lib/platform-settings";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { Enquiry } from "@/src/models/Enquiry";
import { Salon } from "@/src/models/Salon";

export async function POST(request: Request) {
  try {
    await connectDB();

    const settings = await getPlatformSettings();
    if (settings.publicLeadEnabled === false) {
      return errorResponse("Enquiry submissions are currently disabled.", 403);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateCreateEnquiry(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;

    if (input.salonId) {
      const salon = await Salon.findOne({ salonId: input.salonId }).select("salonId").lean();
      if (!salon) return errorResponse("Salon not found.", 404);
    }

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
      source: input.source,
      notes: input.notes,
    });

    await createAuditLog({
      actorType: "system",
      actorId: "",
      actorEmail: input.email,
      action: AUDIT_ACTIONS.ENQUIRY_CREATED,
      entityType: "Enquiry",
      entityId: enquiryId,
      after: { enquiryId, type: input.type, name: input.name },
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
