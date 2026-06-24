"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  getSubscription,
  getPlans,
  changeSubscriptionPlan,
  type SubscriptionDetailData,
  type PlanRecord,
} from "@/src/lib/superadmin-api";
import { BILLING_CYCLES } from "@/src/constants/salon";
import { StatusBadge } from "@/src/components/superadmin/StatusBadge";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";

type LS = { data: SubscriptionDetailData | null; loading: boolean; error: string };
type LA = { type: "OK"; data: SubscriptionDetailData } | { type: "ERR"; error: string };
function lr(_s: LS, a: LA): LS {
  if (a.type === "OK") return { data: a.data, loading: false, error: "" };
  return { data: null, loading: false, error: a.error };
}

function fmtPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function ChangePlanPage() {
  const params = useParams<{ subscriptionId: string }>();
  const subId = params.subscriptionId;
  const router = useRouter();

  const [ls, ld] = useReducer(lr, { data: null, loading: true, error: "" });
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [planCode, setPlanCode] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [amount, setAmount] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSubscription(subId)
      .then((r) => ld({ type: "OK", data: r.data! }))
      .catch((e: Error) => ld({ type: "ERR", error: e.message }));
    getPlans({ status: "active", limit: 100 })
      .then((r) => setPlans(r.data?.plans ?? []))
      .catch(() => {});
  }, [subId]);

  function autoFillAmount(code: string, cycle: string) {
    const p = plans.find((pl) => pl.planCode === code);
    if (!p) return;
    if (cycle === "monthly") setAmount(p.monthlyPrice);
    else if (cycle === "yearly") setAmount(p.yearlyPrice);
    else setAmount(0);
  }

  function handlePlanChange(code: string) {
    setPlanCode(code);
    autoFillAmount(code, billingCycle);
  }

  function handleCycleChange(cycle: string) {
    setBillingCycle(cycle);
    autoFillAmount(planCode, cycle);
  }

  const { data, loading, error: loadError } = ls;
  if (loading) return <LoadingState message="Loading..." />;
  if (loadError) return <ErrorState message={loadError} />;
  if (!data) return <ErrorState message="Subscription not found." />;

  const sub = data.subscription;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      const res = await changeSubscriptionPlan(subId, {
        planCode,
        billingCycle,
        amount: amount === "" ? undefined : amount,
        startDate: startDate || undefined,
        notes: notes || undefined,
      });
      router.push(`/superadmin/dashboard/subscriptions/${res.data!.subscription.subscriptionId}`);
    } catch (err) { setError((err as Error).message); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/superadmin/dashboard/subscriptions" className="hover:text-slate-700">Subscriptions</Link>
          <span>/</span>
          <Link href={`/superadmin/dashboard/subscriptions/${subId}`} className="hover:text-slate-700">{subId}</Link>
          <span>/</span><span className="text-slate-900">Change Plan</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Change Plan</h1>
      </section>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-6 text-sm">
          <div><span className="font-medium text-slate-500">Salon:</span> <span className="text-slate-900">{data.salon ? (data.salon as Record<string, unknown>).name as string : sub.salonId}</span></div>
          <div><span className="font-medium text-slate-500">Current Plan:</span> <span className="font-mono text-slate-900">{sub.planCode}</span></div>
          <div><span className="font-medium text-slate-500">Status:</span> <StatusBadge value={sub.status} type="account" /></div>
          <div><span className="font-medium text-slate-500">Amount:</span> <span className="text-slate-900">{fmtPrice(sub.amount)}</span></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">New Plan *</label>
              <select value={planCode} onChange={(e) => handlePlanChange(e.target.value)} required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                <option value="">Select plan...</option>
                {plans.map((p) => (<option key={p.planCode} value={p.planCode}>{p.name} ({p.planCode})</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Billing Cycle *</label>
              <select value={billingCycle} onChange={(e) => handleCycleChange(e.target.value)} required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                {BILLING_CYCLES.filter((c) => c !== "trial").map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Amount</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))} min={0}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
        </div>
        {error ? (<div className="mx-6 mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>) : null}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <Link href={`/superadmin/dashboard/subscriptions/${subId}`} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">Cancel</Link>
          <button type="submit" disabled={submitting} className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Changing..." : "Change Plan"}
          </button>
        </div>
      </form>
    </div>
  );
}
