"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";

import { getOverviewReport } from "@/src/lib/superadmin-api";
import { ReportRangeSelector } from "@/src/components/superadmin/ReportRangeSelector";
import { MetricCard } from "@/src/components/superadmin/MetricCard";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";

type FS = { data: Record<string, unknown> | null; loading: boolean; error: string; key: number };
type FA = { type: "OK"; data: Record<string, unknown> } | { type: "ERR"; error: string } | { type: "RE" };
function fr(s: FS, a: FA): FS {
  if (a.type === "OK") return { ...s, data: a.data, error: "", loading: false };
  if (a.type === "ERR") return { ...s, error: a.error, loading: false };
  return { ...s, loading: true, error: "", key: s.key + 1 };
}

function fmtCurrency(n: unknown) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);
}

const REPORT_LINKS = [
  { label: "Revenue Report", href: "/superadmin/dashboard/reports/revenue", color: "text-emerald-600" },
  { label: "Salon Report", href: "/superadmin/dashboard/reports/salons", color: "text-indigo-600" },
  { label: "Subscription Report", href: "/superadmin/dashboard/reports/subscriptions", color: "text-slate-600" },
  { label: "Payment Report", href: "/superadmin/dashboard/reports/payments", color: "text-amber-600" },
  { label: "Enquiry Report", href: "/superadmin/dashboard/reports/enquiries", color: "text-slate-600" },
  { label: "Plan Usage Report", href: "/superadmin/dashboard/reports/plans", color: "text-indigo-500" },
];

export default function ReportsMainPage() {
  const [st, dp] = useReducer(fr, { data: null, loading: true, error: "", key: 0 });
  const [range, setRange] = useState("this_month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  function load() {
    dp({ type: "RE" });
  }

  useEffect(() => {
    getOverviewReport({ range, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
      .then((r) => dp({ type: "OK", data: r.data! }))
      .catch((e: Error) => dp({ type: "ERR", error: e.message }));
  }, [st.key, range, dateFrom, dateTo]);

  const { data, loading, error } = st;

  return (
    <div className="space-y-6">
      <ReportRangeSelector range={range} dateFrom={dateFrom} dateTo={dateTo}
        onRangeChange={setRange} onDateFromChange={setDateFrom} onDateToChange={setDateTo} onApply={load} />

      {loading ? <LoadingState message="Loading report..." /> :
       error ? <ErrorState message={error} onRetry={load} /> :
       !data ? <ErrorState message="No data." /> : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Revenue in Range" value={fmtCurrency(data.totalRevenueInRange)} color="text-emerald-600" />
            <MetricCard label="New Salons" value={Number(data.newSalonsInRange)} color="text-blue-600" />
            <MetricCard label="Active Salons" value={Number(data.activeSalons)} color="text-emerald-600" />
            <MetricCard label="Pending Payments" value={fmtCurrency(data.pendingPaymentAmount)} color="text-amber-600" />
            <MetricCard label="New Enquiries" value={Number(data.newEnquiriesInRange)} color="text-blue-600" />
            <MetricCard label="Open Enquiries" value={Number(data.openEnquiries)} color="text-amber-600" />
            <MetricCard label="Active Subscriptions" value={Number(data.activeSubscriptions)} color="text-violet-600" />
            <MetricCard label="Expiring Trials (7d)" value={Number(data.expiringTrialsNext7Days)} color="text-red-600" />
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {REPORT_LINKS.map((link) => (
              <Link key={link.href} href={link.href}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
                <p className={`text-base font-semibold ${link.color}`}>{link.label}</p>
                <p className="mt-1 text-xs text-slate-500">View detailed breakdown</p>
              </Link>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
