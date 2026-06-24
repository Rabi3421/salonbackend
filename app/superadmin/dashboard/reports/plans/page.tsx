"use client";

import Link from "next/link";
import { useEffect, useReducer } from "react";
import { getPlanUsageReport } from "@/src/lib/superadmin-api";
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
function fmtC(n: unknown) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n) || 0); }

export default function PlanUsageReportPage() {
  const [st, dp] = useReducer(fr, { data: null, loading: true, error: "", key: 0 });

  useEffect(() => {
    getPlanUsageReport()
      .then((r) => dp({ type: "OK", data: r.data! }))
      .catch((e: Error) => dp({ type: "ERR", error: e.message }));
  }, [st.key]);

  const { data, loading, error } = st;
  const d = data ?? {};
  const plans = (d.planUsage ?? []) as { planCode: string; name: string; monthlyPrice: number; yearlyPrice: number; isActive: boolean; salonsUsingPlan: number; activeSubscriptions: number; totalRevenue: number }[];
  const modules = (d.moduleUsage ?? []) as { moduleKey: string; label: string; planCount: number }[];

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/superadmin/dashboard/reports" className="hover:text-slate-700">Reports</Link><span>/</span><span className="text-slate-900">Plans</span></div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Plan Usage Report</h1>
      </section>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={() => dp({ type: "RE" })} /> : (
        <>
          <section className="grid grid-cols-3 gap-3">
            <MetricCard label="Total Plans" value={Number(d.totalPlans)} />
            <MetricCard label="Active" value={Number(d.activePlans)} color="text-emerald-600" />
            <MetricCard label="Inactive" value={Number(d.inactivePlans)} color="text-slate-500" />
          </section>

          {plans.length > 0 ? (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Plan Usage</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 font-medium text-slate-600">Plan</th>
                    <th className="px-3 py-2 font-medium text-slate-600">Monthly</th>
                    <th className="px-3 py-2 font-medium text-slate-600">Yearly</th>
                    <th className="px-3 py-2 font-medium text-slate-600">Salons</th>
                    <th className="px-3 py-2 font-medium text-slate-600">Active Subs</th>
                    <th className="px-3 py-2 font-medium text-slate-600">Revenue</th>
                    <th className="px-3 py-2 font-medium text-slate-600">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {plans.map((p) => (
                      <tr key={p.planCode} className="hover:bg-slate-50">
                        <td className="px-3 py-2"><Link href={`/superadmin/dashboard/plans/${p.planCode}`} className="font-medium text-indigo-600 hover:underline">{p.name}</Link><div className="font-mono text-xs text-slate-500">{p.planCode}</div></td>
                        <td className="px-3 py-2 text-slate-700">{fmtC(p.monthlyPrice)}</td>
                        <td className="px-3 py-2 text-slate-700">{fmtC(p.yearlyPrice)}</td>
                        <td className="px-3 py-2 text-slate-600">{p.salonsUsingPlan}</td>
                        <td className="px-3 py-2 text-emerald-600">{p.activeSubscriptions}</td>
                        <td className="px-3 py-2 font-medium text-slate-900">{fmtC(p.totalRevenue)}</td>
                        <td className="px-3 py-2 text-xs capitalize">{p.isActive ? <span className="text-emerald-600">active</span> : <span className="text-slate-500">inactive</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {modules.length > 0 ? (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Module Usage Across Plans</h2>
              <div className="mt-4"><SimpleBar items={modules.map((m) => ({ label: m.label, value: m.planCount }))} /></div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
