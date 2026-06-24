"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { useParams } from "next/navigation";

import { getPayment, markPaymentPaid, refundPayment, type PaymentDetailData } from "@/src/lib/superadmin-api";
import { CopyButton } from "@/src/components/superadmin/CopyButton";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";
import { ConfirmDialog } from "@/src/components/superadmin/ConfirmDialog";

type FS = { data: PaymentDetailData | null; loading: boolean; error: string; key: number };
type FA = { type: "OK"; data: PaymentDetailData } | { type: "ERR"; error: string } | { type: "RE" };
function fr(s: FS, a: FA): FS {
  if (a.type === "OK") return { ...s, data: a.data, error: "", loading: false };
  if (a.type === "ERR") return { ...s, error: a.error, loading: false };
  return { ...s, loading: true, error: "", key: s.key + 1 };
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const BADGE_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-slate-100 text-slate-500 border-slate-200",
};

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <dt className="w-44 shrink-0 text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export default function PaymentDetailPage() {
  const params = useParams<{ paymentId: string }>();
  const paymentId = params.paymentId;

  const [st, dp] = useReducer(fr, { data: null, loading: true, error: "", key: 0 });
  const [actionTarget, setActionTarget] = useState<"paid" | "refund" | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    getPayment(paymentId)
      .then((r) => dp({ type: "OK", data: r.data! }))
      .catch((e: Error) => dp({ type: "ERR", error: e.message }));
  }, [paymentId, st.key]);

  async function handleAction() {
    if (!actionTarget) return;
    setActing(true);
    try {
      if (actionTarget === "paid") await markPaymentPaid(paymentId);
      else await refundPayment(paymentId);
      setActionTarget(null);
      dp({ type: "RE" });
    } catch (e) { dp({ type: "ERR", error: (e as Error).message }); setActionTarget(null); }
    finally { setActing(false); }
  }

  const { data, loading, error } = st;
  if (loading) return <LoadingState message="Loading payment..." />;
  if (error) return <ErrorState message={error} onRetry={() => dp({ type: "RE" })} />;
  if (!data) return <ErrorState message="Payment not found." />;

  const { payment: pay, salon, subscription: sub } = data;
  const colors = BADGE_COLORS[pay.status] ?? BADGE_COLORS.pending;

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/superadmin/dashboard/payments" className="hover:text-slate-700">Payments</Link>
          <span>/</span><span className="text-slate-900">{pay.paymentId}</span>
        </div>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Payment Detail</h1>
          <div className="flex flex-wrap gap-2">
            {pay.status === "pending" ? (
              <button type="button" onClick={() => setActionTarget("paid")}
                className="rounded-xl border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50">Mark Paid</button>
            ) : null}
            {pay.status === "paid" ? (
              <button type="button" onClick={() => setActionTarget("refund")}
                className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50">Refund</button>
            ) : null}
            <Link href={`/superadmin/dashboard/payments/${paymentId}/edit`}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">Edit</Link>
            <Link href="/superadmin/dashboard/payments"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">Back</Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Payment</h2>
          <dl className="mt-4 space-y-3">
            <Info label="Payment ID">
              <span className="flex items-center gap-2">
                <span className="font-mono text-xs">{pay.paymentId}</span>
                <CopyButton text={pay.paymentId} />
              </span>
            </Info>
            <Info label="Status">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${colors}`}>{pay.status}</span>
            </Info>
            <Info label="Amount">{fmtPrice(pay.amount)}</Info>
            <Info label="Method"><span className="capitalize">{pay.method.replace(/_/g, " ")}</span></Info>
            <Info label="Transaction ID">{pay.transactionId || "—"}</Info>
            <Info label="Reference">{pay.referenceNote || "—"}</Info>
            <Info label="Paid At">{fmtDate(pay.paidAt)}</Info>
            <Info label="Created">{fmtDate(pay.createdAt)}</Info>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Salon</h2>
          {salon ? (
            <dl className="mt-4 space-y-3">
              <Info label="Salon ID">
                <Link href={`/superadmin/dashboard/salons/${(salon as Record<string, unknown>).salonId}`} className="font-mono text-xs text-indigo-600 hover:underline">
                  {(salon as Record<string, unknown>).salonId as string}
                </Link>
              </Info>
              <Info label="Name">{(salon as Record<string, unknown>).name as string}</Info>
              <Info label="Owner">{(salon as Record<string, unknown>).ownerName as string}</Info>
              <Info label="Phone">{(salon as Record<string, unknown>).ownerPhone as string}</Info>
            </dl>
          ) : <p className="mt-4 text-sm text-slate-500">Salon not found.</p>}
        </section>

        {sub ? (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-base font-semibold text-slate-900">Linked Subscription</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <Info label="Sub ID">
                <Link href={`/superadmin/dashboard/subscriptions/${(sub as Record<string, unknown>).subscriptionId}`} className="font-mono text-xs text-indigo-600 hover:underline">
                  {(sub as Record<string, unknown>).subscriptionId as string}
                </Link>
              </Info>
              <Info label="Plan">{(sub as Record<string, unknown>).planCode as string}</Info>
              <Info label="Cycle"><span className="capitalize">{(sub as Record<string, unknown>).billingCycle as string}</span></Info>
              <Info label="Sub Amount">{fmtPrice((sub as Record<string, unknown>).amount as number)}</Info>
            </dl>
          </section>
        ) : null}
      </div>

      <ConfirmDialog
        open={!!actionTarget}
        title={actionTarget === "paid" ? "Mark as paid?" : "Refund this payment?"}
        description={actionTarget === "paid" ? "This will mark the payment as paid." : "This will mark the payment as refunded."}
        confirmLabel={actionTarget === "paid" ? "Mark Paid" : "Refund"}
        variant={actionTarget === "refund" ? "danger" : "default"}
        loading={acting}
        onConfirm={handleAction}
        onCancel={() => setActionTarget(null)}
      />
    </div>
  );
}
