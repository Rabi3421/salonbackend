"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { getPaymentReport } from "@/src/lib/superadmin-api";
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
function fmtDate(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }

export default function PaymentReportPage() {
  const [st, dp] = useReducer(fr, { data: null, loading: true, error: "", key: 0 });
  const [range, setRange] = useState("this_month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  function load() { dp({ type: "RE" }); }

  useEffect(() => {
    getPaymentReport({ range, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
      .then((r) => dp({ type: "OK", data: r.data! }))
      .catch((e: Error) => dp({ type: "ERR", error: e.message }));
  }, [st.key, range, dateFrom, dateTo]);

  const { data, loading, error } = st;
  const d = data ?? {};
  const statuses = (d.statusBreakdown ?? []) as { status: string; count: number; amount: number }[];
  const methods = (d.methodBreakdown ?? []) as { method: string; count: number; amount: number }[];
  const recent = (d.recentPayments ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/superadmin/dashboard/reports" className="hover:text-slate-700">Reports</Link><span>/</span><span className="text-slate-900">Payments</span></div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Payment Report</h1>
      </section>
      <ReportRangeSelector range={range} dateFrom={dateFrom} dateTo={dateTo} onRangeChange={setRange} onDateFromChange={setDateFrom} onDateToChange={setDateTo} onApply={load} />
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Total Paid" value={fmtC(d.totalPaidAmount)} color="text-emerald-600" />
            <MetricCard label="Pending" value={fmtC(d.pendingAmount)} color="text-amber-600" />
            <MetricCard label="Paid Count" value={Number(d.paidPayments)} color="text-emerald-600" />
            <MetricCard label="Pending Count" value={Number(d.pendingPayments)} color="text-amber-600" />
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            {statuses.length > 0 ? (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">By Status</h2>
                <table className="mt-4 w-full text-left text-sm"><thead><tr className="border-b border-slate-200"><th className="px-3 py-2 font-medium text-slate-600">Status</th><th className="px-3 py-2 font-medium text-slate-600">Count</th><th className="px-3 py-2 font-medium text-slate-600">Amount</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{statuses.map((s) => (<tr key={s.status} className="hover:bg-slate-50"><td className="px-3 py-2 capitalize text-slate-700">{s.status}</td><td className="px-3 py-2 text-slate-600">{s.count}</td><td className="px-3 py-2 font-medium text-slate-900">{fmtC(s.amount)}</td></tr>))}</tbody></table>
              </section>
            ) : null}
            {methods.length > 0 ? (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">By Method</h2>
                <table className="mt-4 w-full text-left text-sm"><thead><tr className="border-b border-slate-200"><th className="px-3 py-2 font-medium text-slate-600">Method</th><th className="px-3 py-2 font-medium text-slate-600">Count</th><th className="px-3 py-2 font-medium text-slate-600">Amount</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{methods.map((m) => (<tr key={m.method} className="hover:bg-slate-50"><td className="px-3 py-2 capitalize text-slate-700">{m.method.replace(/_/g, " ")}</td><td className="px-3 py-2 text-slate-600">{m.count}</td><td className="px-3 py-2 font-medium text-slate-900">{fmtC(m.amount)}</td></tr>))}</tbody></table>
              </section>
            ) : null}
          </div>
          {recent.length > 0 ? (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Recent Payments</h2>
              <table className="mt-4 w-full text-left text-sm"><thead><tr className="border-b border-slate-200"><th className="px-3 py-2 font-medium text-slate-600">ID</th><th className="px-3 py-2 font-medium text-slate-600">Salon</th><th className="px-3 py-2 font-medium text-slate-600">Amount</th><th className="px-3 py-2 font-medium text-slate-600">Status</th><th className="px-3 py-2 font-medium text-slate-600">Method</th><th className="px-3 py-2 font-medium text-slate-600">Date</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{recent.map((p) => (<tr key={p.paymentId as string} className="hover:bg-slate-50"><td className="px-3 py-2"><Link href={`/superadmin/dashboard/payments/${p.paymentId}`} className="font-mono text-xs text-indigo-600 hover:underline">{p.paymentId as string}</Link></td><td className="px-3 py-2 text-slate-700">{(p.salonName as string) || (p.salonId as string)}</td><td className="px-3 py-2 font-medium text-slate-900">{fmtC(p.amount)}</td><td className="px-3 py-2 text-xs capitalize text-slate-600">{p.status as string}</td><td className="px-3 py-2 text-xs capitalize text-slate-600">{(p.method as string).replace(/_/g, " ")}</td><td className="px-3 py-2 text-xs text-slate-500">{fmtDate(p.createdAt as string)}</td></tr>))}</tbody></table>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
