import {
  formatCurrencyINR,
  formatNullableDate,
  formatPaymentMode,
  formatPaymentStatus,
} from "@/src/lib/formatters";
import type { SalonSubscriptionPaymentItem } from "@/src/types/salon-frontend";

function statusClass(status: string) {
  const styles: Record<string, string> = {
    paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
    pending: "border-yellow-200 bg-yellow-50 text-yellow-700",
    failed: "border-red-200 bg-red-50 text-red-700",
    refunded: "border-orange-200 bg-orange-50 text-orange-700",
    cancelled: "border-slate-200 bg-slate-100 text-slate-600",
  };
  return styles[status] ?? styles.cancelled;
}

export function PaymentHistoryTable({ payments }: { payments: SalonSubscriptionPaymentItem[] }) {
  if (payments.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Payment History</h2>
        <p className="mt-2 text-sm text-slate-500">No payments recorded yet.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Payment History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Payment ID</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Amount</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Payment Mode</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Payment Date</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Receipt Number</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Billing Period</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Transaction ID</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Notes</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <tr key={payment.paymentId} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-700">{payment.paymentId}</td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{formatCurrencyINR(payment.amount)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatPaymentMode(payment.paymentMode)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(payment.paymentStatus)}`}>
                    {formatPaymentStatus(payment.paymentStatus)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatNullableDate(payment.paymentDate)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{payment.receiptNumber || "N/A"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {payment.billingPeriodStart || payment.billingPeriodEnd
                    ? `${formatNullableDate(payment.billingPeriodStart)} - ${formatNullableDate(payment.billingPeriodEnd)}`
                    : "N/A"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{payment.transactionId || "N/A"}</td>
                <td className="min-w-48 px-4 py-3 text-slate-600">{payment.notes || "N/A"}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {payment.receiptNumber ? (
                    <span className="text-xs font-medium text-slate-500">Receipt available</span>
                  ) : (
                    <span className="text-xs text-slate-400">No action</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
