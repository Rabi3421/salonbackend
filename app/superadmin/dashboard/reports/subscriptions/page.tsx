"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { getSubscriptionReport } from "@/src/lib/superadmin-api";
import { ReportRangeSelector } from "@/src/components/superadmin/ReportRangeSelector";
import { MetricCard } from "@/src/components/superadmin/MetricCard";
import { SimpleBar } from "@/src/components/superadmin/SimpleBar";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";

type FS = { data: Record<string, unknown> | null; loading: boolean; error: string; key: number };
type FA = { type: "OK"; data: Record<string, unknown> } | { type: "ERR"; error: string } | { type: "RE" };
function fr(s: FS, a: FA): FS {
  if (a.type === "OK") return { ...s, data: a.data, error: "", loading: false };
  if (a.type === "ERR") return { ...s, error: a.error, loading: false };
  return { ...s, loading: true, error: "", key: s.key + 1 };
}
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }

export default function SubscriptionReportPage() {
  const [st, dp] = useReducer(fr, { data: null, loading: true, error: "", key: 0 });
  const [range, setRange] = useState("this_month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  function load() { dp({ type: "RE" }); }

  useEffect(() => {
    getSubscriptionReport({ range, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
      .then((r) => dp({ type: "OK", data: r.data! }))
      .catch((e: Error) => dp({ type: "ERR", error: e.message }));
  }, [st.key, range, dateFrom, dateTo]);

  const { data, loading, error } = st;
  const d = data ?? {};
  const cycleBreakdown = (d.billingCycleBreakdown ?? {}) as Record<string, number>;
  const plans = (d.planBreakdown ?? []) as { planCode: string; count: number; activeCount: number }[];
  const expiring = (d.expiringSoon ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/superadmin/dashboard/reports" className="hover:text-slate-700">Reports</Link><span>/</span><span className="text-slate-900">Subscriptions</span></div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Subscription Report</h1>
      </section>
      <ReportRangeSelector range={range} dateFrom={dateFrom} dateTo={dateTo} onRangeChange={setRange} onDateFromChange={setDateFrom} onDateToChange={setDateTo} onApply={load} />
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Total" value={Number(d.totalSubscriptions)} />
            <MetricCard label="New in Range" value={Number(d.newSubscriptionsInRange)} color="text-blue-600" />
            <MetricCard label="Active" value={Number(d.activeSubscriptions)} color="text-emerald-600" />
            <MetricCard label="Trial" value={Number(d.trialSubscriptions)} color="text-blue-600" />
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Billing Cycle</h2>
              <div className="mt-4"><SimpleBar items={Object.entries(cycleBreakdown).map(([label, value]) => ({ label, value }))} /></div>
            </section>
            {plans.length > 0 ? (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">By Plan</h2>
                <table className="mt-4 w-full text-left text-sm"><thead><tr className="border-b border-slate-200"><th className="px-3 py-2 font-medium text-slate-600">Plan</th><th className="px-3 py-2 font-medium text-slate-600">Total</th><th className="px-3 py-2 font-medium text-slate-600">Active</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{plans.map((p) => (<tr key={p.planCode} className="hover:bg-slate-50"><td className="px-3 py-2 font-mono text-xs text-slate-700">{p.planCode}</td><td className="px-3 py-2 text-slate-600">{p.count}</td><td className="px-3 py-2 text-emerald-600">{p.activeCount}</td></tr>))}</tbody></table>
              </section>
            ) : null}
          </div>
          {expiring.length > 0 ? (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Expiring Soon (7 days)</h2>
              <table className="mt-4 w-full text-left text-sm"><thead><tr className="border-b border-slate-200"><th className="px-3 py-2 font-medium text-slate-600">Sub ID</th><th className="px-3 py-2 font-medium text-slate-600">Salon</th><th className="px-3 py-2 font-medium text-slate-600">Plan</th><th className="px-3 py-2 font-medium text-slate-600">Status</th><th className="px-3 py-2 font-medium text-slate-600">End Date</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{expiring.map((s) => (<tr key={s.subscriptionId as string} className="hover:bg-slate-50"><td className="px-3 py-2"><Link href={`/superadmin/dashboard/subscriptions/${s.subscriptionId}`} className="font-mono text-xs text-indigo-600 hover:underline">{s.subscriptionId as string}</Link></td><td className="px-3 py-2 text-slate-700">{(s.salonName as string) || (s.salonId as string)}</td><td className="px-3 py-2 font-mono text-xs text-slate-600">{s.planCode as string}</td><td className="px-3 py-2 text-xs capitalize text-slate-600">{s.status as string}</td><td className="px-3 py-2 text-xs text-red-600">{fmtDate(s.endDate as string)}</td></tr>))}</tbody></table>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
