import { formatCurrencyINR } from "@/src/lib/formatters";
import type { SalonCurrentSubscription } from "@/src/types/salon-frontend";
import { CopyButton } from "@/src/components/salon/CopyButton";

export function PaymentInstructionsCard({
  subscription,
}: {
  subscription: SalonCurrentSubscription;
}) {
  const instructions = subscription.paymentInstructions;
  const amount = subscription.dueAmount || subscription.monthlyPrice;
  const note = instructions.note || `Subscription payment for ${subscription.planName}`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-pink-600">Payment Instructions</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-900">Manual payment only</h2>

      {instructions.upiId ? (
        <div className="mt-5 space-y-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-slate-500">UPI ID</p>
              <p className="font-medium text-slate-900">{instructions.upiId}</p>
            </div>
            <CopyButton text={instructions.upiId} label="Copy UPI ID" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-slate-500">Amount</p>
              <p className="font-medium text-slate-900">{formatCurrencyINR(amount)}</p>
            </div>
            <CopyButton text={String(amount)} label="Copy Amount" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-slate-500">Account name</p>
              <p className="font-medium text-slate-900">{instructions.accountName || "SalonFlow"}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-slate-500">Payment note</p>
              <p className="font-medium text-slate-900">{note}</p>
            </div>
            <CopyButton text={note} label="Copy Note" />
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Please pay before 10th to avoid access block. After payment, share transaction proof with support.
        </p>
      )}
    </section>
  );
}
