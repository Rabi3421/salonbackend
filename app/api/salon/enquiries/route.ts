import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { resolveSalonFromRequest } from "@/src/lib/tenant/resolve-salon";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateCreateEnquiry } from "@/src/lib/validators/enquiry";
import { generateEnquiryId } from "@/src/lib/generators/enquiry-id";
import { serializeSalonEnquiryList } from "@/src/lib/serializers/salon-enquiry";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from "@/src/constants/salon";
import { Enquiry } from "@/src/models/Enquiry";

// ── GET: Dashboard enquiry list (authenticated) ──

export async function GET(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;
    const url = new URL(request.url);

    const search = url.searchParams.get("search")?.trim() ?? "";
    const type = url.searchParams.get("type")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";
    const priority = url.searchParams.get("priority")?.trim() ?? "";
    const source = url.searchParams.get("source")?.trim() ?? "";
    const dateFrom = url.searchParams.get("dateFrom")?.trim() ?? "";
    const dateTo = url.searchParams.get("dateTo")?.trim() ?? "";
    const page = Math.max(
      1,
      parseInt(url.searchParams.get("page") ?? "1", 10),
    );
    const limit = Math.min(
      MAX_PAGE_LIMIT,
      Math.max(
        1,
        parseInt(
          url.searchParams.get("limit") ?? String(DEFAULT_PAGE_LIMIT),
          10,
        ),
      ),
    );

    const filter: Record<string, unknown> = { salonId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (source) filter.source = source;

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom && !isNaN(Date.parse(dateFrom)))
        dateFilter.$gte = new Date(dateFrom);
      if (dateTo && !isNaN(Date.parse(dateTo)))
        dateFilter.$lte = new Date(dateTo);
      if (Object.keys(dateFilter).length > 0)
        filter.createdAt = dateFilter;
    }

    const skip = (page - 1) * limit;

    const [enquiries, total] = await Promise.all([
      Enquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Enquiry.countDocuments(filter),
    ]);

    return successResponse({
      enquiries: serializeSalonEnquiryList(
        enquiries as Record<string, unknown>[],
      ),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return errorResponse("Unable to fetch enquiries.", 500);
  }
}

// ── POST: Public salon enquiry submission (no auth required) ──

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
    if (error instanceof SyntaxError)
      return errorResponse("Invalid request.", 400);
    return errorResponse("Unable to submit enquiry.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
