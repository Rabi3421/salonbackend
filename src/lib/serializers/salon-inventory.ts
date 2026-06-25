import type { FrontendSalonRole } from "@/src/lib/auth/salon-permissions";

const FINANCIAL_FIELDS = ["purchasePrice", "inventoryValue"];

function baseShape(doc: Record<string, unknown>): Record<string, unknown> {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export function serializeInventoryProduct(
  doc: Record<string, unknown>,
  role: FrontendSalonRole,
): Record<string, unknown> {
  const shaped = baseShape(doc);

  if (role === "manager") {
    for (const key of FINANCIAL_FIELDS) {
      delete shaped[key];
    }
  }

  return shaped;
}

export function serializeInventoryProductList(
  docs: Record<string, unknown>[],
  role: FrontendSalonRole,
): Record<string, unknown>[] {
  return docs.map((doc) => serializeInventoryProduct(doc, role));
}

export function serializeStockAdjustment(
  doc: Record<string, unknown>,
): Record<string, unknown> {
  return baseShape(doc);
}

export function serializeStockAdjustmentList(
  docs: Record<string, unknown>[],
): Record<string, unknown>[] {
  return docs.map(serializeStockAdjustment);
}
