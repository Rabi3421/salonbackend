import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateUpdateInventoryProductPayload } from "@/src/lib/validators/salon-inventory";
import { serializeInventoryProduct, serializeStockAdjustmentList } from "@/src/lib/serializers/salon-inventory";
import { deriveStockState, calculateInventoryValue } from "@/src/lib/inventory/inventory-utils";
import { SalonInventoryProduct } from "@/src/models/SalonInventoryProduct";
import { SalonStockAdjustment } from "@/src/models/SalonStockAdjustment";

type RouteContext = { params: Promise<{ productId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "accountant"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { productId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return errorResponse("Invalid product ID.", 400);
    }

    const [product, adjustments] = await Promise.all([
      SalonInventoryProduct.findOne({ _id: productId, salonId }).lean(),
      SalonStockAdjustment.find({ salonId, productId })
        .sort({ adjustedAt: -1 })
        .limit(10)
        .lean(),
    ]);

    if (!product) return errorResponse("Product not found.", 404);

    return successResponse({
      product: serializeInventoryProduct(
        product as Record<string, unknown>,
        auth.frontendRole,
      ),
      adjustments: serializeStockAdjustmentList(
        adjustments as Record<string, unknown>[],
      ),
    });
  } catch {
    return errorResponse("Unable to fetch product.", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const { productId } = await context.params;
    const salonId = auth.salon.salonId as string;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return errorResponse("Invalid product ID.", 400);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateUpdateInventoryProductPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;

    // Manager cannot edit financial fields
    if (auth.frontendRole === "manager") {
      delete input.purchasePrice;
    }

    // SKU duplicate check
    if (input.sku) {
      const dup = await SalonInventoryProduct.findOne({
        salonId,
        sku: input.sku,
        _id: { $ne: productId },
      })
        .select("_id")
        .lean();
      if (dup) return errorResponse(`Another product with SKU "${input.sku}" already exists.`, 409);
    }

    // Load current for recalculation
    const current = await SalonInventoryProduct.findOne({ _id: productId, salonId })
      .select("currentStock minStockLevel purchasePrice")
      .lean();
    if (!current) return errorResponse("Product not found.", 404);

    const cur = current as Record<string, unknown>;
    const newStock = input.currentStock ?? (cur.currentStock as number);
    const newMin = input.minStockLevel ?? (cur.minStockLevel as number);
    const newPrice = input.purchasePrice ?? (cur.purchasePrice as number);

    const updates: Record<string, unknown> = { ...input };
    if (input.expiryDate) updates.expiryDate = new Date(input.expiryDate);
    updates.stockState = deriveStockState(newStock, newMin);
    updates.inventoryValue = calculateInventoryValue(newStock, newPrice);

    const product = await SalonInventoryProduct.findOneAndUpdate(
      { _id: productId, salonId },
      { $set: updates },
      { new: true, runValidators: true },
    ).lean();

    if (!product) return errorResponse("Product not found.", 404);

    return successResponse(
      { product: serializeInventoryProduct(product as Record<string, unknown>, auth.frontendRole) },
      "Product updated successfully.",
    );
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to update product.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
