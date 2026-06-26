import {
  formatCurrencyINR,
  formatNullableDate,
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

function Badge({ value, tone = "slate" }: { value: string; tone?: "slate" | "green" | "blue" | "amber" | "red" }) {
  const styles = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${styles[tone]}`}>{value}</span>;
}

function statusTone(status: string): "slate" | "green" | "blue" | "amber" | "red" {
  if (status === "trial") return "blue";
  if (status === "active") return "green";
  if (status === "unpaid") return "amber";
  if (status === "blocked") return "red";
  return "slate";
}

export function CurrentPlanCard({ subscription }: { subscription: SalonCurrentSubscription }) {
  const included = subscription.planCode === "premium"
    ? ["All dashboards", "Full permissions", "Advanced reports/modules"]
    : ["Public website", "Owner dashboard", "Stylist dashboard"];

  const status = subscription.subscriptionStatus;
  const statusLabels: Record<string, string> = {
    trial: "Trial",
    active: "Active",
    unpaid: "Unpaid",
    blocked: "Blocked",
    cancelled: "Cancelled",
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-pink-600">Current Plan</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            {formatPlanCode(subscription.planCode)}
          </h2>
        </div>
        <Badge value={statusLabels[status] ?? status} tone={statusTone(status)} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Info label="Monthly Price" value={formatCurrencyINR(subscription.monthlyPrice)} />
        <Info label="Standard Price" value={formatCurrencyINR(subscription.standardPrice)} />
        <Info label="Minimum Price" value={formatCurrencyINR(subscription.minimumPrice)} />
        <Info label="Trial Start" value={formatNullableDate(subscription.trialStartDate)} />
        <Info label="Trial End" value={formatNullableDate(subscription.trialEndDate)} />
        <Info label="Next Due Date" value={formatNullableDate(subscription.nextDueDate)} />
        <Info label="Grace End Date" value={formatNullableDate(subscription.graceEndDate)} />
        <Info label="Last Paid Date" value={formatNullableDate(subscription.lastPaymentDate)} />
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
