"use client";

import Link from "next/link";
import { useEffect, useState, useReducer } from "react";

import {
  getSalons,
  toggleSalonActive,
  permanentDeleteSalon,
  type SalonListData,
  type SalonListParams,
  type SalonRecord,
} from "@/src/lib/superadmin-api";
import { ACCOUNT_STATUSES } from "@/src/constants/salon";
import { StatusBadge } from "@/src/components/superadmin/StatusBadge";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";
import { EmptyState } from "@/src/components/superadmin/EmptyState";
import {
  readInitialSuperadminSearch,
  SUPERADMIN_HEADER_SEARCH_EVENT,
  type SuperadminHeaderSearchDetail,
} from "@/src/lib/superadmin-header-search";

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
  { label: "Unpaid", key: "unpaid", color: "text-amber-600" },
  { label: "Blocked", key: "blocked", color: "text-red-600" },
  { label: "Cancelled", key: "cancelled", color: "text-slate-500" },
];

function ToggleSwitch({
  checked,
  loading,
  onChange,
}: {
  checked: boolean;
  loading: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={loading}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:ring-offset-1 disabled:cursor-wait disabled:opacity-60 ${
        checked ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`pointer-events-none inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

export default function SalonsListPage() {
  const [state, dispatch] = useReducer(fetchReducer, {
    data: null,
    loading: true,
    error: "",
    fetchKey: 0,
  });

  const [search, setSearch] = useState(readInitialSuperadminSearch);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<SalonRecord | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const params: SalonListParams = { page, limit };
    if (search) params.search = search;
    if (status) params.status = status;

    getSalons(params)
      .then((res) => dispatch({ type: "FETCH_SUCCESS", data: res.data! }))
      .catch((err: Error) => dispatch({ type: "FETCH_ERROR", error: err.message }));
  }, [search, status, page, state.fetchKey]);

  useEffect(() => {
    function handleHeaderSearch(event: Event) {
      const detail = (event as CustomEvent<SuperadminHeaderSearchDetail>).detail;
      if (detail?.section !== "salons") return;
      setSearch(detail.search);
      setPage(1);
    }

    window.addEventListener(SUPERADMIN_HEADER_SEARCH_EVENT, handleHeaderSearch);
    return () => window.removeEventListener(SUPERADMIN_HEADER_SEARCH_EVENT, handleHeaderSearch);
  }, []);

  const { data, loading, error } = state;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    dispatch({ type: "REFETCH" });
  }

  const [toggleError, setToggleError] = useState("");

  async function handleToggle(salonId: string) {
    setTogglingId(salonId);
    setToggleError("");
    try {
      await toggleSalonActive(salonId);
      dispatch({ type: "REFETCH" });
    } catch (err) {
      setToggleError((err as Error).message);
    } finally {
      setTogglingId(null);
    }
  }

  async function handlePermanentDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await permanentDeleteSalon(deleteTarget.salonId);
      setDeleteTarget(null);
      setDeleteConfirmText("");
      dispatch({ type: "REFETCH" });
    } catch (err) {
      setDeleteError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  const deleteConfirmMatch = deleteTarget
    ? deleteConfirmText.trim().toLowerCase() === deleteTarget.name.trim().toLowerCase()
    : false;

  return (
    <div className="space-y-6">
      <section className="flex justify-end">
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
            <article key={card.key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">{card.label}</p>
              <p className={`mt-2 text-2xl font-semibold ${card.color}`}>{data.summary[card.key] ?? 0}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, email, phone..."
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All statuses</option>
              {ACCOUNT_STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
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

        {toggleError ? (
          <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {toggleError}
            <button type="button" onClick={() => setToggleError("")} className="ml-3 font-medium underline">Dismiss</button>
          </div>
        ) : null}

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
              description={search || status ? "Try changing your search or filters." : "Create your first salon to get started."}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Salon ID</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Salon Name</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Owner</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Phone</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Account</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Website</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Created</th>
                    <th className="whitespace-nowrap px-4 py-3 text-center font-medium text-slate-600">Active</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">Actions</th>
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
                        <div className="text-xs text-slate-500">{salon.ownerEmail}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{salon.ownerPhone}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge value={salon.accountStatus} type="account" />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge value={salon.websiteStatus} type="website" />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {formatDate(salon.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <ToggleSwitch
                          checked={salon.isActive}
                          loading={togglingId === salon.salonId}
                          onChange={() => handleToggle(salon.salonId)}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-0.5">
                          <Link
                            href={`/superadmin/dashboard/salons/${salon.salonId}`}
                            title="View"
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          </Link>
                          <Link
                            href={`/superadmin/dashboard/salons/${salon.salonId}/edit`}
                            title="Edit"
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                          </Link>
                          <Link
                            href={`/superadmin/dashboard/salons/${salon.salonId}/users`}
                            title="Users"
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                          </Link>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => {
                              setDeleteTarget(salon);
                              setDeleteConfirmText("");
                              setDeleteError("");
                            }}
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          </button>
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
                  Showing {(data.pagination.page - 1) * data.pagination.limit + 1}
                  &ndash;
                  {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}{" "}
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

      {/* Permanent Delete Confirmation Modal */}
      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-red-700">Permanently Delete Salon</h2>
              <p className="mt-1 text-sm text-slate-500">
                This will permanently delete <strong className="text-slate-900">{deleteTarget.name}</strong> and
                all related data including users, subscriptions, payments, appointments, bills,
                customers, services, packages, staff, inventory, website content, and enquiries.
              </p>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-semibold text-red-800">This action cannot be undone.</p>
                <p className="mt-1 text-xs text-red-600">All salon data will be permanently removed from the database.</p>
              </div>
              {deleteError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {deleteError}
                </div>
              ) : null}
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                <span>
                  Type <strong className="text-red-600">{deleteTarget.name}</strong> to confirm:
                </span>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={deleteTarget.name}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  autoComplete="off"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePermanentDelete}
                disabled={!deleteConfirmMatch || deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
