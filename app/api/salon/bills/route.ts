import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateCreateBillPayload } from "@/src/lib/validators/salon-billing";
import { generateBillNo } from "@/src/lib/generators/bill-id";
import { serializeBill, serializeBillList } from "@/src/lib/serializers/salon-billing";
import {
  calculateLineItemTotal,
  calculateBillTotals,
} from "@/src/lib/billing/billing-utils";
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from "@/src/constants/salon";
import { SalonBill } from "@/src/models/SalonBill";
import { SalonCustomer } from "@/src/models/SalonCustomer";

export async function GET(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist", "accountant"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;
    const url = new URL(request.url);

    const search = url.searchParams.get("search")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";
    const dateFrom = url.searchParams.get("dateFrom")?.trim() ?? "";
    const dateTo = url.searchParams.get("dateTo")?.trim() ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      MAX_PAGE_LIMIT,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? String(DEFAULT_PAGE_LIMIT), 10)),
    );

    const filter: Record<string, unknown> = { salonId };

    if (search) {
      filter.$or = [
        { billNo: { $regex: search, $options: "i" } },
        { "customer.name": { $regex: search, $options: "i" } },
        { "customer.phone": { $regex: search, $options: "i" } },
      ];
    }
    if (status) filter.status = status;

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom && !isNaN(Date.parse(dateFrom))) dateFilter.$gte = new Date(dateFrom);
      if (dateTo && !isNaN(Date.parse(dateTo))) dateFilter.$lte = new Date(dateTo);
      if (Object.keys(dateFilter).length > 0) filter.createdAt = dateFilter;
    }

    const skip = (page - 1) * limit;

    const [bills, total] = await Promise.all([
      SalonBill.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SalonBill.countDocuments(filter),
    ]);

    return successResponse({
      bills: serializeBillList(bills as Record<string, unknown>[]),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return errorResponse("Unable to fetch bills.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "receptionist", "accountant"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateCreateBillPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;

    // Resolve customer
    let customerSnapshot: { id: string; name: string; phone: string; email: string };

    if (input.customerId && mongoose.Types.ObjectId.isValid(input.customerId)) {
      const customer = await SalonCustomer.findOne({ _id: input.customerId, salonId })
        .select("name phone email")
        .lean();
      if (!customer) return errorResponse("Customer not found.", 404);
      const c = customer as Record<string, unknown>;
      customerSnapshot = {
        id: String(c._id),
        name: String(c.name ?? ""),
        phone: String(c.phone ?? ""),
        email: String(c.email ?? ""),
      };
    } else {
      customerSnapshot = {
        id: "",
        name: input.customerName,
        phone: input.customerPhone,
        email: input.customerEmail,
      };
    }

    // Calculate line item totals
    const itemsWithTotals = input.items.map((item) => ({
      ...item,
      total: calculateLineItemTotal(item),
    }));

    const { subtotal, grandTotal } = calculateBillTotals(
      itemsWithTotals,
      input.discountTotal,
      input.taxTotal,
    );

    const billNo = await generateBillNo(salonId);

    const bill = await SalonBill.create({
      salonId,
      billNo,
      source: input.source,
      customer: customerSnapshot,
      items: itemsWithTotals,
      appointmentId: input.appointmentId,
      subtotal,
      discountTotal: input.discountTotal,
      taxTotal: input.taxTotal,
      grandTotal,
      paidAmount: 0,
      dueAmount: grandTotal,
      status: "unpaid",
      notes: input.notes,
      createdBy: String(auth.user.name ?? ""),
    });

    const billObj = bill.toObject() as Record<string, unknown>;

    return successResponse(
      { bill: serializeBill(billObj) },
      "Bill created successfully.",
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to create bill.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
