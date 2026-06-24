import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { validateCreateEnquiry } from "@/src/lib/validators/enquiry";
import { generateEnquiryId } from "@/src/lib/generators/enquiry-id";
import { createAuditLog } from "@/src/lib/audit-log";
import { AUDIT_ACTIONS } from "@/src/constants/modules";
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from "@/src/constants/salon";
import { Enquiry } from "@/src/models/Enquiry";
import { Salon } from "@/src/models/Salon";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const url = request.nextUrl;
    const search = url.searchParams.get("search")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";
    const type = url.searchParams.get("type")?.trim() ?? "";
    const priority = url.searchParams.get("priority")?.trim() ?? "";
    const salonId = url.searchParams.get("salonId")?.trim() ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(url.searchParams.get("limit") ?? String(DEFAULT_PAGE_LIMIT), 10)));

    const filter: Record<string, unknown> = {};

    if (search) {
      const regex = { $regex: search, $options: "i" };
      filter.$or = [
        { enquiryId: regex },
        { name: regex },
        { phone: regex },
        { email: regex },
        { message: regex },
        { salonId: regex },
        { source: regex },
      ];
    }
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (salonId) filter.salonId = salonId;

    const skip = (page - 1) * limit;

    const [enquiries, total, statusAgg, typeAgg] = await Promise.all([
      Enquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Enquiry.countDocuments(filter),
      Enquiry.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Enquiry.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
    ]);

    const salonIds = [...new Set(enquiries.map((e) => e.salonId as string).filter(Boolean))];
    const salons = salonIds.length > 0
      ? await Salon.find({ salonId: { $in: salonIds } }).select("salonId name ownerPhone city").lean()
      : [];
    const salonMap = new Map(salons.map((s) => [s.salonId as string, s]));

    const enriched = enquiries.map((enq) => {
      const sid = enq.salonId as string;
      const salon = sid ? salonMap.get(sid) as Record<string, unknown> | undefined : undefined;
      return {
        ...enq,
        salonName: salon?.name ?? "",
        salonCity: salon?.city ?? "",
      };
    });

    const summary: Record<string, number> = {
      total: 0, new: 0, inProgress: 0, resolved: 0, closed: 0, spam: 0,
      contact: 0, demoRequests: 0, appointmentRequests: 0, support: 0,
    };
    for (const s of statusAgg) {
      summary.total += s.count;
      if (s._id === "new") summary.new = s.count;
      else if (s._id === "in_progress") summary.inProgress = s.count;
      else if (s._id === "resolved") summary.resolved = s.count;
      else if (s._id === "closed") summary.closed = s.count;
      else if (s._id === "spam") summary.spam = s.count;
    }
    for (const t of typeAgg) {
      if (t._id === "contact") summary.contact = t.count;
      else if (t._id === "demo_request") summary.demoRequests = t.count;
      else if (t._id === "appointment_request") summary.appointmentRequests = t.count;
      else if (t._id === "support") summary.support = t.count;
    }

    return successResponse({
      enquiries: enriched,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      summary,
    });
  } catch {
    return errorResponse("Unable to fetch enquiries.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateCreateEnquiry(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;

    if (input.salonId) {
      const salon = await Salon.findOne({ salonId: input.salonId }).select("salonId").lean();
      if (!salon) return errorResponse("Salon not found.", 404);
    }

    const enquiryId = await generateEnquiryId();

    const enquiry = await Enquiry.create({
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
      actorType: "superadmin",
      actorId: String(superadmin._id),
      actorEmail: superadmin.email,
      action: AUDIT_ACTIONS.ENQUIRY_CREATED,
      entityType: "Enquiry",
      entityId: enquiryId,
      after: { enquiryId, type: input.type, name: input.name },
      request,
    });

    return successResponse({ enquiry }, "Enquiry created successfully.", 201);
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to create enquiry.", 500);
  }
}
