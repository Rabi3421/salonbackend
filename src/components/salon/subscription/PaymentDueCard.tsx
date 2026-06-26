import {
  formatCurrencyINR,
  formatDaysLeft,
  formatNullableDate,
} from "@/src/lib/formatters";
import type { SalonCurrentSubscription } from "@/src/types/salon-frontend";

export function PaymentDueCard({ subscription }: { subscription: SalonCurrentSubscription }) {
  const dueDate = subscription.nextDueDate;
  const graceDate = subscription.graceEndDate;
  const amount = subscription.dueAmount || subscription.monthlyPrice;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-pink-600">Next Payment</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-900">
        {formatCurrencyINR(amount)}
      </h2>
      <div className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Due date</span>
          <span className="font-medium text-slate-800">{formatNullableDate(dueDate)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Grace end</span>
          <span className="font-medium text-slate-800">{formatNullableDate(graceDate)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Due window</span>
          <span className="font-medium text-slate-800">{formatDaysLeft(dueDate) || "N/A"}</span>
        </div>
      </div>
      <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Please pay before 10th to avoid dashboard access block.
      </p>
    </section>
  );
}
