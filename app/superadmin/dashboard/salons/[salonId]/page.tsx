"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { useParams } from "next/navigation";

import {
  getSalon,
  cancelSalon,
  type SalonDetailData,
} from "@/src/lib/superadmin-api";
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

  const { data, loading, error } = state;

  if (loading) return <LoadingState message="Loading salon details..." />;
  if (error) return <ErrorState message={error} onRetry={() => dispatch({ type: "REFETCH" })} />;
  if (!data) return <ErrorState message="Salon not found." />;

  const { salon, owner, currentSubscription, payments } = data;

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
            <InfoRow label="Slug">
              <span className="font-mono text-xs">{salon.slug || "N/A"}</span>
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
    </div>
  );
}
