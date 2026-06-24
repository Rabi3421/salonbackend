"use client";

import Link from "next/link";
import { useEffect, useReducer } from "react";
import { useParams } from "next/navigation";

import { getAuditLog, type AuditLogRecord } from "@/src/lib/superadmin-api";
import { CopyButton } from "@/src/components/superadmin/CopyButton";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";

type FS = { data: AuditLogRecord | null; loading: boolean; error: string; key: number };
type FA = { type: "OK"; data: AuditLogRecord } | { type: "ERR"; error: string } | { type: "RE" };
function fr(s: FS, a: FA): FS {
  if (a.type === "OK") return { ...s, data: a.data, error: "", loading: false };
  if (a.type === "ERR") return { ...s, error: a.error, loading: false };
  return { ...s, loading: true, error: "", key: s.key + 1 };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const CAT_COLORS: Record<string, string> = {
  auth: "bg-indigo-50 text-indigo-700 border-indigo-200",
  salon: "bg-emerald-50 text-emerald-700 border-emerald-200",
  plan: "bg-indigo-50 text-indigo-600 border-indigo-200",
  subscription: "bg-violet-50 text-violet-700 border-violet-200",
  payment: "bg-amber-50 text-amber-700 border-amber-200",
  enquiry: "bg-rose-50 text-rose-700 border-rose-200",
  settings: "bg-slate-100 text-slate-700 border-slate-200",
  system: "bg-slate-100 text-slate-500 border-slate-200",
};

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <dt className="w-36 shrink-0 text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{children}</dd>
    </div>
  );
}

function JsonBlock({ label, data }: { label: string; data: unknown }) {
  if (!data || (typeof data === "object" && Object.keys(data as object).length === 0)) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
      <pre className="mt-2 max-h-64 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export default function AuditLogDetailPage() {
  const params = useParams<{ auditLogId: string }>();
  const auditLogId = params.auditLogId;

  const [st, dp] = useReducer(fr, { data: null, loading: true, error: "", key: 0 });

  useEffect(() => {
    getAuditLog(auditLogId)
      .then((r) => dp({ type: "OK", data: r.data!.auditLog }))
      .catch((e: Error) => dp({ type: "ERR", error: e.message }));
  }, [auditLogId, st.key]);

  const { data: log, loading, error } = st;
  if (loading) return <LoadingState message="Loading audit log..." />;
  if (error) return <ErrorState message={error} onRetry={() => dp({ type: "RE" })} />;
  if (!log) return <ErrorState message="Audit log not found." />;

  const catColors = CAT_COLORS[log.category ?? "system"] ?? CAT_COLORS.system;

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/superadmin/dashboard/audit-logs" className="hover:text-slate-700">Audit Logs</Link>
          <span>/</span><span className="text-slate-900">Detail</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Audit Log Detail</h1>
          <Link href="/superadmin/dashboard/audit-logs"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">Back</Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Action</h2>
          <dl className="mt-4 space-y-3">
            <Info label="Action">
              <span className="font-mono text-xs">{log.action}</span>
            </Info>
            <Info label="Label">{log.actionLabel ?? log.action}</Info>
            <Info label="Category">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${catColors}`}>
                {log.category ?? "system"}
              </span>
            </Info>
            <Info label="Timestamp">{fmtDate(log.createdAt)}</Info>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Actor</h2>
          <dl className="mt-4 space-y-3">
            <Info label="Type"><span className="capitalize">{log.actorType}</span></Info>
            <Info label="Email">{log.actorEmail || "—"}</Info>
            <Info label="Actor ID">{log.actorId || "—"}</Info>
            <Info label="IP">{log.ip || "—"}</Info>
            <Info label="User Agent">
              <span className="text-xs text-slate-500 break-all">{log.userAgent || "—"}</span>
            </Info>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Entity</h2>
          <dl className="mt-4 space-y-3">
            <Info label="Entity Type">{log.entityType}</Info>
            <Info label="Entity ID">
              {log.entityId ? (
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs">{log.entityId}</span>
                  <CopyButton text={log.entityId} />
                </span>
              ) : "—"}
            </Info>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Changes</h2>
          <div className="mt-4 space-y-4">
            <JsonBlock label="Before" data={log.before} />
            <JsonBlock label="After" data={log.after} />
            {!log.before && !log.after ? (
              <p className="text-sm text-slate-500">No change data recorded.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
