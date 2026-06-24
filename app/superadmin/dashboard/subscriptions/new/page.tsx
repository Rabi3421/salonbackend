"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getSalons,
  getPlans,
  createSubscription,
  type SalonRecord,
  type PlanRecord,
} from "@/src/lib/superadmin-api";
import { BILLING_CYCLES } from "@/src/constants/salon";

export default function AssignSubscriptionPage() {
  const router = useRouter();
  const [salons, setSalons] = useState<SalonRecord[]>([]);
  const [plans, setPlans] = useState<PlanRecord[]>([]);

  const [salonId, setSalonId] = useState("");
  const [planCode, setPlanCode] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [amount, setAmount] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSalons({ limit: 100 }).then((r) => setSalons(r.data?.salons ?? [])).catch(() => {});
    getPlans({ status: "active", limit: 100 }).then((r) => setPlans(r.data?.plans ?? [])).catch(() => {});
  }, []);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await createSubscription({
        salonId,
        planCode,
        billingCycle,
        amount: amount === "" ? undefined : amount,
        startDate: startDate || undefined,
        notes: notes || undefined,
      });
      router.push(`/superadmin/dashboard/subscriptions/${res.data!.subscription.subscriptionId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/superadmin/dashboard/subscriptions" className="hover:text-slate-700">Subscriptions</Link>
          <span>/</span><span className="text-slate-900">Assign</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Assign Subscription</h1>
      </section>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Salon *</label>
              <select value={salonId} onChange={(e) => setSalonId(e.target.value)} required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                <option value="">Select salon...</option>
                {salons.map((s) => (<option key={s.salonId} value={s.salonId}>{s.name} ({s.salonId})</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Plan *</label>
              <select value={planCode} onChange={(e) => handlePlanChange(e.target.value)} required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                <option value="">Select plan...</option>
                {plans.map((p) => (<option key={p.planCode} value={p.planCode}>{p.name} ({p.planCode})</option>))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Billing Cycle *</label>
              <select value={billingCycle} onChange={(e) => handleCycleChange(e.target.value)} required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                {BILLING_CYCLES.map((c) => (<option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>))}
              </select>
            </div>
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
          <Link href="/superadmin/dashboard/subscriptions" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">Cancel</Link>
          <button type="submit" disabled={submitting} className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Assigning..." : "Assign Subscription"}
          </button>
        </div>
      </form>
    </div>
  );
}
