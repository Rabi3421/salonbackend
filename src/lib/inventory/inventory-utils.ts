type StockState = "in_stock" | "low_stock" | "out_of_stock";

type AdjustmentType =
  | "stock_in"
  | "stock_out"
  | "sale"
  | "usage"
  | "damage"
  | "expired"
  | "correction";

const DECREASE_TYPES: AdjustmentType[] = [
  "stock_out",
  "sale",
  "usage",
  "damage",
  "expired",
];

export function deriveStockState(
  currentStock: number,
  minStockLevel: number,
): StockState {
  if (currentStock <= 0) return "out_of_stock";
  if (currentStock <= minStockLevel) return "low_stock";
  return "in_stock";
}

export function calculateInventoryValue(
  currentStock: number,
  purchasePrice: number,
): number {
  return Math.round(currentStock * purchasePrice * 100) / 100;
}

export function isExpired(expiryDate: Date | string): boolean {
  return new Date(expiryDate) < new Date();
}

export function isExpiringSoon(
  expiryDate: Date | string,
  days = 30,
): boolean {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffDays =
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= days;
}

export function applyStockAdjustment(
  currentStock: number,
  type: AdjustmentType,
  quantity: number,
): { newStock: number; error?: string } {
  if (DECREASE_TYPES.includes(type)) {
    const newStock = currentStock - quantity;
    if (newStock < 0) {
      return {
        newStock: currentStock,
        error: `Insufficient stock. Current: ${currentStock}, requested: ${quantity}.`,
      };
    }
    return { newStock };
  }

  // stock_in, correction → increase
  return { newStock: currentStock + quantity };
}
