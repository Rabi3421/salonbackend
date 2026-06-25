import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateCreateInventoryProductPayload } from "@/src/lib/validators/salon-inventory";
import { generateInventoryProductNo } from "@/src/lib/generators/inventory-id";
import { serializeInventoryProduct, serializeInventoryProductList } from "@/src/lib/serializers/salon-inventory";
import { deriveStockState, calculateInventoryValue, isExpiringSoon } from "@/src/lib/inventory/inventory-utils";
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from "@/src/constants/salon";
import { SalonInventoryProduct } from "@/src/models/SalonInventoryProduct";

export async function GET(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "accountant"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;
    const url = new URL(request.url);

    const search = url.searchParams.get("search")?.trim() ?? "";
    const category = url.searchParams.get("category")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";
    const stockState = url.searchParams.get("stockState")?.trim() ?? "";
    const expiry = url.searchParams.get("expiry")?.trim() ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      MAX_PAGE_LIMIT,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? String(DEFAULT_PAGE_LIMIT), 10)),
    );

    const filter: Record<string, unknown> = { salonId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { supplierName: { $regex: search, $options: "i" } },
      ];
    }
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (stockState) filter.stockState = stockState;

    if (expiry === "expired") {
      filter.expiryDate = { $lt: new Date() };
    } else if (expiry === "expiring_soon") {
      const soon = new Date();
      soon.setDate(soon.getDate() + 30);
      filter.expiryDate = { $gt: new Date(), $lte: soon };
    }

    const skip = (page - 1) * limit;

    const [products, total, lowStock, outOfStock, allActive] = await Promise.all([
      SalonInventoryProduct.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SalonInventoryProduct.countDocuments(filter),
      SalonInventoryProduct.countDocuments({ salonId, status: "active", stockState: "low_stock" }),
      SalonInventoryProduct.countDocuments({ salonId, status: "active", stockState: "out_of_stock" }),
      SalonInventoryProduct.find({ salonId, status: "active" }).select("expiryDate purchasePrice currentStock").lean(),
    ]);

    const expiringSoonCount = (allActive as { expiryDate?: Date }[]).filter(
      (p) => p.expiryDate && isExpiringSoon(p.expiryDate),
    ).length;

    const inventoryValue = (allActive as { currentStock: number; purchasePrice: number }[]).reduce(
      (sum, p) => sum + calculateInventoryValue(p.currentStock, p.purchasePrice), 0,
    );

    return successResponse({
      products: serializeInventoryProductList(
        products as Record<string, unknown>[],
        auth.frontendRole,
      ),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      summary: {
        totalProducts: total,
        lowStock,
        outOfStock,
        expiringSoon: expiringSoonCount,
        inventoryValue: auth.frontendRole === "manager" ? undefined : inventoryValue,
      },
    });
  } catch {
    return errorResponse("Unable to fetch inventory products.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateCreateInventoryProductPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;

    if (input.sku) {
      const dup = await SalonInventoryProduct.findOne({ salonId, sku: input.sku }).select("_id").lean();
      if (dup) return errorResponse(`A product with SKU "${input.sku}" already exists.`, 409);
    }

    const productNo = await generateInventoryProductNo(salonId);
    const stockState = deriveStockState(input.currentStock, input.minStockLevel);
    const inventoryValue = calculateInventoryValue(input.currentStock, input.purchasePrice);

    const product = await SalonInventoryProduct.create({
      salonId,
      productNo,
      ...input,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
      stockState,
      inventoryValue,
      lastStockedAt: input.currentStock > 0 ? new Date() : undefined,
    });

    const productObj = product.toObject() as Record<string, unknown>;

    return successResponse(
      { product: serializeInventoryProduct(productObj, auth.frontendRole) },
      "Product added successfully.",
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to create product.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
