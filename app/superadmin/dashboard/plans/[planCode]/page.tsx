"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { useParams } from "next/navigation";

import { getPlan, deactivatePlan, type PlanDetailData } from "@/src/lib/superadmin-api";
import { PLAN_MODULES, MODULE_META } from "@/src/constants/modules";
import { StatusBadge } from "@/src/components/superadmin/StatusBadge";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";
import { ConfirmDialog } from "@/src/components/superadmin/ConfirmDialog";

type FetchState = {
  data: PlanDetailData | null;
  loading: boolean;
  error: string;
  fetchKey: number;
};

type FetchAction =
  | { type: "FETCH_SUCCESS"; data: PlanDetailData }
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

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <dt className="w-48 shrink-0 text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export default function PlanDetailPage() {
  const params = useParams<{ planCode: string }>();
  const planCode = params.planCode;

  const [state, dispatch] = useReducer(fetchReducer, {
    data: null,
    loading: true,
    error: "",
    fetchKey: 0,
  });

  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    getPlan(planCode)
      .then((res) => dispatch({ type: "FETCH_SUCCESS", data: res.data! }))
      .catch((err: Error) => dispatch({ type: "FETCH_ERROR", error: err.message }));
  }, [planCode, state.fetchKey]);

  async function handleDeactivate() {
    setDeactivating(true);
    try {
      await deactivatePlan(planCode);
      setShowDeactivate(false);
      dispatch({ type: "REFETCH" });
    } catch (err) {
      dispatch({ type: "FETCH_ERROR", error: (err as Error).message });
      setShowDeactivate(false);
    } finally {
      setDeactivating(false);
    }
  }

  const { data, loading, error } = state;

  if (loading) return <LoadingState message="Loading plan..." />;
  if (error) return <ErrorState message={error} onRetry={() => dispatch({ type: "REFETCH" })} />;
  if (!data) return <ErrorState message="Plan not found." />;

  const { plan, usage } = data;

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/superadmin/dashboard/plans" className="hover:text-slate-700">Plans</Link>
          <span>/</span>
          <span className="text-slate-900">{plan.name}</span>
        </div>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">{plan.name}</h1>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/superadmin/dashboard/plans/${planCode}/edit`}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              Edit Plan
            </Link>
            {plan.isActive ? (
              <button
                type="button"
                onClick={() => setShowDeactivate(true)}
                className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Deactivate
              </button>
            ) : null}
            <Link
              href="/superadmin/dashboard/plans"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              Back to Plans
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Plan details</h2>
          <dl className="mt-4 space-y-3">
            <InfoRow label="Plan Code">
              <span className="font-mono text-xs">{plan.planCode}</span>
            </InfoRow>
            <InfoRow label="Name">{plan.name}</InfoRow>
            <InfoRow label="Description">{plan.description || "N/A"}</InfoRow>
            <InfoRow label="Status">
              <StatusBadge value={plan.isActive ? "active" : "inactive"} type="website" />
            </InfoRow>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Pricing & Limits</h2>
          <dl className="mt-4 space-y-3">
            <InfoRow label="Monthly Price">{formatPrice(plan.monthlyPrice)}</InfoRow>
            <InfoRow label="Yearly Price">{formatPrice(plan.yearlyPrice)}</InfoRow>
            <InfoRow label="Trial Days">{plan.trialDays} days</InfoRow>
            <InfoRow label="Max Staff">{plan.maxStaff}</InfoRow>
            <InfoRow label="Max Branches">{plan.maxBranches}</InfoRow>
            <InfoRow label="Appointments/Month">
              {plan.maxAppointmentsPerMonth === 0 ? "Unlimited" : plan.maxAppointmentsPerMonth}
            </InfoRow>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Modules</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {PLAN_MODULES.map((key) => {
              const enabled = plan.modules?.[key] ?? false;
              const meta = MODULE_META[key];
              return (
                <div
                  key={key}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                    enabled
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-400"
                  }`}
                >
                  <span>{enabled ? "+" : "-"}</span>
                  <span>{meta.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Usage</h2>
          <dl className="mt-4 space-y-3">
            <InfoRow label="Salons using plan">{usage.salonsUsingPlan}</InfoRow>
            <InfoRow label="Subscriptions">{usage.subscriptionsUsingPlan}</InfoRow>
          </dl>
        </section>
      </div>

      <ConfirmDialog
        open={showDeactivate}
        title="Deactivate this plan?"
        description={`This will set ${plan.name} to inactive. Existing subscriptions are not affected.`}
        confirmLabel="Deactivate"
        variant="danger"
        loading={deactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setShowDeactivate(false)}
      />
    </div>
  );
}
