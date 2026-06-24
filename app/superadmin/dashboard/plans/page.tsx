"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";

import {
  getPlans,
  deactivatePlan,
  seedDefaultPlans,
  type PlanListData,
  type PlanListParams,
} from "@/src/lib/superadmin-api";
import { StatusBadge } from "@/src/components/superadmin/StatusBadge";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";
import { EmptyState } from "@/src/components/superadmin/EmptyState";
import { ConfirmDialog } from "@/src/components/superadmin/ConfirmDialog";

type FetchState = {
  data: PlanListData | null;
  loading: boolean;
  error: string;
  fetchKey: number;
};

type FetchAction =
  | { type: "FETCH_SUCCESS"; data: PlanListData }
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

function moduleCount(modules: Record<string, boolean> | undefined): number {
  if (!modules) return 0;
  return Object.values(modules).filter(Boolean).length;
}

const SUMMARY_CARDS: { label: string; key: string; color: string }[] = [
  { label: "Total", key: "total", color: "text-slate-900" },
  { label: "Active", key: "active", color: "text-emerald-600" },
  { label: "Inactive", key: "inactive", color: "text-slate-500" },
];

export default function PlansListPage() {
  const [state, dispatch] = useReducer(fetchReducer, {
    data: null,
    loading: true,
    error: "",
    fetchKey: 0,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [deactivateTarget, setDeactivateTarget] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");

  useEffect(() => {
    const params: PlanListParams = { page, limit: 20 };
    if (search) params.search = search;
    if (status) params.status = status;

    getPlans(params)
      .then((res) => dispatch({ type: "FETCH_SUCCESS", data: res.data! }))
      .catch((err: Error) => dispatch({ type: "FETCH_ERROR", error: err.message }));
  }, [search, status, page, state.fetchKey]);

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await deactivatePlan(deactivateTarget);
      setDeactivateTarget(null);
      dispatch({ type: "REFETCH" });
    } catch (err) {
      dispatch({ type: "FETCH_ERROR", error: (err as Error).message });
      setDeactivateTarget(null);
    } finally {
      setDeactivating(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    setSeedMsg("");
    try {
      const res = await seedDefaultPlans();
      const d = res.data!;
      setSeedMsg(
        d.created.length > 0
          ? `Created: ${d.created.join(", ")}. Skipped: ${d.skipped.join(", ") || "none"}.`
          : `All default plans already exist. Skipped: ${d.skipped.join(", ")}.`,
      );
      dispatch({ type: "REFETCH" });
    } catch (err) {
      setSeedMsg((err as Error).message);
    } finally {
      setSeeding(false);
    }
  }

  const { data, loading, error } = state;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Plans</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Manage Plans
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            {seeding ? "Seeding..." : "Seed Default Plans"}
          </button>
          <Link
            href="/superadmin/dashboard/plans/new"
            className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Create Plan
          </Link>
        </div>
      </section>

      {seedMsg ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {seedMsg}
          <button type="button" onClick={() => setSeedMsg("")} className="ml-3 underline">
            Dismiss
          </button>
        </div>
      ) : null}

      {data?.summary ? (
        <section className="grid grid-cols-3 gap-3">
          {SUMMARY_CARDS.map((card) => (
            <article
              key={card.key}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium text-slate-500">{card.label}</p>
              <p className={`mt-2 text-2xl font-semibold ${card.color}`}>
                {data.summary[card.key as keyof typeof data.summary] ?? 0}
              </p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); setPage(1); dispatch({ type: "REFETCH" }); }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, name, description..."
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Search
            </button>
          </form>
        </div>

        {loading ? (
          <LoadingState message="Loading plans..." />
        ) : error ? (
          <div className="p-4">
            <ErrorState message={error} onRetry={() => dispatch({ type: "REFETCH" })} />
          </div>
        ) : !data || data.plans.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No plans found"
              description={search || status ? "Try different filters." : "Create your first plan or seed defaults."}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Code</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Name</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Monthly</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Yearly</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Trial</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Staff</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Branches</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Modules</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Status</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.plans.map((plan) => (
                    <tr key={plan._id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                        {plan.planCode}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        {plan.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {formatPrice(plan.monthlyPrice)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {formatPrice(plan.yearlyPrice)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {plan.trialDays}d
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {plan.maxStaff}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {plan.maxBranches}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {moduleCount(plan.modules)}/12
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge
                          value={plan.isActive ? "active" : "inactive"}
                          type="website"
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex gap-1">
                          <Link
                            href={`/superadmin/dashboard/plans/${plan.planCode}`}
                            className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                          >
                            View
                          </Link>
                          <Link
                            href={`/superadmin/dashboard/plans/${plan.planCode}/edit`}
                            className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                          >
                            Edit
                          </Link>
                          {plan.isActive ? (
                            <button
                              type="button"
                              onClick={() => setDeactivateTarget(plan.planCode)}
                              className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                            >
                              Deactivate
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.pagination.totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page >= data.pagination.totalPages}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate this plan?"
        description={`This will set plan ${deactivateTarget} to inactive. Existing subscriptions are not affected.`}
        confirmLabel="Deactivate"
        variant="danger"
        loading={deactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
