import type { FrontendSalonRole } from "@/src/lib/auth/salon-permissions";

type LineItemInput = {
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
};

export function calculateLineItemTotal(item: LineItemInput): number {
  const gross = item.quantity * item.unitPrice;
  const discounted = gross - (item.discount ?? 0);
  const tax = discounted * ((item.taxRate ?? 0) / 100);
  return Math.round((discounted + tax) * 100) / 100;
}

export function calculateBillTotals(
  items: LineItemInput[],
  discountTotal = 0,
  taxTotal = 0,
) {
  const subtotal = items.reduce(
    (sum, i) => sum + i.quantity * i.unitPrice,
    0,
  );
  const itemTotals = items.reduce(
    (sum, i) => sum + calculateLineItemTotal(i),
    0,
  );
  const grandTotal = Math.max(
    Math.round((itemTotals - discountTotal + taxTotal) * 100) / 100,
    0,
  );

  return { subtotal, grandTotal };
}

export function deriveBillStatus(
  grandTotal: number,
  paidAmount: number,
  currentStatus?: string,
): string {
  if (currentStatus === "cancelled" || currentStatus === "refunded") {
    return currentStatus;
  }
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount < grandTotal) return "partially_paid";
  return "paid";
}

export function canViewBilling(role: FrontendSalonRole): boolean {
  return ["owner", "manager", "receptionist", "accountant"].includes(role);
}

export function canCreateBill(role: FrontendSalonRole): boolean {
  return ["owner", "receptionist", "accountant"].includes(role);
}

export function canUpdateBill(role: FrontendSalonRole): boolean {
  return ["owner", "accountant"].includes(role);
}

export function canRecordPayment(role: FrontendSalonRole): boolean {
  return ["owner", "receptionist", "accountant"].includes(role);
}

export function canViewPayments(role: FrontendSalonRole): boolean {
  return ["owner", "manager", "receptionist", "accountant"].includes(role);
}
