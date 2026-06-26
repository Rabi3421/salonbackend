"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";

import {
  getPayments,
  markPaymentPaid,
  refundPayment,
  type PaymentListData,
  type PaymentListParams,
} from "@/src/lib/superadmin-api";
import { PAYMENT_STATUSES, PAYMENT_METHODS } from "@/src/constants/salon";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";
import { EmptyState } from "@/src/components/superadmin/EmptyState";
import { ConfirmDialog } from "@/src/components/superadmin/ConfirmDialog";

type FS = { data: PaymentListData | null; loading: boolean; error: string; key: number };
type FA = { type: "OK"; data: PaymentListData } | { type: "ERR"; error: string } | { type: "RE" };
function fr(s: FS, a: FA): FS {
  if (a.type === "OK") return { ...s, data: a.data, error: "", loading: false };
  if (a.type === "ERR") return { ...s, error: a.error, loading: false };
  return { ...s, loading: true, error: "", key: s.key + 1 };
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const PAYMENT_BADGE_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-slate-100 text-slate-500 border-slate-200",
};

function PaymentBadge({ value }: { value: string }) {
  const colors = PAYMENT_BADGE_COLORS[value] ?? "bg-slate-100 text-slate-500 border-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${colors}`}>
      {value}
    </span>
  );
}

const SUMMARY_CARDS: { label: string; key: string; color: string; format?: "currency" }[] = [
  { label: "Total", key: "total", color: "text-slate-900" },
  { label: "Paid", key: "paid", color: "text-emerald-600" },
  { label: "Pending", key: "pending", color: "text-amber-600" },
  { label: "Failed", key: "failed", color: "text-red-600" },
  { label: "Refunded", key: "refunded", color: "text-slate-500" },
  { label: "Total Paid", key: "totalPaidAmount", color: "text-emerald-600", format: "currency" },
  { label: "Pending Amt", key: "pendingAmount", color: "text-amber-600", format: "currency" },
  { label: "This Month", key: "monthlyPaidAmount", color: "text-indigo-500", format: "currency" },
];

export default function PaymentsListPage() {
  const [st, dp] = useReducer(fr, { data: null, loading: true, error: "", key: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);

  const [actionTarget, setActionTarget] = useState<{ id: string; action: "paid" | "refund" } | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const p: PaymentListParams = { page, limit: 20 };
    if (search) p.search = search;
    if (status) p.status = status;
    if (method) p.method = method;
    getPayments(p)
      .then((r) => dp({ type: "OK", data: r.data! }))
      .catch((e: Error) => dp({ type: "ERR", error: e.message }));
  }, [search, status, method, page, st.key]);

  async function handleAction() {
    if (!actionTarget) return;
    setActing(true);
    try {
      if (actionTarget.action === "paid") await markPaymentPaid(actionTarget.id);
      else await refundPayment(actionTarget.id);
      setActionTarget(null);
      dp({ type: "RE" });
    } catch (e) { dp({ type: "ERR", error: (e as Error).message }); setActionTarget(null); }
    finally { setActing(false); }
  }

  const { data, loading, error } = st;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Payments</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Platform Payments</h1>
        </div>
        <Link href="/superadmin/dashboard/payments/new"
          className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-indigo-700">
          Add Payment
        </Link>
      </section>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Paid subscription payments will automatically reactivate salon access and move next due date to next month&apos;s 5th.
      </div>

      {data?.summary ? (
        <section className="grid grid-cols-4 gap-3 lg:grid-cols-8">
          {SUMMARY_CARDS.map((c) => (
            <article key={c.key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">{c.label}</p>
              <p className={`mt-2 text-xl font-semibold ${c.color}`}>
                {c.format === "currency" ? fmtPrice(data.summary[c.key] ?? 0) : (data.summary[c.key] ?? 0)}
              </p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); dp({ type: "RE" }); }}
            className="flex flex-col gap-3 sm:flex-row">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, salon, transaction..." className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
              <option value="">All statuses</option>
              {PAYMENT_STATUSES.map((s) => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
            </select>
            <select value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
              <option value="">All methods</option>
              {PAYMENT_METHODS.map((m) => (<option key={m} value={m}>{m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>))}
            </select>
            <button type="submit" className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">Search</button>
          </form>
        </div>

        {loading ? <LoadingState message="Loading payments..." /> :
         error ? <div className="p-4"><ErrorState message={error} onRetry={() => dp({ type: "RE" })} /></div> :
         !data || data.payments.length === 0 ? <div className="p-4"><EmptyState title="No payments found" /></div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Payment ID</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Salon</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Method</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Status</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Amount</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Transaction</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Paid At</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Created</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.payments.map((pay) => (
                    <tr key={pay._id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{pay.paymentId}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="font-medium text-slate-900">{pay.salonName || pay.salonId}</div>
                        <div className="text-xs text-slate-500">{pay.salonId}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 capitalize">{pay.method.replace(/_/g, " ")}</td>
                      <td className="whitespace-nowrap px-4 py-3"><PaymentBadge value={pay.status} /></td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{fmtPrice(pay.amount)}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">{pay.transactionId || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{fmtDate(pay.paidAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{fmtDate(pay.createdAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex gap-1">
                          <Link href={`/superadmin/dashboard/payments/${pay.paymentId}`}
                            className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50">View</Link>
                          {pay.status === "pending" ? (
                            <button type="button" onClick={() => setActionTarget({ id: pay.paymentId, action: "paid" })}
                              className="rounded border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50">Paid</button>
                          ) : null}
                          {pay.status === "paid" ? (
                            <button type="button" onClick={() => setActionTarget({ id: pay.paymentId, action: "refund" })}
                              className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50">Refund</button>
                          ) : null}
                          <Link href={`/superadmin/dashboard/payments/${pay.paymentId}/edit`}
                            className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Edit</Link>
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
        title={actionTarget?.action === "paid" ? "Mark as paid?" : "Refund this payment?"}
        description={actionTarget?.action === "paid" ? "This will mark the payment as paid and may activate the linked subscription." : "This will mark the payment as refunded."}
        confirmLabel={actionTarget?.action === "paid" ? "Mark Paid" : "Refund"}
        variant={actionTarget?.action === "refund" ? "danger" : "default"}
        loading={acting}
        onConfirm={handleAction}
        onCancel={() => setActionTarget(null)}
      />
    </div>
  );
}
