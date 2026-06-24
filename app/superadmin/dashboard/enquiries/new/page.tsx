"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getSalons, createEnquiry, type SalonRecord } from "@/src/lib/superadmin-api";
import { ENQUIRY_TYPES, ENQUIRY_PRIORITIES } from "@/src/constants/enquiry";

export default function AddEnquiryPage() {
  const router = useRouter();
  const [salons, setSalons] = useState<SalonRecord[]>([]);

  const [salonId, setSalonId] = useState("");
  const [type, setType] = useState("contact");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

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
      const res = await createEnquiry({
        salonId: salonId || undefined,
        type,
        name,
        phone: phone || undefined,
        email: email || undefined,
        message,
        priority,
        source: source || undefined,
        notes: notes || undefined,
      });
      router.push(`/superadmin/dashboard/enquiries/${res.data!.enquiry.enquiryId}`);
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
          <Link href="/superadmin/dashboard/enquiries" className="hover:text-slate-700">Enquiries</Link>
          <span>/</span><span className="text-slate-900">Add</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Add Enquiry</h1>
      </section>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Type *</label>
              <select value={type} onChange={(e) => setType(e.target.value)} required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                {ENQUIRY_TYPES.map((t) => (<option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Salon (optional)</label>
              <select value={salonId} onChange={(e) => setSalonId(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                <option value="">No salon (platform lead)</option>
                {salons.map((s) => (<option key={s.salonId} value={s.salonId}>{s.name} ({s.salonId})</option>))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit Indian mobile"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Message *</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                {ENQUIRY_PRIORITIES.map((p) => (<option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Source</label>
              <input type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. website, referral, phone"
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
          <Link href="/superadmin/dashboard/enquiries" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">Cancel</Link>
          <button type="submit" disabled={submitting} className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Creating..." : "Add Enquiry"}
          </button>
        </div>
      </form>
    </div>
  );
}
