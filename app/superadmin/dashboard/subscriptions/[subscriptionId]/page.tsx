"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { useParams } from "next/navigation";

import { getSubscription, cancelSubscription, getSubscriptionPayments, type SubscriptionDetailData, type PaymentRecord } from "@/src/lib/superadmin-api";
import { StatusBadge } from "@/src/components/superadmin/StatusBadge";
import { CopyButton } from "@/src/components/superadmin/CopyButton";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";
import { ConfirmDialog } from "@/src/components/superadmin/ConfirmDialog";

type FS = { data: SubscriptionDetailData | null; loading: boolean; error: string; key: number };
type FA = { type: "OK"; data: SubscriptionDetailData } | { type: "ERR"; error: string } | { type: "RE" };
function fr(s: FS, a: FA): FS {
  if (a.type === "OK") return { ...s, data: a.data, error: "", loading: false };
  if (a.type === "ERR") return { ...s, error: a.error, loading: false };
  return { ...s, loading: true, error: "", key: s.key + 1 };
}

function fmtDate(d: string | undefined | null) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <dt className="w-44 shrink-0 text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export default function SubscriptionDetailPage() {
  const params = useParams<{ subscriptionId: string }>();
  const subId = params.subscriptionId;

  const [st, dp] = useReducer(fr, { data: null, loading: true, error: "", key: 0 });
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    getSubscription(subId)
      .then((r) => dp({ type: "OK", data: r.data! }))
      .catch((e: Error) => dp({ type: "ERR", error: e.message }));
    getSubscriptionPayments(subId)
      .then((r) => { setPayments(r.data?.payments ?? []); setTotalPaid(r.data?.totalPaid ?? 0); })
      .catch(() => {});
  }, [subId, st.key]);

  async function handleCancel() {
    setCancelling(true);
    try { await cancelSubscription(subId); setShowCancel(false); dp({ type: "RE" }); }
    catch (e) { dp({ type: "ERR", error: (e as Error).message }); setShowCancel(false); }
    finally { setCancelling(false); }
  }

  const { data, loading, error } = st;
  if (loading) return <LoadingState message="Loading subscription..." />;
  if (error) return <ErrorState message={error} onRetry={() => dp({ type: "RE" })} />;
  if (!data) return <ErrorState message="Subscription not found." />;

  const { subscription: sub, salon, plan } = data;

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/superadmin/dashboard/subscriptions" className="hover:text-slate-700">Subscriptions</Link>
          <span>/</span><span className="text-slate-900">{sub.subscriptionId}</span>
        </div>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Subscription Detail</h1>
          <div className="flex flex-wrap gap-2">
            <Link href={`/superadmin/dashboard/subscriptions/${subId}/renew`}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">Renew</Link>
            <Link href={`/superadmin/dashboard/subscriptions/${subId}/change-plan`}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">Change Plan</Link>
            {sub.status !== "cancelled" ? (
              <button type="button" onClick={() => setShowCancel(true)}
                className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50">Cancel</button>
            ) : null}
            <Link href="/superadmin/dashboard/subscriptions"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">Back</Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Subscription</h2>
          <dl className="mt-4 space-y-3">
            <Info label="Subscription ID">
              <span className="flex items-center gap-2">
                <span className="font-mono text-xs">{sub.subscriptionId}</span>
                <CopyButton text={sub.subscriptionId} />
              </span>
            </Info>
            <Info label="Status"><StatusBadge value={sub.status} type="account" /></Info>
            <Info label="Billing Cycle"><span className="capitalize">{sub.billingCycle}</span></Info>
            <Info label="Amount">{fmtPrice(sub.amount)}</Info>
            <Info label="Start Date">{fmtDate(sub.startDate)}</Info>
            <Info label="End Date">{fmtDate(sub.endDate)}</Info>
            <Info label="Next Billing">{fmtDate(sub.nextBillingDate)}</Info>
            <Info label="Notes">{sub.notes || "N/A"}</Info>
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
              <Info label="Email">{(salon as Record<string, unknown>).ownerEmail as string}</Info>
              <Info label="Phone">{(salon as Record<string, unknown>).ownerPhone as string}</Info>
            </dl>
          ) : <p className="mt-4 text-sm text-slate-500">Salon not found.</p>}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900">Plan</h2>
          {plan ? (
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <Info label="Plan Code">
                <Link href={`/superadmin/dashboard/plans/${(plan as Record<string, unknown>).planCode}`} className="font-mono text-xs text-indigo-600 hover:underline">
                  {(plan as Record<string, unknown>).planCode as string}
                </Link>
              </Info>
              <Info label="Name">{(plan as Record<string, unknown>).name as string}</Info>
              <Info label="Monthly">{fmtPrice((plan as Record<string, unknown>).monthlyPrice as number)}</Info>
              <Info label="Yearly">{fmtPrice((plan as Record<string, unknown>).yearlyPrice as number)}</Info>
              <Info label="Trial Days">{(plan as Record<string, unknown>).trialDays as number} days</Info>
            </dl>
          ) : <p className="mt-4 text-sm text-slate-500">Plan not found.</p>}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Payments</h2>
            <p className="mt-0.5 text-xs text-slate-500">Total paid: {fmtPrice(totalPaid)}</p>
          </div>
          <Link href={`/superadmin/dashboard/payments/new`}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
            Add Payment
          </Link>
        </div>
        {payments.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">No payments linked to this subscription.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="whitespace-nowrap px-4 py-2 text-xs font-medium text-slate-600">ID</th>
                  <th className="whitespace-nowrap px-4 py-2 text-xs font-medium text-slate-600">Amount</th>
                  <th className="whitespace-nowrap px-4 py-2 text-xs font-medium text-slate-600">Method</th>
                  <th className="whitespace-nowrap px-4 py-2 text-xs font-medium text-slate-600">Status</th>
                  <th className="whitespace-nowrap px-4 py-2 text-xs font-medium text-slate-600">Paid At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-2">
                      <Link href={`/superadmin/dashboard/payments/${p.paymentId}`} className="font-mono text-xs text-indigo-600 hover:underline">{p.paymentId}</Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-900">{fmtPrice(p.amount)}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600 capitalize">{p.method.replace(/_/g, " ")}</td>
                    <td className="whitespace-nowrap px-4 py-2"><StatusBadge value={p.status} type="account" /></td>
                    <td className="whitespace-nowrap px-4 py-2 text-xs text-slate-500">{p.paidAt ? fmtDate(p.paidAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog open={showCancel} title="Cancel this subscription?"
        description="This will cancel the subscription and may deactivate the salon."
        confirmLabel="Cancel Subscription" variant="danger" loading={cancelling}
        onConfirm={handleCancel} onCancel={() => setShowCancel(false)} />
    </div>
  );
}
