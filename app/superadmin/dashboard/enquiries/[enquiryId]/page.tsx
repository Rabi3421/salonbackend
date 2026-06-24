"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { useParams } from "next/navigation";

import {
  getEnquiry,
  updateEnquiryStatus,
  addEnquiryNote,
  closeEnquiry,
  type EnquiryDetailData,
} from "@/src/lib/superadmin-api";
import { CopyButton } from "@/src/components/superadmin/CopyButton";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";
import { ConfirmDialog } from "@/src/components/superadmin/ConfirmDialog";

type FS = { data: EnquiryDetailData | null; loading: boolean; error: string; key: number };
type FA = { type: "OK"; data: EnquiryDetailData } | { type: "ERR"; error: string } | { type: "RE" };
function fr(s: FS, a: FA): FS {
  if (a.type === "OK") return { ...s, data: a.data, error: "", loading: false };
  if (a.type === "ERR") return { ...s, error: a.error, loading: false };
  return { ...s, loading: true, error: "", key: s.key + 1 };
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-indigo-50 text-indigo-700 border-indigo-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-500 border-slate-200",
  spam: "bg-red-50 text-red-700 border-red-200",
};
const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-indigo-50 text-indigo-700 border-indigo-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  urgent: "bg-red-50 text-red-700 border-red-200",
};

function Badge({ value, map }: { value: string; map: Record<string, string> }) {
  const c = map[value] ?? "bg-slate-100 text-slate-500 border-slate-200";
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${c}`}>{value.replace(/_/g, " ")}</span>;
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <dt className="w-36 shrink-0 text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export default function EnquiryDetailPage() {
  const params = useParams<{ enquiryId: string }>();
  const enquiryId = params.enquiryId;

  const [st, dp] = useReducer(fr, { data: null, loading: true, error: "", key: 0 });
  const [actionTarget, setActionTarget] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    getEnquiry(enquiryId)
      .then((r) => dp({ type: "OK", data: r.data! }))
      .catch((e: Error) => dp({ type: "ERR", error: e.message }));
  }, [enquiryId, st.key]);

  async function handleStatusAction() {
    if (!actionTarget) return;
    setActing(true);
    try {
      if (actionTarget === "spam") await closeEnquiry(enquiryId, { status: "spam" });
      else if (actionTarget === "close") await closeEnquiry(enquiryId);
      else await updateEnquiryStatus(enquiryId, { status: actionTarget });
      setActionTarget(null);
      dp({ type: "RE" });
    } catch (e) { dp({ type: "ERR", error: (e as Error).message }); setActionTarget(null); }
    finally { setActing(false); }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      await addEnquiryNote(enquiryId, { note: noteText.trim() });
      setNoteText("");
      dp({ type: "RE" });
    } catch (err) { dp({ type: "ERR", error: (err as Error).message }); }
    finally { setAddingNote(false); }
  }

  const { data, loading, error } = st;
  if (loading) return <LoadingState message="Loading enquiry..." />;
  if (error) return <ErrorState message={error} onRetry={() => dp({ type: "RE" })} />;
  if (!data) return <ErrorState message="Enquiry not found." />;

  const { enquiry: enq, salon } = data;
  const isOpen = enq.status !== "closed" && enq.status !== "spam";

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/superadmin/dashboard/enquiries" className="hover:text-slate-700">Enquiries</Link>
          <span>/</span><span className="text-slate-900">{enq.enquiryId}</span>
        </div>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Enquiry Detail</h1>
          <div className="flex flex-wrap gap-2">
            <Link href={`/superadmin/dashboard/enquiries/${enquiryId}/edit`}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">Edit</Link>
            {isOpen && enq.status === "new" ? (
              <button type="button" onClick={() => setActionTarget("in_progress")}
                className="rounded-xl border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50">In Progress</button>
            ) : null}
            {isOpen && enq.status !== "resolved" ? (
              <button type="button" onClick={() => setActionTarget("resolved")}
                className="rounded-xl border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50">Resolve</button>
            ) : null}
            {isOpen ? (
              <>
                <button type="button" onClick={() => setActionTarget("close")}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">Close</button>
                <button type="button" onClick={() => setActionTarget("spam")}
                  className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50">Spam</button>
              </>
            ) : null}
            <Link href="/superadmin/dashboard/enquiries"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">Back</Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Enquiry Info</h2>
          <dl className="mt-4 space-y-3">
            <Info label="ID"><span className="flex items-center gap-2"><span className="font-mono text-xs">{enq.enquiryId}</span><CopyButton text={enq.enquiryId} /></span></Info>
            <Info label="Type"><span className="capitalize">{enq.type.replace(/_/g, " ")}</span></Info>
            <Info label="Status"><Badge value={enq.status} map={STATUS_COLORS} /></Info>
            <Info label="Priority"><Badge value={enq.priority} map={PRIORITY_COLORS} /></Info>
            <Info label="Source">{enq.source || "—"}</Info>
            <Info label="Assigned To">{enq.assignedTo || "—"}</Info>
            <Info label="Created">{fmtDate(enq.createdAt)}</Info>
            {enq.resolvedAt ? <Info label="Resolved">{fmtDate(enq.resolvedAt)}</Info> : null}
            {enq.closedAt ? <Info label="Closed">{fmtDate(enq.closedAt)}</Info> : null}
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Contact</h2>
          <dl className="mt-4 space-y-3">
            <Info label="Name">{enq.name}</Info>
            <Info label="Phone">{enq.phone || "—"}</Info>
            <Info label="Email">{enq.email || "—"}</Info>
          </dl>
          {salon ? (
            <>
              <h3 className="mt-6 text-sm font-semibold text-slate-900">Linked Salon</h3>
              <dl className="mt-3 space-y-2">
                <Info label="Salon">
                  <Link href={`/superadmin/dashboard/salons/${(salon as Record<string, unknown>).salonId}`} className="text-indigo-600 hover:underline">
                    {(salon as Record<string, unknown>).name as string}
                  </Link>
                </Info>
                <Info label="City">{(salon as Record<string, unknown>).city as string || "—"}</Info>
              </dl>
            </>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900">Message</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{enq.message || "—"}</p>
          {enq.notes ? (
            <>
              <h3 className="mt-5 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-900">Notes</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{enq.notes}</p>
            </>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900">Internal Notes</h2>
          {enq.internalNotes && enq.internalNotes.length > 0 ? (
            <div className="mt-4 space-y-3">
              {enq.internalNotes.map((n, i) => (
                <div key={i} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm text-slate-700">{n.note}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    by {n.addedByEmail || "system"} &middot; {fmtDate(n.addedAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No internal notes yet.</p>
          )}

          <form onSubmit={handleAddNote} className="mt-4 flex gap-3">
            <input type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            <button type="submit" disabled={addingNote || !noteText.trim()}
              className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60">
              {addingNote ? "Adding..." : "Add Note"}
            </button>
          </form>
        </section>
      </div>

      <ConfirmDialog
        open={!!actionTarget}
        title={actionTarget === "spam" ? "Mark as spam?" : actionTarget === "close" ? "Close enquiry?" : "Update status?"}
        description={`Status will be changed to "${actionTarget?.replace(/_/g, " ")}".`}
        confirmLabel={actionTarget === "spam" ? "Mark Spam" : "Confirm"}
        variant={actionTarget === "spam" ? "danger" : "default"}
        loading={acting}
        onConfirm={handleStatusAction}
        onCancel={() => setActionTarget(null)}
      />
    </div>
  );
}
