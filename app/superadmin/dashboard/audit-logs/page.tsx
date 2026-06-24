"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";

import {
  getAuditLogs,
  type AuditLogListData,
  type AuditLogListParams,
} from "@/src/lib/superadmin-api";
import { AUDIT_CATEGORIES } from "@/src/constants/audit-log";
import { ACTOR_TYPES } from "@/src/constants/modules";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";
import { EmptyState } from "@/src/components/superadmin/EmptyState";

type FS = { data: AuditLogListData | null; loading: boolean; error: string; key: number };
type FA = { type: "OK"; data: AuditLogListData } | { type: "ERR"; error: string } | { type: "RE" };
function fr(s: FS, a: FA): FS {
  if (a.type === "OK") return { ...s, data: a.data, error: "", loading: false };
  if (a.type === "ERR") return { ...s, error: a.error, loading: false };
  return { ...s, loading: true, error: "", key: s.key + 1 };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const CAT_COLORS: Record<string, string> = {
  auth: "bg-indigo-50 text-indigo-700 border-indigo-200",
  salon: "bg-indigo-50 text-indigo-700 border-indigo-200",
  plan: "bg-slate-100 text-slate-600 border-slate-200",
  subscription: "bg-slate-100 text-slate-600 border-slate-200",
  payment: "bg-slate-100 text-slate-600 border-slate-200",
  enquiry: "bg-slate-100 text-slate-600 border-slate-200",
  settings: "bg-slate-100 text-slate-600 border-slate-200",
  system: "bg-slate-100 text-slate-400 border-slate-200",
};

function CatBadge({ value }: { value: string }) {
  const c = CAT_COLORS[value] ?? CAT_COLORS.system;
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${c}`}>{value}</span>;
}

const CARDS: { label: string; key: string; color: string }[] = [
  { label: "Total", key: "total", color: "text-slate-900" },
  { label: "Today", key: "today", color: "text-indigo-600" },
  { label: "Salon", key: "salon", color: "text-emerald-600" },
  { label: "Plan", key: "plan", color: "text-indigo-500" },
  { label: "Subscription", key: "subscription", color: "text-slate-600" },
  { label: "Payment", key: "payment", color: "text-amber-600" },
  { label: "Enquiry", key: "enquiry", color: "text-slate-600" },
  { label: "Settings", key: "settings", color: "text-slate-600" },
];

export default function AuditLogsPage() {
  const [st, dp] = useReducer(fr, { data: null, loading: true, error: "", key: 0 });
  const [search, setSearch] = useState("");
  const [actorType, setActorType] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const p: AuditLogListParams = { page, limit: 30 };
    if (search) p.search = search;
    if (actorType) p.actorType = actorType;
    if (category) p.category = category;
    getAuditLogs(p)
      .then((r) => dp({ type: "OK", data: r.data! }))
      .catch((e: Error) => dp({ type: "ERR", error: e.message }));
  }, [search, actorType, category, page, st.key]);

  const { data, loading, error } = st;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-indigo-600">Audit Logs</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Activity Log</h1>
      </section>

      {data?.summary ? (
        <section className="grid grid-cols-4 gap-3 lg:grid-cols-8">
          {CARDS.map((c) => (
            <article key={c.key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">{c.label}</p>
              <p className={`mt-2 text-2xl font-semibold ${c.color}`}>{data.summary[c.key] ?? 0}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); dp({ type: "RE" }); }}
            className="flex flex-col gap-3 sm:flex-row">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, email, entity..." className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            <select value={actorType} onChange={(e) => { setActorType(e.target.value); setPage(1); }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
              <option value="">All actors</option>
              {ACTOR_TYPES.map((t) => (<option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>))}
            </select>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
              <option value="">All categories</option>
              {AUDIT_CATEGORIES.map((c) => (<option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>))}
            </select>
            <button type="submit" className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">Search</button>
          </form>
        </div>

        {loading ? <LoadingState message="Loading audit logs..." /> :
         error ? <div className="p-4"><ErrorState message={error} onRetry={() => dp({ type: "RE" })} /></div> :
         !data || data.auditLogs.length === 0 ? <div className="p-4"><EmptyState title="No audit logs found" /></div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Date/Time</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Actor</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Type</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Action</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Category</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Entity</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Entity ID</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">IP</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{fmtDate(log.createdAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-700">{log.actorEmail || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 capitalize">{log.actorType}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-700">{log.action}</td>
                      <td className="whitespace-nowrap px-4 py-3"><CatBadge value={log.category ?? "system"} /></td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{log.entityType}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">{log.entityId || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">{log.ip || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link href={`/superadmin/dashboard/audit-logs/${log._id}`}
                          className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.pagination.totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">Page {data.pagination.page} of {data.pagination.totalPages}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40">Previous</button>
                  <button type="button" onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))} disabled={page >= data.pagination.totalPages}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40">Next</button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
