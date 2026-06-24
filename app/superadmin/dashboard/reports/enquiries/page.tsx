"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { getEnquiryReport } from "@/src/lib/superadmin-api";
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

export default function EnquiryReportPage() {
  const [st, dp] = useReducer(fr, { data: null, loading: true, error: "", key: 0 });
  const [range, setRange] = useState("this_month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  function load() { dp({ type: "RE" }); }

  useEffect(() => {
    getEnquiryReport({ range, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
      .then((r) => dp({ type: "OK", data: r.data! }))
      .catch((e: Error) => dp({ type: "ERR", error: e.message }));
  }, [st.key, range, dateFrom, dateTo]);

  const { data, loading, error } = st;
  const d = data ?? {};
  const types = (d.typeBreakdown ?? []) as { type: string; count: number }[];
  const priorities = (d.priorityBreakdown ?? []) as { priority: string; count: number }[];
  const statuses = (d.statusBreakdown ?? []) as { status: string; count: number }[];
  const recent = (d.recentEnquiries ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/superadmin/dashboard/reports" className="hover:text-slate-700">Reports</Link><span>/</span><span className="text-slate-900">Enquiries</span></div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Enquiry Report</h1>
      </section>
      <ReportRangeSelector range={range} dateFrom={dateFrom} dateTo={dateTo} onRangeChange={setRange} onDateFromChange={setDateFrom} onDateToChange={setDateTo} onApply={load} />
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Total" value={Number(d.totalEnquiries)} />
            <MetricCard label="New in Range" value={Number(d.newEnquiriesInRange)} color="text-blue-600" />
            <MetricCard label="Open" value={Number(d.openEnquiries)} color="text-amber-600" />
            <MetricCard label="Resolved" value={Number(d.resolvedEnquiries)} color="text-emerald-600" />
          </section>
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">By Type</h2>
              <div className="mt-4"><SimpleBar items={types.map((t) => ({ label: t.type, value: t.count }))} /></div>
            </section>
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">By Priority</h2>
              <div className="mt-4"><SimpleBar items={priorities.map((p) => ({ label: p.priority, value: p.count }))} /></div>
            </section>
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">By Status</h2>
              <div className="mt-4"><SimpleBar items={statuses.map((s) => ({ label: s.status, value: s.count }))} /></div>
            </section>
          </div>
          {recent.length > 0 ? (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Recent Enquiries</h2>
              <table className="mt-4 w-full text-left text-sm"><thead><tr className="border-b border-slate-200"><th className="px-3 py-2 font-medium text-slate-600">ID</th><th className="px-3 py-2 font-medium text-slate-600">Name</th><th className="px-3 py-2 font-medium text-slate-600">Type</th><th className="px-3 py-2 font-medium text-slate-600">Priority</th><th className="px-3 py-2 font-medium text-slate-600">Status</th><th className="px-3 py-2 font-medium text-slate-600">Date</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{recent.map((e) => (<tr key={e.enquiryId as string} className="hover:bg-slate-50"><td className="px-3 py-2"><Link href={`/superadmin/dashboard/enquiries/${e.enquiryId}`} className="font-mono text-xs text-indigo-600 hover:underline">{e.enquiryId as string}</Link></td><td className="px-3 py-2 text-slate-700">{e.name as string}</td><td className="px-3 py-2 text-xs capitalize text-slate-600">{(e.type as string).replace(/_/g, " ")}</td><td className="px-3 py-2 text-xs capitalize text-slate-600">{e.priority as string}</td><td className="px-3 py-2 text-xs capitalize text-slate-600">{(e.status as string).replace(/_/g, " ")}</td><td className="px-3 py-2 text-xs text-slate-500">{fmtDate(e.createdAt as string)}</td></tr>))}</tbody></table>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
