import { Payment } from "@/src/models/Payment";
import { Subscription } from "@/src/models/Subscription";
import { applyPaymentToSubscription } from "@/src/lib/subscription-access-service";

export function getPaymentAuditAction(status: string): string {
  switch (status) {
    case "paid": return "PAYMENT_MARKED_PAID";
    case "failed": return "PAYMENT_FAILED";
    case "refunded": return "PAYMENT_REFUNDED";
    default: return "PAYMENT_UPDATED";
  }
}

export async function calculatePaymentSummary(filter?: Record<string, unknown>) {
  const match = filter ?? {};

  const [statusAgg, monthlyAgg] = await Promise.all([
    Payment.aggregate<{ _id: string; count: number; total: number }>([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate<{ total: number }>([
      {
        $match: {
          ...match,
          status: "paid",
          paidAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const result: Record<string, number> = {
    total: 0,
    pending: 0,
    paid: 0,
    failed: 0,
    refunded: 0,
    totalPaidAmount: 0,
    pendingAmount: 0,
    monthlyPaidAmount: monthlyAgg[0]?.total ?? 0,
  };

  for (const row of statusAgg) {
    result.total += row.count;
    if (row._id === "paid") { result.paid = row.count; result.totalPaidAmount = row.total; }
    else if (row._id === "pending") { result.pending = row.count; result.pendingAmount = row.total; }
    else if (row._id === "failed") { result.failed = row.count; }
    else if (row._id === "refunded") { result.refunded = row.count; }
  }

  return result;
}

export async function syncSubscriptionAfterPayment(payment: {
  subscriptionId?: string;
  salonId: string;
  status: string;
  paymentId?: string;
  paidAt?: Date | string | null;
}): Promise<void> {
  if (!payment.subscriptionId || payment.status !== "paid") return;

  const sub = await Subscription.findOne({ subscriptionId: payment.subscriptionId });
  if (!sub) return;

  await applyPaymentToSubscription(payment.subscriptionId, {
    paymentId: payment.paymentId ?? "",
    salonId: payment.salonId,
    paidAt: payment.paidAt ?? new Date(),
  });
}
