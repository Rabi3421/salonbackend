import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateStockAdjustmentPayload } from "@/src/lib/validators/salon-inventory";
import { serializeInventoryProduct, serializeStockAdjustment } from "@/src/lib/serializers/salon-inventory";
import { generateStockAdjustmentNo } from "@/src/lib/generators/inventory-id";
import {
  applyStockAdjustment,
  deriveStockState,
  calculateInventoryValue,
} from "@/src/lib/inventory/inventory-utils";
import { SalonInventoryProduct } from "@/src/models/SalonInventoryProduct";
import { SalonStockAdjustment } from "@/src/models/SalonStockAdjustment";

export async function POST(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateStockAdjustmentPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;

    if (!mongoose.Types.ObjectId.isValid(input.productId)) {
      return errorResponse("Invalid product ID.", 400);
    }

    const product = await SalonInventoryProduct.findOne({
      _id: input.productId,
      salonId,
    }).lean();

    if (!product) return errorResponse("Product not found.", 404);

    const productObj = product as Record<string, unknown>;
    const currentStock = Number(productObj.currentStock ?? 0);

    const result = applyStockAdjustment(
      currentStock,
      input.type as Parameters<typeof applyStockAdjustment>[1],
      input.quantity,
    );

    if (result.error) {
      return errorResponse(result.error, 400);
    }

    const adjustmentNo = await generateStockAdjustmentNo(salonId);
    const minStockLevel = Number(productObj.minStockLevel ?? 0);
    const purchasePrice = Number(productObj.purchasePrice ?? 0);
    const newStockState = deriveStockState(result.newStock, minStockLevel);
    const newInventoryValue = calculateInventoryValue(result.newStock, purchasePrice);

    const adjustment = await SalonStockAdjustment.create({
      salonId,
      adjustmentNo,
      productId: String(productObj._id),
      productName: String(productObj.name ?? ""),
      type: input.type,
      quantity: input.quantity,
      previousStock: currentStock,
      newStock: result.newStock,
      reason: input.reason,
      referenceNo: input.referenceNo,
      adjustedBy: String(auth.user.id ?? ""),
      adjustedByName: String(auth.user.name ?? ""),
      notes: input.notes,
      adjustedAt: new Date(),
    });

    const updateFields: Record<string, unknown> = {
      currentStock: result.newStock,
      stockState: newStockState,
      inventoryValue: newInventoryValue,
    };
    if (input.type === "stock_in") {
      updateFields.lastStockedAt = new Date();
    }

    const updatedProduct = await SalonInventoryProduct.findOneAndUpdate(
      { _id: input.productId, salonId },
      { $set: updateFields },
      { new: true },
    ).lean();

    return successResponse(
      {
        product: updatedProduct
          ? serializeInventoryProduct(
              updatedProduct as Record<string, unknown>,
              auth.frontendRole,
            )
          : null,
        adjustment: serializeStockAdjustment(
          adjustment.toObject() as Record<string, unknown>,
        ),
      },
      "Stock adjusted successfully.",
    );
  } catch (error) {
    if (error instanceof SyntaxError)
      return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to record stock adjustment.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
