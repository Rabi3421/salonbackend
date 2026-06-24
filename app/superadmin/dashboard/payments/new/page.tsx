"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getSalons,
  createPayment,
  type SalonRecord,
} from "@/src/lib/superadmin-api";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/src/constants/salon";

export default function AddPaymentPage() {
  const router = useRouter();
  const [salons, setSalons] = useState<SalonRecord[]>([]);

  const [salonId, setSalonId] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState("upi");
  const [status, setStatus] = useState("pending");
  const [transactionId, setTransactionId] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [paidAt, setPaidAt] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSalons({ limit: 100 }).then((r) => setSalons(r.data?.salons ?? [])).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await createPayment({
        salonId,
        subscriptionId: subscriptionId || undefined,
        amount: Number(amount),
        method,
        status,
        transactionId: transactionId || undefined,
        referenceNote: referenceNote || undefined,
        paidAt: paidAt || undefined,
      });
      router.push(`/superadmin/dashboard/payments/${res.data!.payment.paymentId}`);
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
          <Link href="/superadmin/dashboard/payments" className="hover:text-slate-700">Payments</Link>
          <span>/</span><span className="text-slate-900">Add</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Add Payment</h1>
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
              <label className="text-sm font-medium text-slate-700">Subscription ID</label>
              <input type="text" value={subscriptionId} onChange={(e) => setSubscriptionId(e.target.value)}
                placeholder="Optional — e.g. SUB-2026-0001"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Amount *</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))} min={1} required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Method *</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                {PAYMENT_METHODS.map((m) => (<option key={m} value={m}>{m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                {PAYMENT_STATUSES.map((s) => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Transaction ID</label>
              <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Paid At</label>
              <input type="datetime-local" value={paidAt} onChange={(e) => setPaidAt(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Reference Note</label>
            <textarea value={referenceNote} onChange={(e) => setReferenceNote(e.target.value)} rows={2}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
        </div>

        {error ? (<div className="mx-6 mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>) : null}

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <Link href="/superadmin/dashboard/payments" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">Cancel</Link>
          <button type="submit" disabled={submitting} className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Creating..." : "Add Payment"}
          </button>
        </div>
      </form>
    </div>
  );
}
