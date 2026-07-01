"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";

import {
  getEnquiries,
  updateEnquiryStatus,
  closeEnquiry,
  type EnquiryListData,
  type EnquiryListParams,
} from "@/src/lib/superadmin-api";
import { ENQUIRY_STATUSES, ENQUIRY_TYPES, ENQUIRY_PRIORITIES } from "@/src/constants/enquiry";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";
import { EmptyState } from "@/src/components/superadmin/EmptyState";
import { ConfirmDialog } from "@/src/components/superadmin/ConfirmDialog";
import {
  readInitialSuperadminSearch,
  SUPERADMIN_HEADER_SEARCH_EVENT,
  type SuperadminHeaderSearchDetail,
} from "@/src/lib/superadmin-header-search";

type FS = { data: EnquiryListData | null; loading: boolean; error: string; key: number };
type FA = { type: "OK"; data: EnquiryListData } | { type: "ERR"; error: string } | { type: "RE" };
function fr(s: FS, a: FA): FS {
  if (a.type === "OK") return { ...s, data: a.data, error: "", loading: false };
  if (a.type === "ERR") return { ...s, error: a.error, loading: false };
  return { ...s, loading: true, error: "", key: s.key + 1 };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-500 border-slate-200",
  medium: "bg-slate-100 text-slate-600 border-slate-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  urgent: "bg-red-50 text-red-700 border-red-200",
};

const ENQ_STATUS_COLORS: Record<string, string> = {
  new: "bg-indigo-50 text-indigo-700 border-indigo-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-400 border-slate-200",
  spam: "bg-red-50 text-red-700 border-red-200",
};

function EnqBadge({ value, map }: { value: string; map: Record<string, string> }) {
  const colors = map[value] ?? "bg-slate-100 text-slate-500 border-slate-200";
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${colors}`}>{value.replace(/_/g, " ")}</span>;
}

const CARDS: { label: string; key: string; color: string }[] = [
  { label: "Total", key: "total", color: "text-slate-900" },
  { label: "New", key: "new", color: "text-indigo-600" },
  { label: "In Progress", key: "inProgress", color: "text-amber-600" },
  { label: "Resolved", key: "resolved", color: "text-emerald-600" },
  { label: "Closed", key: "closed", color: "text-slate-500" },
  { label: "Spam", key: "spam", color: "text-red-600" },
  { label: "Demo Requests", key: "demoRequests", color: "text-indigo-500" },
  { label: "Support", key: "support", color: "text-slate-600" },
];

export default function EnquiriesListPage() {
  const [st, dp] = useReducer(fr, { data: null, loading: true, error: "", key: 0 });
  const [search, setSearch] = useState(readInitialSuperadminSearch);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);

  const [actionTarget, setActionTarget] = useState<{ id: string; action: string } | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const p: EnquiryListParams = { page, limit: 20 };
    if (search) p.search = search;
    if (status) p.status = status;
    if (type) p.type = type;
    if (priority) p.priority = priority;
    getEnquiries(p)
      .then((r) => dp({ type: "OK", data: r.data! }))
      .catch((e: Error) => dp({ type: "ERR", error: e.message }));
  }, [search, status, type, priority, page, st.key]);

  useEffect(() => {
    function handleHeaderSearch(event: Event) {
      const detail = (event as CustomEvent<SuperadminHeaderSearchDetail>).detail;
      if (detail?.section !== "enquiries") return;
      setSearch(detail.search);
      setPage(1);
    }

    window.addEventListener(SUPERADMIN_HEADER_SEARCH_EVENT, handleHeaderSearch);
    return () => window.removeEventListener(SUPERADMIN_HEADER_SEARCH_EVENT, handleHeaderSearch);
  }, []);

  async function handleAction() {
    if (!actionTarget) return;
    setActing(true);
    try {
      if (actionTarget.action === "spam") {
        await closeEnquiry(actionTarget.id, { status: "spam" });
      } else if (actionTarget.action === "close") {
        await closeEnquiry(actionTarget.id);
      } else {
        await updateEnquiryStatus(actionTarget.id, { status: actionTarget.action });
      }
      setActionTarget(null);
      dp({ type: "RE" });
    } catch (e) { dp({ type: "ERR", error: (e as Error).message }); setActionTarget(null); }
    finally { setActing(false); }
  }

  const { data, loading, error } = st;

  return (
    <div className="space-y-6">
      <section className="flex justify-end">
        <Link href="/superadmin/dashboard/enquiries/new"
          className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-indigo-700">
          Add Enquiry
        </Link>
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
              placeholder="Search name, phone, email, message..." className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
              <option value="">All statuses</option>
              {ENQUIRY_STATUSES.map((s) => (<option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>))}
            </select>
            <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
              <option value="">All types</option>
              {ENQUIRY_TYPES.map((t) => (<option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>))}
            </select>
            <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
              <option value="">All priorities</option>
              {ENQUIRY_PRIORITIES.map((p) => (<option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>))}
            </select>
            <button type="submit" className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">Search</button>
          </form>
        </div>

        {loading ? <LoadingState message="Loading enquiries..." /> :
         error ? <div className="p-4"><ErrorState message={error} onRetry={() => dp({ type: "RE" })} /></div> :
         !data || data.enquiries.length === 0 ? <div className="p-4"><EmptyState title="No enquiries found" /></div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">ID</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Name</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Contact</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Type</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Priority</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Status</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Salon</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Created</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.enquiries.map((enq) => (
                    <tr key={enq._id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{enq.enquiryId}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{enq.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        <div>{enq.phone || "—"}</div>
                        <div className="text-xs text-slate-500">{enq.email || "—"}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 capitalize">{enq.type.replace(/_/g, " ")}</td>
                      <td className="whitespace-nowrap px-4 py-3"><EnqBadge value={enq.priority} map={PRIORITY_COLORS} /></td>
                      <td className="whitespace-nowrap px-4 py-3"><EnqBadge value={enq.status} map={ENQ_STATUS_COLORS} /></td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{enq.salonName || enq.salonId || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{fmtDate(enq.createdAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex gap-1">
                          <Link href={`/superadmin/dashboard/enquiries/${enq.enquiryId}`}
                            className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50">View</Link>
                          {enq.status === "new" ? (
                            <button type="button" onClick={() => setActionTarget({ id: enq.enquiryId, action: "in_progress" })}
                              className="rounded border border-amber-200 px-2 py-1 text-xs font-medium text-amber-600 transition hover:bg-amber-50">Progress</button>
                          ) : null}
                          {enq.status !== "resolved" && enq.status !== "closed" && enq.status !== "spam" ? (
                            <button type="button" onClick={() => setActionTarget({ id: enq.enquiryId, action: "resolved" })}
                              className="rounded border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50">Resolve</button>
                          ) : null}
                          {enq.status !== "closed" && enq.status !== "spam" ? (
                            <button type="button" onClick={() => setActionTarget({ id: enq.enquiryId, action: "spam" })}
                              className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50">Spam</button>
                          ) : null}
                        </div>
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

      <ConfirmDialog
        open={!!actionTarget}
        title={actionTarget?.action === "spam" ? "Mark as spam?" : actionTarget?.action === "resolved" ? "Mark as resolved?" : "Update status?"}
        description={actionTarget?.action === "spam" ? "This enquiry will be marked as spam." : `Status will be changed to "${actionTarget?.action?.replace(/_/g, " ")}".`}
        confirmLabel={actionTarget?.action === "spam" ? "Mark Spam" : "Confirm"}
        variant={actionTarget?.action === "spam" ? "danger" : "default"}
        loading={acting}
        onConfirm={handleAction}
        onCancel={() => setActionTarget(null)}
      />
    </div>
  );
}
