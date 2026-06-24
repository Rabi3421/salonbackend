"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { useParams } from "next/navigation";

import { getEnquiry, updateEnquiry } from "@/src/lib/superadmin-api";
import { ENQUIRY_TYPES, ENQUIRY_PRIORITIES } from "@/src/constants/enquiry";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";

type LS = { loading: boolean; loadError: string };
type LA = { type: "LOADED" } | { type: "LOAD_ERROR"; error: string };
function lr(_s: LS, a: LA): LS {
  if (a.type === "LOADED") return { loading: false, loadError: "" };
  return { loading: false, loadError: a.error };
}

export default function EditEnquiryPage() {
  const params = useParams<{ enquiryId: string }>();
  const enquiryId = params.enquiryId;

  const [ls, ld] = useReducer(lr, { loading: true, loadError: "" });
  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getEnquiry(enquiryId)
      .then((r) => {
        const e = r.data?.enquiry;
        if (e) {
          setType(e.type);
          setName(e.name);
          setPhone(e.phone);
          setEmail(e.email);
          setMessage(e.message);
          setPriority(e.priority);
          setSource(e.source);
          setNotes(e.notes);
          setAssignedTo(e.assignedTo);
          ld({ type: "LOADED" });
        }
      })
      .catch((e: Error) => ld({ type: "LOAD_ERROR", error: e.message }));
  }, [enquiryId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await updateEnquiry(enquiryId, { type, name, phone, email, message, priority, source, notes, assignedTo });
      setSuccess("Enquiry updated successfully.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const { loading, loadError } = ls;
  if (loading) return <LoadingState message="Loading enquiry..." />;
  if (loadError) return <ErrorState message={loadError} />;

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/superadmin/dashboard/enquiries" className="hover:text-slate-700">Enquiries</Link>
          <span>/</span>
          <Link href={`/superadmin/dashboard/enquiries/${enquiryId}`} className="hover:text-slate-700">{enquiryId}</Link>
          <span>/</span><span className="text-slate-900">Edit</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Edit Enquiry</h1>
      </section>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                {ENQUIRY_TYPES.map((t) => (<option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                {ENQUIRY_PRIORITIES.map((p) => (<option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Assigned To</label>
              <input type="text" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Source</label>
              <input type="text" value={source} onChange={(e) => setSource(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Notes</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
        </div>

        {error ? (<div className="mx-6 mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>) : null}
        {success ? (<div className="mx-6 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>) : null}

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <Link href={`/superadmin/dashboard/enquiries/${enquiryId}`} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">Cancel</Link>
          <button type="submit" disabled={submitting} className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
