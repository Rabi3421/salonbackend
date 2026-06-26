"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { useParams } from "next/navigation";

import {
  getSalon,
  cancelSalon,
  blockSalonSubscriptionAccess,
  reactivateSalonSubscriptionAccess,
  updateSalonSubscriptionPolicy,
  type SalonDetailData,
} from "@/src/lib/superadmin-api";
import {
  formatAccessStatus,
  formatCurrencyINR,
  formatNullableDate,
  formatPlanCode,
} from "@/src/lib/formatters";
import type {
  SalonSubscriptionPolicyPayload,
  SubscriptionAccessStatus,
} from "@/src/types/superadmin-frontend";
import { StatusBadge } from "@/src/components/superadmin/StatusBadge";
import { CopyButton } from "@/src/components/superadmin/CopyButton";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";
import { ConfirmDialog } from "@/src/components/superadmin/ConfirmDialog";

type FetchState = {
  data: SalonDetailData | null;
  loading: boolean;
  error: string;
  fetchKey: number;
};

type FetchAction =
  | { type: "FETCH_SUCCESS"; data: SalonDetailData }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "REFETCH" };

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case "FETCH_SUCCESS":
      return { ...state, data: action.data, error: "", loading: false };
    case "FETCH_ERROR":
      return { ...state, error: action.error, loading: false };
    case "REFETCH":
      return { ...state, loading: true, error: "", fetchKey: state.fetchKey + 1 };
  }
}

function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const ACCESS_STATUSES: SubscriptionAccessStatus[] = [
  "trial",
  "active",
  "payment_due",
  "grace_period",
  "access_blocked",
  "expired",
  "suspended",
  "cancelled",
];

const PLAN_PRICING = {
  basic: { standardMonthlyPrice: 2000, minimumMonthlyPrice: 1000 },
  premium: { standardMonthlyPrice: 3000, minimumMonthlyPrice: 2000 },
} as const;

type PolicyFormState = {
  planCode: "basic" | "premium";
  finalMonthlyPrice: string;
  negotiationNote: string;
  nextDueDate: string;
  nextGraceEndDate: string;
  accessStatus: SubscriptionAccessStatus;
};

function toDateInputValue(dateStr?: string | null) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function getAccessBadgeClass(status?: string | null) {
  const styles: Record<string, string> = {
    trial: "border-blue-200 bg-blue-50 text-blue-700",
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    payment_due: "border-yellow-200 bg-yellow-50 text-yellow-700",
    grace_period: "border-orange-200 bg-orange-50 text-orange-700",
    access_blocked: "border-red-200 bg-red-50 text-red-700",
    suspended: "border-red-200 bg-red-50 text-red-700",
    cancelled: "border-slate-200 bg-slate-100 text-slate-600",
    expired: "border-slate-200 bg-slate-100 text-slate-600",
  };
  return styles[status ?? ""] ?? "border-slate-200 bg-slate-50 text-slate-600";
}

function AccessStatusBadge({ value }: { value?: string | null }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getAccessBadgeClass(value)}`}>
      {formatAccessStatus(value)}
    </span>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-sm font-medium text-slate-500">
        {label}
      </dt>
      <dd className="text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export default function SalonDetailPage() {
  const params = useParams<{ salonId: string }>();
  const salonId = params.salonId;

  const [state, dispatch] = useReducer(fetchReducer, {
    data: null,
    loading: true,
    error: "",
    fetchKey: 0,
  });

  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policyForm, setPolicyForm] = useState<PolicyFormState>({
    planCode: "basic",
    finalMonthlyPrice: "2000",
    negotiationNote: "",
    nextDueDate: "",
    nextGraceEndDate: "",
    accessStatus: "trial",
  });
  const [policySaving, setPolicySaving] = useState(false);
  const [policyError, setPolicyError] = useState("");
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockError, setBlockError] = useState("");
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [reactivateReason, setReactivateReason] = useState("");
  const [reactivateSaving, setReactivateSaving] = useState(false);
  const [reactivateError, setReactivateError] = useState("");

  useEffect(() => {
    getSalon(salonId)
      .then((res) => dispatch({ type: "FETCH_SUCCESS", data: res.data! }))
      .catch((err: Error) => dispatch({ type: "FETCH_ERROR", error: err.message }));
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

  function openPolicyModal() {
    const subscription = state.data?.currentSubscription;
    const planCode = subscription?.planCode?.toLowerCase() === "premium" ? "premium" : "basic";
    const pricing = PLAN_PRICING[planCode];
    setPolicyForm({
      planCode,
      finalMonthlyPrice: String(
        subscription?.finalMonthlyPrice ??
          subscription?.negotiatedMonthlyPrice ??
          subscription?.amount ??
          pricing.standardMonthlyPrice,
      ),
      negotiationNote: subscription?.negotiationNote ?? "",
      nextDueDate: toDateInputValue(subscription?.nextDueDate ?? subscription?.nextBillingDate),
      nextGraceEndDate: toDateInputValue(subscription?.nextGraceEndDate ?? subscription?.currentGraceEndDate),
      accessStatus: subscription?.accessStatus ?? (subscription?.status as SubscriptionAccessStatus) ?? "trial",
    });
    setPolicyError("");
    setPolicyOpen(true);
  }

  function validatePolicyForm(): SalonSubscriptionPolicyPayload | null {
    setPolicyError("");
    const finalMonthlyPrice = Number(policyForm.finalMonthlyPrice);
    const pricing = PLAN_PRICING[policyForm.planCode];

    if (!policyForm.planCode || !policyForm.accessStatus) {
      setPolicyError("Plan and access status are required.");
      return null;
    }
    if (Number.isNaN(finalMonthlyPrice)) {
      setPolicyError("Final monthly price must be a valid number.");
      return null;
    }
    if (finalMonthlyPrice < 0) {
      setPolicyError("Final monthly price cannot be negative.");
      return null;
    }
    if (finalMonthlyPrice < pricing.minimumMonthlyPrice) {
      setPolicyError(
        `${formatPlanCode(policyForm.planCode)} final monthly price cannot be below ${formatCurrencyINR(pricing.minimumMonthlyPrice)}.`,
      );
      return null;
    }
    if (
      policyForm.nextDueDate &&
      policyForm.nextGraceEndDate &&
      new Date(policyForm.nextGraceEndDate) < new Date(policyForm.nextDueDate)
    ) {
      setPolicyError("Grace end date cannot be before the next due date.");
      return null;
    }

    return {
      planCode: policyForm.planCode,
      finalMonthlyPrice,
      negotiationNote: policyForm.negotiationNote,
      nextDueDate: policyForm.nextDueDate || undefined,
      nextGraceEndDate: policyForm.nextGraceEndDate || undefined,
      accessStatus: policyForm.accessStatus,
    };
  }

  async function handlePolicySave() {
    const payload = validatePolicyForm();
    if (!payload) return;
    setPolicySaving(true);
    try {
      await updateSalonSubscriptionPolicy(salonId, payload);
      setPolicyOpen(false);
      dispatch({ type: "REFETCH" });
    } catch (err) {
      setPolicyError((err as Error).message);
    } finally {
      setPolicySaving(false);
    }
  }

  async function handleBlockAccess() {
    const reason = blockReason.trim();
    if (!reason) {
      setBlockError("Reason is required.");
      return;
    }
    setBlockSaving(true);
    setBlockError("");
    try {
      await blockSalonSubscriptionAccess(salonId, { reason });
      setBlockOpen(false);
      setBlockReason("");
      dispatch({ type: "REFETCH" });
    } catch (err) {
      setBlockError((err as Error).message);
    } finally {
      setBlockSaving(false);
    }
  }

  async function handleReactivateAccess() {
    const reason = reactivateReason.trim();
    if (!reason) {
      setReactivateError("Reason is required.");
      return;
    }
    setReactivateSaving(true);
    setReactivateError("");
    try {
      await reactivateSalonSubscriptionAccess(salonId, { reason });
      setReactivateOpen(false);
      setReactivateReason("");
      dispatch({ type: "REFETCH" });
    } catch (err) {
      setReactivateError((err as Error).message);
    } finally {
      setReactivateSaving(false);
    }
  }

  const { data, loading, error } = state;

  if (loading) return <LoadingState message="Loading salon details..." />;
  if (error) return <ErrorState message={error} onRetry={() => dispatch({ type: "REFETCH" })} />;
  if (!data) return <ErrorState message="Salon not found." />;

  const { salon, owner, currentSubscription, payments } = data;
  const accessStatus = currentSubscription?.accessStatus ?? currentSubscription?.status;
  const isBlockedAccess = ["access_blocked", "suspended", "cancelled"].includes(accessStatus ?? "");
  const isPaymentPendingAccess = ["payment_due", "grace_period"].includes(accessStatus ?? "");

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/superadmin/dashboard/salons"
            className="hover:text-slate-700"
          >
            Salons
          </Link>
          <span>/</span>
          <span className="text-slate-900">{salon.name}</span>
        </div>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">
            {salon.name}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/superadmin/dashboard/salons/${salonId}/edit`}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              Edit Salon
            </Link>
            <Link
              href={`/superadmin/dashboard/salons/${salonId}/users`}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              Manage Users
            </Link>
            <Link
              href={`/superadmin/dashboard/salons/${salonId}/website-content`}
              className="rounded-xl border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-600 shadow-sm transition hover:bg-indigo-50"
            >
              Website Content
            </Link>
            <Link
              href={`/superadmin/dashboard/salons/${salonId}/status`}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              Change Status
            </Link>
            {salon.accountStatus !== "cancelled" ? (
              <button
                type="button"
                onClick={() => setShowCancel(true)}
                className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Cancel Salon
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Salon details
          </h2>
          <dl className="mt-4 space-y-3">
            <InfoRow label="Salon ID">
              <span className="flex items-center gap-2">
                <span className="font-mono text-xs">{salon.salonId}</span>
                <CopyButton text={salon.salonId} />
              </span>
            </InfoRow>
            <InfoRow label="Business Type">
              <span className="capitalize">
                {salon.businessType.replace(/_/g, " ")}
              </span>
            </InfoRow>
            <InfoRow label="Account Status">
              <StatusBadge value={salon.accountStatus} type="account" />
            </InfoRow>
            <InfoRow label="Website Status">
              <StatusBadge value={salon.websiteStatus} type="website" />
            </InfoRow>
            <InfoRow label="Active">
              {salon.isActive ? "Yes" : "No"}
            </InfoRow>
            <InfoRow label="Created">
              {formatDate(salon.createdAt)}
            </InfoRow>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Owner details
          </h2>
          {owner ? (
            <dl className="mt-4 space-y-3">
              <InfoRow label="Name">{owner.name}</InfoRow>
              <InfoRow label="Email">{owner.email}</InfoRow>
              <InfoRow label="Phone">{owner.phone}</InfoRow>
              <InfoRow label="Role">
                <span className="capitalize">
                  {owner.role.replace(/_/g, " ")}
                </span>
              </InfoRow>
              <InfoRow label="Last Login">
                {owner.lastLoginAt
                  ? formatDate(owner.lastLoginAt)
                  : "Never"}
              </InfoRow>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No owner user found.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Location
          </h2>
          <dl className="mt-4 space-y-3">
            <InfoRow label="Address">{salon.address || "N/A"}</InfoRow>
            <InfoRow label="City">{salon.city || "N/A"}</InfoRow>
            <InfoRow label="State">{salon.state || "N/A"}</InfoRow>
            <InfoRow label="Pincode">{salon.pincode || "N/A"}</InfoRow>
            <InfoRow label="GST Number">{salon.gstNumber || "N/A"}</InfoRow>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Subscription & Billing
          </h2>
          <dl className="mt-4 space-y-3">
            <InfoRow label="Trial Start">
              {formatDate(salon.trialStartDate)}
            </InfoRow>
            <InfoRow label="Trial End">
              {formatDate(salon.trialEndDate)}
            </InfoRow>
            <InfoRow label="Current Plan">
              {salon.currentPlanCode || "N/A"}
            </InfoRow>
            {currentSubscription ? (
              <>
                <InfoRow label="Sub Status">
                  <StatusBadge
                    value={currentSubscription.status}
                    type="account"
                  />
                </InfoRow>
                <InfoRow label="Billing Cycle">
                  <span className="capitalize">
                    {currentSubscription.billingCycle}
                  </span>
                </InfoRow>
                <InfoRow label="Amount">
                  {formatCurrency(currentSubscription.amount)}
                </InfoRow>
                <InfoRow label="Next Billing">
                  {formatDate(currentSubscription.nextBillingDate)}
                </InfoRow>
              </>
            ) : null}
            <InfoRow label="Total Payments">
              <Link
                href={`/superadmin/dashboard/payments?salonId=${salonId}`}
                className="text-indigo-600 hover:underline"
              >
                {payments.totalPayments}
              </Link>
            </InfoRow>
            <InfoRow label="Total Paid">
              {formatCurrency(payments.totalPaid)}
            </InfoRow>
            <InfoRow label="Add Payment">
              <Link
                href="/superadmin/dashboard/payments/new"
                className="text-xs text-indigo-600 hover:underline"
              >
                Record a payment
              </Link>
            </InfoRow>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {currentSubscription ? (
              <>
                <Link
                  href={`/superadmin/dashboard/subscriptions/${currentSubscription.subscriptionId}`}
                  className="rounded border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  View Subscription
                </Link>
                <Link
                  href={`/superadmin/dashboard/subscriptions/${currentSubscription.subscriptionId}/renew`}
                  className="rounded border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Renew
                </Link>
                <Link
                  href={`/superadmin/dashboard/subscriptions/${currentSubscription.subscriptionId}/change-plan`}
                  className="rounded border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Change Plan
                </Link>
              </>
            ) : (
              <Link
                href="/superadmin/dashboard/subscriptions/new"
                className="rounded border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
              >
                Assign Subscription
              </Link>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Subscription Policy
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Superadmin controls for negotiated pricing, due dates, grace period, and salon dashboard access.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openPolicyModal}
              disabled={!currentSubscription}
              className="rounded-xl border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-600 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Manage Subscription
            </button>
            <button
              type="button"
              onClick={() => { setBlockError(""); setBlockOpen(true); }}
              disabled={!currentSubscription}
              className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Block Access
            </button>
            <button
              type="button"
              onClick={() => { setReactivateError(""); setReactivateOpen(true); }}
              disabled={!currentSubscription}
              className="rounded-xl border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reactivate Access
            </button>
          </div>
        </div>

        {currentSubscription ? (
          <>
            {isBlockedAccess ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                Salon dashboard access is currently blocked.
              </div>
            ) : null}
            {isPaymentPendingAccess ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                Payment is pending. Access will be blocked after grace period.
              </div>
            ) : null}
            <dl className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InfoRow label="Current Plan">
                {formatPlanCode(currentSubscription.planCode)}
              </InfoRow>
              <InfoRow label="Access Status">
                <AccessStatusBadge value={accessStatus} />
              </InfoRow>
              <InfoRow label="Subscription Status">
                <AccessStatusBadge value={currentSubscription.status} />
              </InfoRow>
              <InfoRow label="Trial Start">
                {formatNullableDate(currentSubscription.trialStartDate ?? salon.trialStartDate)}
              </InfoRow>
              <InfoRow label="Trial End">
                {formatNullableDate(currentSubscription.trialEndDate ?? salon.trialEndDate)}
              </InfoRow>
              <InfoRow label="Final Monthly Price">
                {formatCurrencyINR(currentSubscription.finalMonthlyPrice ?? currentSubscription.amount)}
              </InfoRow>
              <InfoRow label="Standard Monthly Price">
                {formatCurrencyINR(currentSubscription.standardMonthlyPrice)}
              </InfoRow>
              <InfoRow label="Minimum Monthly Price">
                {formatCurrencyINR(currentSubscription.minimumMonthlyPrice)}
              </InfoRow>
              <InfoRow label="Next Due Date">
                {formatNullableDate(currentSubscription.nextDueDate ?? currentSubscription.nextBillingDate)}
              </InfoRow>
              <InfoRow label="Grace End Date">
                {formatNullableDate(currentSubscription.nextGraceEndDate ?? currentSubscription.currentGraceEndDate)}
              </InfoRow>
              <InfoRow label="Payment Status">
                <span className="capitalize">{currentSubscription.paymentStatus?.replace(/_/g, " ") ?? "N/A"}</span>
              </InfoRow>
              <InfoRow label="Last Payment Date">
                {formatNullableDate(currentSubscription.lastPaidAt)}
              </InfoRow>
              <InfoRow label="Last Payment ID">
                {currentSubscription.lastPaymentId || "N/A"}
              </InfoRow>
              <InfoRow label="Negotiation Note">
                {currentSubscription.negotiationNote || "N/A"}
              </InfoRow>
            </dl>
          </>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No active subscription found. Assign a subscription before managing subscription policy.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Enquiries</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/superadmin/dashboard/enquiries?salonId=${salonId}`}
            className="rounded border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            View Enquiries
          </Link>
          <Link
            href="/superadmin/dashboard/enquiries/new"
            className="rounded border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
          >
            Add Enquiry
          </Link>
        </div>
      </section>

      <ConfirmDialog
        open={showCancel}
        title="Cancel this salon?"
        description={`This will set ${salon.name} to cancelled status, deactivate the account, and set website to inactive. This action can be reversed by changing the status later.`}
        confirmLabel="Cancel Salon"
        variant="danger"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setShowCancel(false)}
      />

      {policyOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Manage Subscription</h2>
              <p className="mt-1 text-sm text-slate-500">
                Update plan, negotiated monthly price, billing dates, and access status.
              </p>
            </div>
            <div className="space-y-4 px-6 py-5">
              {policyError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {policyError}
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Plan</span>
                  <select
                    value={policyForm.planCode}
                    onChange={(event) => {
                      const planCode = event.target.value as "basic" | "premium";
                      const pricing = PLAN_PRICING[planCode];
                      setPolicyForm((prev) => ({
                        ...prev,
                        planCode,
                        finalMonthlyPrice: String(pricing.standardMonthlyPrice),
                      }));
                    }}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Access Status</span>
                  <select
                    value={policyForm.accessStatus}
                    onChange={(event) => setPolicyForm((prev) => ({ ...prev, accessStatus: event.target.value as SubscriptionAccessStatus }))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {ACCESS_STATUSES.map((status) => (
                      <option key={status} value={status}>{formatAccessStatus(status)}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Final Monthly Price</span>
                  <input
                    type="number"
                    min="0"
                    value={policyForm.finalMonthlyPrice}
                    onChange={(event) => setPolicyForm((prev) => ({ ...prev, finalMonthlyPrice: event.target.value }))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="block text-xs font-normal text-slate-500">
                    Standard {formatCurrencyINR(PLAN_PRICING[policyForm.planCode].standardMonthlyPrice)} · minimum {formatCurrencyINR(PLAN_PRICING[policyForm.planCode].minimumMonthlyPrice)}
                  </span>
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Next Due Date</span>
                  <input
                    type="date"
                    value={policyForm.nextDueDate}
                    onChange={(event) => setPolicyForm((prev) => ({ ...prev, nextDueDate: event.target.value }))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Grace End Date</span>
                  <input
                    type="date"
                    value={policyForm.nextGraceEndDate}
                    onChange={(event) => setPolicyForm((prev) => ({ ...prev, nextGraceEndDate: event.target.value }))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700 sm:col-span-2">
                  <span>Negotiation Note</span>
                  <textarea
                    rows={4}
                    value={policyForm.negotiationNote}
                    onChange={(event) => setPolicyForm((prev) => ({ ...prev, negotiationNote: event.target.value }))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Reason for negotiated price or access decision"
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setPolicyOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePolicySave}
                disabled={policySaving}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {policySaving ? "Saving..." : "Save Policy"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {blockOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Block Access</h2>
              <p className="mt-1 text-sm text-red-600">
                This will block the salon owner and allowed staff from using the salon dashboard.
              </p>
            </div>
            <div className="space-y-3 px-6 py-5">
              {blockError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{blockError}</div> : null}
              <label className="space-y-1 text-sm font-medium text-slate-700">
                <span>Reason</span>
                <textarea
                  rows={4}
                  value={blockReason}
                  onChange={(event) => setBlockReason(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Payment not received after grace period"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button type="button" onClick={() => setBlockOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={handleBlockAccess} disabled={blockSaving} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60">
                {blockSaving ? "Blocking..." : "Block Access"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reactivateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Reactivate Access</h2>
              <p className="mt-1 text-sm text-slate-500">
                Reactivate salon dashboard access after manual payment confirmation or admin approval.
              </p>
            </div>
            <div className="space-y-3 px-6 py-5">
              {reactivateError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{reactivateError}</div> : null}
              <label className="space-y-1 text-sm font-medium text-slate-700">
                <span>Reason</span>
                <textarea
                  rows={4}
                  value={reactivateReason}
                  onChange={(event) => setReactivateReason(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Payment received manually via UPI"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button type="button" onClick={() => setReactivateOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={handleReactivateAccess} disabled={reactivateSaving} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60">
                {reactivateSaving ? "Reactivating..." : "Reactivate Access"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
