"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";

import { getRevenueReport } from "@/src/lib/superadmin-api";
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
function fmtC(n: unknown) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0); }

export default function RevenueReportPage() {
  const [st, dp] = useReducer(fr, { data: null, loading: true, error: "", key: 0 });
  const [range, setRange] = useState("this_month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  function load() { dp({ type: "RE" }); }

  useEffect(() => {
    getRevenueReport({ range, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
      .then((r) => dp({ type: "OK", data: r.data! }))
      .catch((e: Error) => dp({ type: "ERR", error: e.message }));
  }, [st.key, range, dateFrom, dateTo]);

  const { data, loading, error } = st;
  const d = data ?? {};
  const methods = (d.methodBreakdown ?? []) as { method: string; count: number; amount: number }[];
  const monthly = (d.monthlyBreakdown ?? []) as { label: string; count: number; amount: number }[];
  const top = (d.topPayingSalons ?? []) as { salonId: string; salonName: string; amount: number; paymentCount: number }[];

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/superadmin/dashboard/reports" className="hover:text-slate-700">Reports</Link>
          <span>/</span><span className="text-slate-900">Revenue</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Revenue Report</h1>
      </section>
      <ReportRangeSelector range={range} dateFrom={dateFrom} dateTo={dateTo} onRangeChange={setRange} onDateFromChange={setDateFrom} onDateToChange={setDateTo} onApply={load} />
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <MetricCard label="Total Paid" value={fmtC(d.totalPaid)} color="text-emerald-600" />
            <MetricCard label="Total Pending" value={fmtC(d.totalPending)} color="text-amber-600" />
            <MetricCard label="Total Refunded" value={fmtC(d.totalRefunded)} color="text-red-600" />
            <MetricCard label="Paid Count" value={Number(d.paidCount)} color="text-emerald-600" />
            <MetricCard label="Pending Count" value={Number(d.pendingCount)} color="text-amber-600" />
            <MetricCard label="Refunded Count" value={Number(d.refundedCount)} color="text-red-600" />
          </section>
          {methods.length > 0 ? (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">By Payment Method</h2>
              <table className="mt-4 w-full text-left text-sm"><thead><tr className="border-b border-slate-200"><th className="px-3 py-2 font-medium text-slate-600">Method</th><th className="px-3 py-2 font-medium text-slate-600">Count</th><th className="px-3 py-2 font-medium text-slate-600">Amount</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{methods.map((m) => (<tr key={m.method} className="hover:bg-slate-50"><td className="px-3 py-2 capitalize text-slate-700">{m.method.replace(/_/g, " ")}</td><td className="px-3 py-2 text-slate-600">{m.count}</td><td className="px-3 py-2 font-medium text-slate-900">{fmtC(m.amount)}</td></tr>))}</tbody></table>
            </section>
          ) : null}
          {monthly.length > 0 ? (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Monthly Breakdown</h2>
              <table className="mt-4 w-full text-left text-sm"><thead><tr className="border-b border-slate-200"><th className="px-3 py-2 font-medium text-slate-600">Month</th><th className="px-3 py-2 font-medium text-slate-600">Payments</th><th className="px-3 py-2 font-medium text-slate-600">Amount</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{monthly.map((m) => (<tr key={m.label} className="hover:bg-slate-50"><td className="px-3 py-2 text-slate-700">{m.label}</td><td className="px-3 py-2 text-slate-600">{m.count}</td><td className="px-3 py-2 font-medium text-slate-900">{fmtC(m.amount)}</td></tr>))}</tbody></table>
            </section>
          ) : null}
          {top.length > 0 ? (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Top Paying Salons</h2>
              <table className="mt-4 w-full text-left text-sm"><thead><tr className="border-b border-slate-200"><th className="px-3 py-2 font-medium text-slate-600">Salon</th><th className="px-3 py-2 font-medium text-slate-600">Payments</th><th className="px-3 py-2 font-medium text-slate-600">Amount</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{top.map((s) => (<tr key={s.salonId} className="hover:bg-slate-50"><td className="px-3 py-2"><Link href={`/superadmin/dashboard/salons/${s.salonId}`} className="text-indigo-600 hover:underline">{s.salonName}</Link></td><td className="px-3 py-2 text-slate-600">{s.paymentCount}</td><td className="px-3 py-2 font-medium text-slate-900">{fmtC(s.amount)}</td></tr>))}</tbody></table>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
