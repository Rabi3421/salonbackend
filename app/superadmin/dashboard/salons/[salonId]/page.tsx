"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { useParams } from "next/navigation";

import {
  getSalon,
  cancelSalon,
  getSimpleSubscription,
  updateSimpleSubscription,
  blockSalonSimple,
  reactivateSalonSimple,
  markSalonUnpaid,
  cancelSalonSimple,
  recordSimplePayment,
  getSimplePayments,
  type SalonDetailData,
} from "@/src/lib/superadmin-api";
import {
  formatAccessStatus,
  formatCurrencyINR,
  formatNullableDate,
  formatPlanCode,
  formatPaymentMode,
  formatPaymentStatus,
} from "@/src/lib/formatters";
import type {
  SubscriptionAccessStatus,
  SalonSubscriptionPolicySummary,
  SimplePaymentRecord,
} from "@/src/types/superadmin-frontend";
import { CopyButton } from "@/src/components/superadmin/CopyButton";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";
import { ConfirmDialog } from "@/src/components/superadmin/ConfirmDialog";

const PLAN_PRICING = {
  basic: { standardPrice: 2000, minimumPrice: 1000 },
  premium: { standardPrice: 3000, minimumPrice: 2000 },
} as const;

const SIMPLE_STATUSES: SubscriptionAccessStatus[] = ["trial", "active", "unpaid", "blocked", "cancelled"];

const PAYMENT_MODES = [
  { value: "upi", label: "UPI" },
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
] as const;

type FetchState = {
  data: SalonDetailData | null;
  subscription: SalonSubscriptionPolicySummary | null;
  loading: boolean;
  error: string;
  fetchKey: number;
};

type FetchAction =
  | { type: "FETCH_SUCCESS"; data: SalonDetailData; subscription: SalonSubscriptionPolicySummary | null }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "UPDATE_SUBSCRIPTION"; subscription: SalonSubscriptionPolicySummary }
  | { type: "REFETCH" };

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case "FETCH_SUCCESS":
      return { ...state, data: action.data, subscription: action.subscription, error: "", loading: false };
    case "UPDATE_SUBSCRIPTION":
      return { ...state, subscription: action.subscription };
    case "FETCH_ERROR":
      return { ...state, error: action.error, loading: false };
    case "REFETCH":
      return { ...state, loading: true, error: "", fetchKey: state.fetchKey + 1 };
  }
}

function toDateInputValue(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; border: string; label: string }> = {
  trial: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200", label: "Trial" },
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200", label: "Active" },
  unpaid: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200", label: "Unpaid" },
  blocked: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200", label: "Blocked" },
  cancelled: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-300", label: "Cancelled" },
};

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.cancelled;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${c.bg} ${c.text} ${c.border}`}>
      <span className={`size-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function MetricTile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900">{children}</span>
    </div>
  );
}

function ActionBtn({
  onClick,
  variant = "default",
  disabled,
  children,
}: {
  onClick: () => void;
  variant?: "default" | "primary" | "danger" | "warning" | "success";
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const styles = {
    default: "border-slate-200 text-slate-700 hover:bg-slate-50",
    primary: "border-indigo-200 text-indigo-600 hover:bg-indigo-50",
    danger: "border-red-200 text-red-600 hover:bg-red-50",
    warning: "border-amber-200 text-amber-700 hover:bg-amber-50",
    success: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

type EditFormState = {
  planCode: "basic" | "premium";
  monthlyPrice: string;
  subscriptionStatus: SubscriptionAccessStatus;
  nextDueDate: string;
  graceEndDate: string;
  negotiationNote: string;
};

type PaymentFormState = {
  amount: string;
  paymentMode: string;
  transactionId: string;
  paymentDate: string;
  notes: string;
};

export default function SalonDetailPage() {
  const params = useParams<{ salonId: string }>();
  const salonId = params.salonId;

  const [state, dispatch] = useReducer(fetchReducer, {
    data: null,
    subscription: null,
    loading: true,
    error: "",
    fetchKey: 0,
  });

  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    planCode: "basic",
    monthlyPrice: "2000",
    subscriptionStatus: "trial",
    nextDueDate: "",
    graceEndDate: "",
    negotiationNote: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    amount: "",
    paymentMode: "upi",
    transactionId: "",
    paymentDate: todayInputValue(),
    notes: "",
  });
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [payments, setPayments] = useState<SimplePaymentRecord[]>([]);

  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockError, setBlockError] = useState("");

  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [reactivateReason, setReactivateReason] = useState("");
  const [reactivateSaving, setReactivateSaving] = useState(false);
  const [reactivateError, setReactivateError] = useState("");

  const [unpaidOpen, setUnpaidOpen] = useState(false);
  const [unpaidReason, setUnpaidReason] = useState("");
  const [unpaidSaving, setUnpaidSaving] = useState(false);
  const [unpaidError, setUnpaidError] = useState("");

  const [cancelSubOpen, setCancelSubOpen] = useState(false);
  const [cancelSubReason, setCancelSubReason] = useState("");
  const [cancelSubSaving, setCancelSubSaving] = useState(false);
  const [cancelSubError, setCancelSubError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [salonRes, subRes] = await Promise.all([
          getSalon(salonId),
          getSimpleSubscription(salonId).catch(() => ({ data: null })),
        ]);
        if (!cancelled) {
          dispatch({ type: "FETCH_SUCCESS", data: salonRes.data!, subscription: subRes.data ?? null });
        }
      } catch (err) {
        if (!cancelled) dispatch({ type: "FETCH_ERROR", error: (err as Error).message });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [salonId, state.fetchKey]);

  async function handleCancel() {
    setCancelling(true);
    try {
      await cancelSalon(salonId);
      setShowCancel(false);
      dispatch({ type: "REFETCH" });
    } catch (err) {
      dispatch({ type: "FETCH_ERROR", error: (err as Error).message });
      setShowCancel(false);
    } finally {
      setCancelling(false);
    }
  }

  function openEditModal() {
    const sub = state.subscription;
    const pc = sub?.planCode?.toLowerCase() === "premium" ? "premium" : "basic";
    setEditForm({
      planCode: pc,
      monthlyPrice: String(sub?.monthlyPrice ?? PLAN_PRICING[pc].standardPrice),
      subscriptionStatus: (sub?.subscriptionStatus as SubscriptionAccessStatus) ?? "trial",
      nextDueDate: toDateInputValue(sub?.nextDueDate),
      graceEndDate: toDateInputValue(sub?.graceEndDate),
      negotiationNote: sub?.negotiationNote ?? "",
    });
    setEditError("");
    setEditOpen(true);
  }

  async function handleEditSave() {
    setEditError("");
    const monthlyPrice = Number(editForm.monthlyPrice);
    const pricing = PLAN_PRICING[editForm.planCode];
    if (!editForm.planCode || !editForm.subscriptionStatus) { setEditError("Plan and status are required."); return; }
    if (Number.isNaN(monthlyPrice) || monthlyPrice < 0) { setEditError("Monthly price must be a valid positive number."); return; }
    if (monthlyPrice < pricing.minimumPrice) { setEditError(`${formatPlanCode(editForm.planCode)} minimum price is ${formatCurrencyINR(pricing.minimumPrice)}.`); return; }
    if (editForm.nextDueDate && editForm.graceEndDate && new Date(editForm.graceEndDate) < new Date(editForm.nextDueDate)) { setEditError("Grace end date cannot be before the next due date."); return; }
    setEditSaving(true);
    try {
      const res = await updateSimpleSubscription(salonId, {
        planCode: editForm.planCode,
        monthlyPrice,
        subscriptionStatus: editForm.subscriptionStatus,
        negotiationNote: editForm.negotiationNote || undefined,
        nextDueDate: editForm.nextDueDate || undefined,
        graceEndDate: editForm.graceEndDate || undefined,
      });
      if (res.data?.subscription) dispatch({ type: "UPDATE_SUBSCRIPTION", subscription: res.data.subscription });
      setEditOpen(false);
      dispatch({ type: "REFETCH" });
    } catch (err) { setEditError((err as Error).message); }
    finally { setEditSaving(false); }
  }

  function openPaymentModal() {
    setPaymentForm({ amount: String(state.subscription?.monthlyPrice ?? ""), paymentMode: "upi", transactionId: "", paymentDate: todayInputValue(), notes: "" });
    setPaymentError("");
    setPaymentOpen(true);
  }

  async function handlePaymentSave() {
    setPaymentError("");
    const amount = Number(paymentForm.amount);
    if (Number.isNaN(amount) || amount <= 0) { setPaymentError("Amount must be a valid positive number."); return; }
    if (!paymentForm.paymentMode) { setPaymentError("Payment mode is required."); return; }
    setPaymentSaving(true);
    try {
      await recordSimplePayment(salonId, { amount, paymentMode: paymentForm.paymentMode, transactionId: paymentForm.transactionId || undefined, paymentDate: paymentForm.paymentDate || undefined, notes: paymentForm.notes || undefined });
      setPaymentOpen(false);
      dispatch({ type: "REFETCH" });
    } catch (err) { setPaymentError((err as Error).message); }
    finally { setPaymentSaving(false); }
  }

  async function openPaymentHistory() {
    setHistoryError(""); setHistoryOpen(true); setHistoryLoading(true);
    try { const res = await getSimplePayments(salonId); setPayments(res.data?.payments ?? []); }
    catch (err) { setHistoryError((err as Error).message); }
    finally { setHistoryLoading(false); }
  }

  async function handleBlock() {
    const reason = blockReason.trim();
    if (!reason) { setBlockError("Reason is required."); return; }
    setBlockSaving(true); setBlockError("");
    try { await blockSalonSimple(salonId, { reason }); setBlockOpen(false); setBlockReason(""); dispatch({ type: "REFETCH" }); }
    catch (err) { setBlockError((err as Error).message); }
    finally { setBlockSaving(false); }
  }

  async function handleReactivate() {
    const reason = reactivateReason.trim();
    if (!reason) { setReactivateError("Reason is required."); return; }
    setReactivateSaving(true); setReactivateError("");
    try { await reactivateSalonSimple(salonId, { reason }); setReactivateOpen(false); setReactivateReason(""); dispatch({ type: "REFETCH" }); }
    catch (err) { setReactivateError((err as Error).message); }
    finally { setReactivateSaving(false); }
  }

  async function handleMarkUnpaid() {
    const reason = unpaidReason.trim();
    if (!reason) { setUnpaidError("Reason is required."); return; }
    setUnpaidSaving(true); setUnpaidError("");
    try { await markSalonUnpaid(salonId, { reason }); setUnpaidOpen(false); setUnpaidReason(""); dispatch({ type: "REFETCH" }); }
    catch (err) { setUnpaidError((err as Error).message); }
    finally { setUnpaidSaving(false); }
  }

  async function handleCancelSubscription() {
    const reason = cancelSubReason.trim();
    if (!reason) { setCancelSubError("Reason is required."); return; }
    setCancelSubSaving(true); setCancelSubError("");
    try { await cancelSalonSimple(salonId, { reason }); setCancelSubOpen(false); setCancelSubReason(""); dispatch({ type: "REFETCH" }); }
    catch (err) { setCancelSubError((err as Error).message); }
    finally { setCancelSubSaving(false); }
  }

  const { data, subscription, loading, error } = state;
  if (loading) return <LoadingState message="Loading salon details..." />;
  if (error) return <ErrorState message={error} onRetry={() => dispatch({ type: "REFETCH" })} />;
  if (!data) return <ErrorState message="Salon not found." />;

  const { salon, owner } = data;
  const sub = subscription;
  const subStatus = sub?.subscriptionStatus ?? salon.accountStatus ?? "trial";
  const statusConf = STATUS_CONFIG[subStatus] ?? STATUS_CONFIG.cancelled;

  return (
    <div className="space-y-6 pb-8">
      {/* ── HEADER ── */}
      <section>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/superadmin/dashboard/salons" className="transition hover:text-slate-600">Salons</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">{salon.name}</span>
        </div>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex size-12 items-center justify-center rounded-2xl text-lg font-bold ${statusConf.bg} ${statusConf.text}`}>
              {salon.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{salon.name}</h1>
                <StatusPill status={subStatus} />
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                <span className="font-mono">{salon.salonId}</span>
                <CopyButton text={salon.salonId} />
                <span className="capitalize">{salon.businessType.replace(/_/g, " ")}</span>
                <span>{salon.city || ""}{salon.city && salon.state ? ", " : ""}{salon.state || ""}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={`/superadmin/dashboard/salons/${salonId}/edit`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">Edit</Link>
            <Link href={`/superadmin/dashboard/salons/${salonId}/users`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">Users</Link>
            <Link href={`/superadmin/dashboard/salons/${salonId}/website-content`} className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 shadow-sm transition hover:bg-indigo-50">Website</Link>
            <Link href={`/superadmin/dashboard/salons/${salonId}/status`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">Status</Link>
          </div>
        </div>
      </section>

      {/* ── STATUS ALERT ── */}
      {subStatus === "blocked" ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100">
            <svg className="size-4 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-800">Access Blocked</p>
            <p className="text-xs text-red-600">{sub?.blockedReason || "This salon cannot access the dashboard."}</p>
          </div>
          <button type="button" onClick={() => { setReactivateError(""); setReactivateReason(""); setReactivateOpen(true); }} className="ml-auto rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700">Reactivate</button>
        </div>
      ) : null}
      {subStatus === "unpaid" ? (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <svg className="size-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Payment Overdue</p>
            <p className="text-xs text-amber-600">Salon is marked as unpaid. Access is still allowed with a warning.</p>
          </div>
          <button type="button" onClick={openPaymentModal} className="ml-auto rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700">Record Payment</button>
        </div>
      ) : null}
      {subStatus === "cancelled" ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-5 py-3.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
            <svg className="size-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <p className="text-sm font-medium text-slate-600">Subscription has been cancelled.</p>
          <button type="button" onClick={() => { setReactivateError(""); setReactivateReason(""); setReactivateOpen(true); }} className="ml-auto rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700">Reactivate</button>
        </div>
      ) : null}

      {/* ── QUICK METRICS ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile
          label="Plan"
          value={formatPlanCode(sub?.planCode ?? salon.currentPlanCode)}
          sub={sub?.planCode === "premium" ? "All features" : "Basic features"}
        />
        <MetricTile
          label="Monthly Price"
          value={formatCurrencyINR(sub?.monthlyPrice ?? salon.finalMonthlyPrice)}
          sub={sub?.monthlyPrice !== sub?.standardPrice ? `Standard ${formatCurrencyINR(sub?.standardPrice)}` : undefined}
        />
        <MetricTile
          label="Next Due"
          value={formatNullableDate(sub?.nextDueDate)}
          sub={sub?.graceEndDate ? `Grace until ${formatNullableDate(sub.graceEndDate)}` : undefined}
        />
        <MetricTile
          label="Last Payment"
          value={formatNullableDate(sub?.lastPaymentDate) === "N/A" ? "None yet" : formatNullableDate(sub?.lastPaymentDate)}
        />
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* ── LEFT COLUMN: Salon + Owner + Location ── */}
        <div className="space-y-5 xl:col-span-1">
          {/* Salon Info */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3.5">
              <SectionHeader title="Salon Info" />
            </div>
            <div className="divide-y divide-slate-100 px-5">
              <DetailRow label="Account">{formatAccessStatus(salon.accountStatus)}</DetailRow>
              <DetailRow label="Website">{salon.websiteStatus === "active" ? <span className="text-emerald-600">Active</span> : <span className="text-slate-400 capitalize">{salon.websiteStatus}</span>}</DetailRow>
              <DetailRow label="Active">{salon.isActive ? <span className="text-emerald-600">Yes</span> : <span className="text-red-500">No</span>}</DetailRow>
              <DetailRow label="Created">{formatNullableDate(salon.createdAt)}</DetailRow>
            </div>
          </div>

          {/* Owner */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3.5">
              <SectionHeader title="Owner" />
            </div>
            {owner ? (
              <div className="divide-y divide-slate-100 px-5">
                <DetailRow label="Name">{owner.name}</DetailRow>
                <DetailRow label="Email">{owner.email}</DetailRow>
                <DetailRow label="Phone">{owner.phone}</DetailRow>
                <DetailRow label="Role"><span className="capitalize">{owner.role.replace(/_/g, " ")}</span></DetailRow>
                <DetailRow label="Last Login">{owner.lastLoginAt ? formatNullableDate(owner.lastLoginAt) : <span className="text-slate-400">Never</span>}</DetailRow>
              </div>
            ) : (
              <p className="px-5 py-4 text-sm text-slate-400">No owner found.</p>
            )}
          </div>

          {/* Location */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3.5">
              <SectionHeader title="Location" />
            </div>
            <div className="divide-y divide-slate-100 px-5">
              <DetailRow label="Address">{salon.address || <span className="text-slate-400">N/A</span>}</DetailRow>
              <DetailRow label="City">{salon.city || <span className="text-slate-400">N/A</span>}</DetailRow>
              <DetailRow label="State">{salon.state || <span className="text-slate-400">N/A</span>}</DetailRow>
              <DetailRow label="Pincode">{salon.pincode || <span className="text-slate-400">N/A</span>}</DetailRow>
              <DetailRow label="GST">{salon.gstNumber || <span className="text-slate-400">N/A</span>}</DetailRow>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Subscription & Payments ── */}
        <div className="space-y-5 xl:col-span-2">

          {/* Subscription Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <SectionHeader title="Subscription & Billing" />
              <ActionBtn onClick={openEditModal} variant="primary">Edit Plan / Price</ActionBtn>
            </div>

            {sub ? (
              <div className="px-5 py-4">
                {/* Plan + Pricing row */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 text-center">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Plan</p>
                    <p className="mt-1 text-base font-bold text-slate-900">{formatPlanCode(sub.planCode)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 text-center">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Price</p>
                    <p className="mt-1 text-base font-bold text-slate-900">{formatCurrencyINR(sub.monthlyPrice)}<span className="text-xs font-normal text-slate-400">/mo</span></p>
                    {sub.monthlyPrice !== sub.standardPrice ? <p className="mt-0.5 text-[10px] text-slate-400">Standard: {formatCurrencyINR(sub.standardPrice)}</p> : null}
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 text-center">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Status</p>
                    <div className="mt-1.5 flex justify-center"><StatusPill status={subStatus} /></div>
                  </div>
                </div>

                {/* Timeline dates */}
                <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-4">
                  {[
                    { label: "Trial Start", value: formatNullableDate(sub.trialStartDate) },
                    { label: "Trial End", value: formatNullableDate(sub.trialEndDate) },
                    { label: "Next Due", value: formatNullableDate(sub.nextDueDate) },
                    { label: "Grace End", value: formatNullableDate(sub.graceEndDate) },
                  ].map((d) => (
                    <div key={d.label} className="bg-white px-4 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{d.label}</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-800">{d.value}</p>
                    </div>
                  ))}
                </div>

                {/* Extra details */}
                <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-slate-500">Minimum Price</span>
                    <span className="text-xs font-medium text-slate-700">{formatCurrencyINR(sub.minimumPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-slate-500">Last Payment</span>
                    <span className="text-xs font-medium text-slate-700">{formatNullableDate(sub.lastPaymentDate) === "N/A" ? "None" : formatNullableDate(sub.lastPaymentDate)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-slate-500">Active</span>
                    <span className={`text-xs font-medium ${sub.isActive ? "text-emerald-600" : "text-red-500"}`}>{sub.isActive ? "Yes" : "No"}</span>
                  </div>
                  {sub.negotiationNote ? (
                    <div className="px-4 py-2.5">
                      <span className="text-xs text-slate-500">Note</span>
                      <p className="mt-0.5 text-xs text-slate-700">{sub.negotiationNote}</p>
                    </div>
                  ) : null}
                  {sub.blockedAt ? (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs text-slate-500">Blocked At</span>
                      <span className="text-xs font-medium text-red-600">{formatNullableDate(sub.blockedAt)}</span>
                    </div>
                  ) : null}
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <ActionBtn onClick={openPaymentModal} variant="primary">Record Payment</ActionBtn>
                  <ActionBtn onClick={openPaymentHistory}>View Payments</ActionBtn>
                  <ActionBtn onClick={() => { setUnpaidError(""); setUnpaidReason(""); setUnpaidOpen(true); }} variant="warning">Mark Unpaid</ActionBtn>
                  <ActionBtn onClick={() => { setBlockError(""); setBlockReason(""); setBlockOpen(true); }} variant="danger">Block</ActionBtn>
                  <ActionBtn onClick={() => { setReactivateError(""); setReactivateReason(""); setReactivateOpen(true); }} variant="success">Reactivate</ActionBtn>
                  <ActionBtn onClick={() => { setCancelSubError(""); setCancelSubReason(""); setCancelSubOpen(true); }}>Cancel Sub</ActionBtn>
                </div>
              </div>
            ) : (
              <p className="px-5 py-6 text-center text-sm text-slate-400">No subscription found for this salon.</p>
            )}
          </div>

          {/* Enquiries + Danger Zone */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <SectionHeader title="Enquiries" />
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/superadmin/dashboard/enquiries?salonId=${salonId}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">View All</Link>
                <Link href="/superadmin/dashboard/enquiries/new" className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50">New Enquiry</Link>
              </div>
            </div>
            {salon.accountStatus !== "cancelled" ? (
              <div className="rounded-2xl border border-red-100 bg-red-50/30 p-5 shadow-sm">
                <SectionHeader title="Danger Zone" />
                <p className="mt-2 text-xs text-slate-500">Cancel the salon account entirely.</p>
                <button type="button" onClick={() => setShowCancel(true)} className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm transition hover:bg-red-50">Cancel Salon</button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ═══════════════  MODALS  ═══════════════ */}

      <ConfirmDialog
        open={showCancel}
        title="Cancel this salon?"
        description={`This will set ${salon.name} to cancelled status, deactivate the account, and set website to inactive.`}
        confirmLabel="Cancel Salon"
        variant="danger"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setShowCancel(false)}
      />

      {/* Edit Plan/Price */}
      {editOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Edit Plan & Pricing</h2>
              <p className="mt-1 text-sm text-slate-500">Update plan, monthly price, billing dates, and subscription status.</p>
            </div>
            <div className="space-y-4 px-6 py-5">
              {editError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</div> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Plan</span>
                  <select value={editForm.planCode} onChange={(e) => { const pc = e.target.value as "basic" | "premium"; setEditForm((p) => ({ ...p, planCode: pc, monthlyPrice: String(PLAN_PRICING[pc].standardPrice) })); }} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Monthly Price</span>
                  <input type="number" min="0" value={editForm.monthlyPrice} onChange={(e) => setEditForm((p) => ({ ...p, monthlyPrice: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                  <span className="block text-xs font-normal text-slate-400">Std {formatCurrencyINR(PLAN_PRICING[editForm.planCode].standardPrice)} / Min {formatCurrencyINR(PLAN_PRICING[editForm.planCode].minimumPrice)}</span>
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Status</span>
                  <select value={editForm.subscriptionStatus} onChange={(e) => setEditForm((p) => ({ ...p, subscriptionStatus: e.target.value as SubscriptionAccessStatus }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                    {SIMPLE_STATUSES.map((s) => <option key={s} value={s}>{formatAccessStatus(s)}</option>)}
                  </select>
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Next Due Date</span>
                  <input type="date" value={editForm.nextDueDate} onChange={(e) => setEditForm((p) => ({ ...p, nextDueDate: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Grace End Date</span>
                  <input type="date" value={editForm.graceEndDate} onChange={(e) => setEditForm((p) => ({ ...p, graceEndDate: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700 sm:col-span-2">
                  <span>Negotiation Note</span>
                  <textarea rows={3} value={editForm.negotiationNote} onChange={(e) => setEditForm((p) => ({ ...p, negotiationNote: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="Reason for negotiated price or status decision" />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button type="button" onClick={() => setEditOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={handleEditSave} disabled={editSaving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60">{editSaving ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Record Payment */}
      {paymentOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Record Payment</h2>
              <p className="mt-1 text-sm text-slate-500">Record a manual payment for this salon.</p>
            </div>
            <div className="space-y-4 px-6 py-5">
              {paymentError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{paymentError}</div> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Amount</span>
                  <input type="number" min="1" value={paymentForm.amount} onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. 2000" />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Payment Mode</span>
                  <select value={paymentForm.paymentMode} onChange={(e) => setPaymentForm((p) => ({ ...p, paymentMode: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                    {PAYMENT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Transaction ID</span>
                  <input type="text" value={paymentForm.transactionId} onChange={(e) => setPaymentForm((p) => ({ ...p, transactionId: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="Optional" />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Payment Date</span>
                  <input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm((p) => ({ ...p, paymentDate: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700 sm:col-span-2">
                  <span>Notes</span>
                  <textarea rows={2} value={paymentForm.notes} onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="Optional notes" />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button type="button" onClick={() => setPaymentOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={handlePaymentSave} disabled={paymentSaving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60">{paymentSaving ? "Recording..." : "Record Payment"}</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Payment History */}
      {historyOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Payment History</h2>
                <p className="mt-0.5 text-sm text-slate-500">{payments.length} payment{payments.length !== 1 ? "s" : ""} recorded</p>
              </div>
              <button type="button" onClick={() => setHistoryOpen(false)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto px-6 py-5">
              {historyLoading ? <p className="py-8 text-center text-sm text-slate-500">Loading payments...</p>
                : historyError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{historyError}</div>
                : payments.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">No payments recorded yet.</p>
                : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wider text-slate-400">
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Mode</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Transaction</th>
                        <th className="px-3 py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((p) => (
                        <tr key={p.paymentId} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-500">{p.paymentId}</td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-900">{formatCurrencyINR(p.amount)}</td>
                          <td className="whitespace-nowrap px-3 py-2.5">{formatPaymentMode(p.paymentMode)}</td>
                          <td className="whitespace-nowrap px-3 py-2.5">{formatNullableDate(p.paymentDate)}</td>
                          <td className="whitespace-nowrap px-3 py-2.5"><span className="capitalize">{formatPaymentStatus(p.paymentStatus)}</span></td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-500">{p.transactionId || "-"}</td>
                          <td className="max-w-[200px] truncate px-3 py-2.5 text-slate-500">{p.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
            <div className="flex justify-end border-t border-slate-100 px-6 py-4">
              <button type="button" onClick={() => setHistoryOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Block */}
      {blockOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Block Salon Access</h2>
              <p className="mt-1 text-sm text-red-600">This will block the salon owner and staff from accessing the dashboard.</p>
            </div>
            <div className="space-y-3 px-6 py-5">
              {blockError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{blockError}</div> : null}
              <label className="space-y-1 text-sm font-medium text-slate-700">
                <span>Reason</span>
                <textarea rows={3} value={blockReason} onChange={(e) => setBlockReason(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="Payment not received after grace period" />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button type="button" onClick={() => setBlockOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={handleBlock} disabled={blockSaving} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60">{blockSaving ? "Blocking..." : "Block Access"}</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Reactivate */}
      {reactivateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Reactivate Access</h2>
              <p className="mt-1 text-sm text-slate-500">Reactivate salon dashboard access after payment confirmation or admin approval.</p>
            </div>
            <div className="space-y-3 px-6 py-5">
              {reactivateError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{reactivateError}</div> : null}
              <label className="space-y-1 text-sm font-medium text-slate-700">
                <span>Reason</span>
                <textarea rows={3} value={reactivateReason} onChange={(e) => setReactivateReason(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="Payment received manually via UPI" />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button type="button" onClick={() => setReactivateOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={handleReactivate} disabled={reactivateSaving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60">{reactivateSaving ? "Reactivating..." : "Reactivate"}</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Mark Unpaid */}
      {unpaidOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Mark as Unpaid</h2>
              <p className="mt-1 text-sm text-amber-600">Mark this salon subscription as unpaid due to missed or overdue payment.</p>
            </div>
            <div className="space-y-3 px-6 py-5">
              {unpaidError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{unpaidError}</div> : null}
              <label className="space-y-1 text-sm font-medium text-slate-700">
                <span>Reason</span>
                <textarea rows={3} value={unpaidReason} onChange={(e) => setUnpaidReason(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="Payment overdue for June 2026" />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button type="button" onClick={() => setUnpaidOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={handleMarkUnpaid} disabled={unpaidSaving} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-60">{unpaidSaving ? "Saving..." : "Mark Unpaid"}</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Cancel Subscription */}
      {cancelSubOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Cancel Subscription</h2>
              <p className="mt-1 text-sm text-red-600">This will cancel the salon subscription. The salon will lose dashboard access.</p>
            </div>
            <div className="space-y-3 px-6 py-5">
              {cancelSubError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{cancelSubError}</div> : null}
              <label className="space-y-1 text-sm font-medium text-slate-700">
                <span>Reason</span>
                <textarea rows={3} value={cancelSubReason} onChange={(e) => setCancelSubReason(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="Salon requested cancellation" />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button type="button" onClick={() => setCancelSubOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Go Back</button>
              <button type="button" onClick={handleCancelSubscription} disabled={cancelSubSaving} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60">{cancelSubSaving ? "Cancelling..." : "Cancel Subscription"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
