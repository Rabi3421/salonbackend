"use client";

import Link from "next/link";
import { useEffect, useState, useReducer } from "react";

import {
  getSalons,
  type SalonListData,
  type SalonListParams,
} from "@/src/lib/superadmin-api";
import { ACCOUNT_STATUSES } from "@/src/constants/salon";
import { StatusBadge } from "@/src/components/superadmin/StatusBadge";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";
import { EmptyState } from "@/src/components/superadmin/EmptyState";

type FetchState = {
  data: SalonListData | null;
  loading: boolean;
  error: string;
  fetchKey: number;
};

type FetchAction =
  | { type: "FETCH_SUCCESS"; data: SalonListData }
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const SUMMARY_CARDS: { label: string; key: string; color: string }[] = [
  { label: "Total", key: "total", color: "text-slate-900" },
  { label: "Trial", key: "trial", color: "text-indigo-600" },
  { label: "Active", key: "active", color: "text-emerald-600" },
  { label: "Expired", key: "expired", color: "text-amber-600" },
  { label: "Suspended", key: "suspended", color: "text-red-600" },
  { label: "Cancelled", key: "cancelled", color: "text-slate-500" },
];

export default function SalonsListPage() {
  const [state, dispatch] = useReducer(fetchReducer, {
    data: null,
    loading: true,
    error: "",
    fetchKey: 0,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const params: SalonListParams = { page, limit };
    if (search) params.search = search;
    if (status) params.status = status;

    getSalons(params)
      .then((res) => dispatch({ type: "FETCH_SUCCESS", data: res.data! }))
      .catch((err: Error) => dispatch({ type: "FETCH_ERROR", error: err.message }));
  }, [search, status, page, state.fetchKey]);

  const { data, loading, error } = state;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    dispatch({ type: "REFETCH" });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Salons</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Manage Salons
          </h1>
        </div>
        <Link
          href="/superadmin/dashboard/salons/new"
          className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          Create Salon
        </Link>
      </section>

      {data?.summary ? (
        <section className="grid grid-cols-3 gap-3 lg:grid-cols-6">
          {SUMMARY_CARDS.map((card) => (
            <article
              key={card.key}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium text-slate-500">
                {card.label}
              </p>
              <p className={`mt-2 text-2xl font-semibold ${card.color}`}>
                {data.summary[card.key] ?? 0}
              </p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, email, phone, city..."
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All statuses</option>
              {ACCOUNT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
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
          <LoadingState message="Loading salons..." />
        ) : error ? (
          <div className="p-4">
            <ErrorState message={error} onRetry={() => dispatch({ type: "REFETCH" })} />
          </div>
        ) : !data || data.salons.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No salons found"
              description={
                search || status
                  ? "Try changing your search or filters."
                  : "Create your first salon to get started."
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                      Salon ID
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                      Salon Name
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                      Owner
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                      Phone
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                      City / State
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                      Account
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                      Website
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                      Created
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.salons.map((salon) => (
                    <tr key={salon._id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                        {salon.salonId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        {salon.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        <div>{salon.ownerName}</div>
                        <div className="text-xs text-slate-500">
                          {salon.ownerEmail}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {salon.ownerPhone}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {salon.city}
                        {salon.state ? `, ${salon.state}` : ""}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge value={salon.accountStatus} type="account" />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge value={salon.websiteStatus} type="website" />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {formatDate(salon.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex gap-1">
                          <Link
                            href={`/superadmin/dashboard/salons/${salon.salonId}`}
                            className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                          >
                            View
                          </Link>
                          <Link
                            href={`/superadmin/dashboard/salons/${salon.salonId}/edit`}
                            className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/superadmin/dashboard/salons/${salon.salonId}/users`}
                            className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                          >
                            Users
                          </Link>
                          <Link
                            href={`/superadmin/dashboard/salons/${salon.salonId}/status`}
                            className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                          >
                            Status
                          </Link>
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
                  Showing{" "}
                  {(data.pagination.page - 1) * data.pagination.limit + 1}
                  &ndash;
                  {Math.min(
                    data.pagination.page * data.pagination.limit,
                    data.pagination.total,
                  )}{" "}
                  of {data.pagination.total}
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
                    onClick={() =>
                      setPage((p) =>
                        Math.min(data.pagination.totalPages, p + 1),
                      )
                    }
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
    </div>
  );
}
