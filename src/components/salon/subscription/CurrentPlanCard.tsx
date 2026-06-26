import {
  formatAccessStatus,
  formatCurrencyINR,
  formatNullableDate,
  formatPaymentStatus,
  formatPlanCode,
} from "@/src/lib/formatters";
import type { SalonCurrentSubscription } from "@/src/types/salon-frontend";

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function Badge({ value, tone = "slate" }: { value: string; tone?: "slate" | "green" | "blue" | "orange" | "red" }) {
  const styles = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    red: "border-red-200 bg-red-50 text-red-700",
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${styles[tone]}`}>{value}</span>;
}

function accessTone(status: string) {
  if (status === "trial") return "blue";
  if (status === "active") return "green";
  if (status === "payment_due" || status === "grace_period") return "orange";
  if (status === "access_blocked" || status === "suspended") return "red";
  return "slate";
}

export function CurrentPlanCard({ subscription }: { subscription: SalonCurrentSubscription }) {
  const included = subscription.planCode === "premium"
    ? ["All dashboards", "Full permissions", "Advanced reports/modules"]
    : ["Public website", "Owner dashboard", "Stylist dashboard"];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-pink-600">Current Plan</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            {subscription.planName || formatPlanCode(subscription.planCode)}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge value={formatAccessStatus(subscription.accessStatus)} tone={accessTone(subscription.accessStatus)} />
          <Badge value={formatAccessStatus(subscription.subscriptionStatus)} tone={accessTone(subscription.subscriptionStatus)} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Info label="Plan Code" value={formatPlanCode(subscription.planCode)} />
        <Info label="Final Monthly Price" value={formatCurrencyINR(subscription.finalMonthlyPrice)} />
        <Info label="Standard Monthly Price" value={formatCurrencyINR(subscription.standardMonthlyPrice)} />
        <Info label="Minimum Monthly Price" value={formatCurrencyINR(subscription.minimumMonthlyPrice)} />
        <Info label="Trial Start" value={formatNullableDate(subscription.trialStartDate)} />
        <Info label="Trial End" value={formatNullableDate(subscription.trialEndDate)} />
        <Info label="Next Due Date" value={formatNullableDate(subscription.nextDueDate)} />
        <Info label="Grace End Date" value={formatNullableDate(subscription.nextGraceEndDate)} />
        <Info label="Last Paid Date" value={formatNullableDate(subscription.lastPaidAt)} />
        <Info label="Payment Status" value={formatPaymentStatus(subscription.paymentStatus)} />
      </div>

      <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">Included</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {included.map((item) => (
            <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
