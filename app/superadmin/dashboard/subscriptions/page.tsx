"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";

import {
  getSubscriptions,
  cancelSubscription,
  checkExpiredSubscriptions,
  evaluateAllSubscriptionAccess,
  type SubscriptionListData,
  type SubscriptionListParams,
} from "@/src/lib/superadmin-api";
import { SUBSCRIPTION_STATUSES, BILLING_CYCLES } from "@/src/constants/salon";
import { StatusBadge } from "@/src/components/superadmin/StatusBadge";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";
import { EmptyState } from "@/src/components/superadmin/EmptyState";
import { ConfirmDialog } from "@/src/components/superadmin/ConfirmDialog";
import {
  formatAccessStatus,
  formatCurrencyINR,
  formatNullableDate,
  formatPlanCode,
} from "@/src/lib/formatters";
import type { SubscriptionAccessStatus } from "@/src/types/superadmin-frontend";

type FS = { data: SubscriptionListData | null; loading: boolean; error: string; key: number };
type FA = { type: "OK"; data: SubscriptionListData } | { type: "ERR"; error: string } | { type: "RE" };
function fr(s: FS, a: FA): FS {
  if (a.type === "OK") return { ...s, data: a.data, error: "", loading: false };
  if (a.type === "ERR") return { ...s, error: a.error, loading: false };
  return { ...s, loading: true, error: "", key: s.key + 1 };
}

const CARDS: { label: string; key: string; color: string }[] = [
  { label: "Total", key: "total", color: "text-slate-900" },
  { label: "Trial", key: "trial", color: "text-indigo-600" },
  { label: "Active", key: "active", color: "text-emerald-600" },
  { label: "Expired", key: "expired", color: "text-amber-600" },
  { label: "Suspended", key: "suspended", color: "text-red-600" },
  { label: "Cancelled", key: "cancelled", color: "text-slate-500" },
  { label: "Monthly", key: "monthly", color: "text-indigo-500" },
  { label: "Yearly", key: "yearly", color: "text-slate-600" },
];

const ACCESS_STATUSES: SubscriptionAccessStatus[] = [
  "trial",
  "active",
  "unpaid",
  "blocked",
  "cancelled",
];

function getAccessBadgeClass(status?: string | null) {
  const styles: Record<string, string> = {
    trial: "border-blue-200 bg-blue-50 text-blue-700",
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    payment_due: "border-yellow-200 bg-yellow-50 text-yellow-700",
    grace_period: "border-orange-200 bg-orange-50 text-orange-700",
    access_blocked: "border-red-200 bg-red-50 text-red-700",
    suspended: "border-red-200 bg-red-50 text-red-700",
    cancelled: "border-slate-200 bg-slate-100 text-slate-600",
    expired: "border-slate-200 bg-slate-100 text-slate-600",
  };
  return styles[status ?? ""] ?? "border-slate-200 bg-slate-50 text-slate-600";
}

function AccessStatusBadge({ value }: { value?: string | null }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getAccessBadgeClass(value)}`}>
      {formatAccessStatus(value)}
    </span>
  );
}

export default function SubscriptionsListPage() {
  const [st, dp] = useReducer(fr, { data: null, loading: true, error: "", key: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [accessStatus, setAccessStatus] = useState("");
  const [cycle, setCycle] = useState("");
  const [page, setPage] = useState(1);

  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState("");
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    const p: SubscriptionListParams = { page, limit: 20 };
    if (search) p.search = search;
    if (status) p.status = status;
    if (accessStatus) p.accessStatus = accessStatus;
    if (cycle) p.billingCycle = cycle;
    getSubscriptions(p)
      .then((r) => dp({ type: "OK", data: r.data! }))
      .catch((e: Error) => dp({ type: "ERR", error: e.message }));
  }, [search, status, accessStatus, cycle, page, st.key]);

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try { await cancelSubscription(cancelTarget); setCancelTarget(null); dp({ type: "RE" }); }
    catch (e) { dp({ type: "ERR", error: (e as Error).message }); setCancelTarget(null); }
    finally { setCancelling(false); }
  }

  async function handleCheckExpired() {
    setChecking(true); setCheckMsg("");
    try {
      const r = await checkExpiredSubscriptions();
      setCheckMsg(r.message); dp({ type: "RE" });
    } catch (e) { setCheckMsg((e as Error).message); }
    finally { setChecking(false); }
  }

  async function handleEvaluateAccess() {
    if (!window.confirm("Evaluate overdue subscription access now?")) return;
    setEvaluating(true); setCheckMsg("");
    try {
      const r = await evaluateAllSubscriptionAccess();
      const summary = r.data!;
      setCheckMsg(
        `Access evaluation complete. Checked ${summary.checked}, active ${summary.active}, trial ${summary.trial}, grace period ${summary.gracePeriod}, blocked ${summary.blocked}.`,
      );
      dp({ type: "RE" });
    } catch (e) { setCheckMsg((e as Error).message); }
    finally { setEvaluating(false); }
  }

  const { data, loading, error } = st;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Subscriptions</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Manage Subscriptions</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleCheckExpired} disabled={checking}
            className="shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60">
            {checking ? "Checking..." : "Check Expired"}
          </button>
          <button type="button" onClick={handleEvaluateAccess} disabled={evaluating}
            className="shrink-0 rounded-xl border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700 shadow-sm transition hover:bg-amber-50 disabled:opacity-60">
            {evaluating ? "Evaluating..." : "Evaluate Overdue Access"}
          </button>
          <Link href="/superadmin/dashboard/subscriptions/new"
            className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-indigo-700">
            Assign Subscription
          </Link>
        </div>
      </section>

      {checkMsg ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {checkMsg}
          <button type="button" onClick={() => setCheckMsg("")} className="ml-3 underline">Dismiss</button>
        </div>
      ) : null}

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
              placeholder="Search ID, salon, plan, notes..." className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
              <option value="">All statuses</option>
              {SUBSCRIPTION_STATUSES.map((s) => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
            </select>
            <select value={accessStatus} onChange={(e) => { setAccessStatus(e.target.value); setPage(1); }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
              <option value="">All access</option>
              {ACCESS_STATUSES.map((s) => (<option key={s} value={s}>{formatAccessStatus(s)}</option>))}
            </select>
            <select value={cycle} onChange={(e) => { setCycle(e.target.value); setPage(1); }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
              <option value="">All cycles</option>
              {BILLING_CYCLES.map((c) => (<option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>))}
            </select>
            <button type="submit" className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">Search</button>
          </form>
        </div>

        {loading ? <LoadingState message="Loading subscriptions..." /> :
         error ? <div className="p-4"><ErrorState message={error} onRetry={() => dp({ type: "RE" })} /></div> :
         !data || data.subscriptions.length === 0 ? <div className="p-4"><EmptyState title="No subscriptions found" /></div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Sub ID</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Salon</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Plan</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Status</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Access Status</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Cycle</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Final Monthly Price</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Next Due Date</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Grace End Date</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Payment Status</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Start</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">End</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.subscriptions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{sub.subscriptionId}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="font-medium text-slate-900">{sub.salonName || sub.salonId}</div>
                        <div className="text-xs text-slate-500">{sub.salonId}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatPlanCode(sub.planCode)}</td>
                      <td className="whitespace-nowrap px-4 py-3"><StatusBadge value={sub.status} type="account" /></td>
                      <td className="whitespace-nowrap px-4 py-3"><AccessStatusBadge value={sub.accessStatus ?? sub.status} /></td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 capitalize">{sub.billingCycle}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatCurrencyINR(sub.finalMonthlyPrice ?? sub.amount)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatNullableDate(sub.nextDueDate ?? sub.nextBillingDate)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatNullableDate(sub.nextGraceEndDate)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 capitalize">{sub.paymentStatus?.replace(/_/g, " ") ?? "N/A"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatNullableDate(sub.startDate)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatNullableDate(sub.endDate)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex gap-1">
                          <Link href={`/superadmin/dashboard/subscriptions/${sub.subscriptionId}`}
                            className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50">View</Link>
                          <Link href={`/superadmin/dashboard/subscriptions/${sub.subscriptionId}/renew`}
                            className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Renew</Link>
                          <Link href={`/superadmin/dashboard/subscriptions/${sub.subscriptionId}/change-plan`}
                            className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Plan</Link>
                          <Link href={`/superadmin/dashboard/salons/${sub.salonId}`}
                            className="rounded border border-indigo-200 px-2 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50">Manage</Link>
                          {sub.status !== "cancelled" ? (
                            <button type="button" onClick={() => setCancelTarget(sub.subscriptionId)}
                              className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50">Cancel</button>
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

      <ConfirmDialog open={!!cancelTarget} title="Cancel this subscription?"
        description="This will cancel the subscription and may deactivate the salon."
        confirmLabel="Cancel Subscription" variant="danger" loading={cancelling}
        onConfirm={handleCancel} onCancel={() => setCancelTarget(null)} />
    </div>
  );
}
