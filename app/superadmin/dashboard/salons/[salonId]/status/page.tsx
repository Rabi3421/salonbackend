"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { useParams } from "next/navigation";

import {
  getSalon,
  updateSalonStatus,
  type SalonRecord,
} from "@/src/lib/superadmin-api";
import { ACCOUNT_STATUSES, WEBSITE_STATUSES } from "@/src/constants/salon";
import { StatusBadge } from "@/src/components/superadmin/StatusBadge";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";

const DANGEROUS_STATUSES = ["suspended", "cancelled"];

type LoadState = {
  salon: SalonRecord | null;
  loading: boolean;
  loadError: string;
  fetchKey: number;
};

type LoadAction =
  | { type: "LOADED"; salon: SalonRecord }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "REFETCH" };

function loadReducer(state: LoadState, action: LoadAction): LoadState {
  switch (action.type) {
    case "LOADED":
      return { ...state, salon: action.salon, loading: false, loadError: "" };
    case "LOAD_ERROR":
      return { ...state, loading: false, loadError: action.error };
    case "REFETCH":
      return { ...state, loading: true, loadError: "", fetchKey: state.fetchKey + 1 };
  }
}

export default function SalonStatusPage() {
  const params = useParams<{ salonId: string }>();
  const salonId = params.salonId;

  const [loadState, loadDispatch] = useReducer(loadReducer, {
    salon: null,
    loading: true,
    loadError: "",
    fetchKey: 0,
  });

  const [accountStatus, setAccountStatus] = useState("");
  const [websiteStatus, setWebsiteStatus] = useState("");
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getSalon(salonId)
      .then((res) => {
        const s = res.data?.salon ?? null;
        if (s) {
          setAccountStatus(s.accountStatus);
          setWebsiteStatus(s.websiteStatus);
          loadDispatch({ type: "LOADED", salon: s });
        }
      })
      .catch((err: Error) => loadDispatch({ type: "LOAD_ERROR", error: err.message }));
  }, [salonId, loadState.fetchKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload: Record<string, string> = {};

      if (accountStatus !== salon?.accountStatus) {
        payload.accountStatus = accountStatus;
      }

      if (websiteStatus !== salon?.websiteStatus) {
        payload.websiteStatus = websiteStatus;
      }

      if (reason.trim()) {
        payload.reason = reason.trim();
      }

      if (!payload.accountStatus && !payload.websiteStatus) {
        setError("No changes to save.");
        setSubmitting(false);
        return;
      }

      const res = await updateSalonStatus(salonId, payload);
      const updated = res.data?.salon;

      if (updated) {
        loadDispatch({ type: "LOADED", salon: updated });
        setAccountStatus(updated.accountStatus);
        setWebsiteStatus(updated.websiteStatus);
      }

      setReason("");
      setSuccess("Status updated successfully.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const { salon, loading, loadError } = loadState;

  if (loading) return <LoadingState message="Loading salon..." />;
  if (loadError) return <ErrorState message={loadError} onRetry={() => loadDispatch({ type: "REFETCH" })} />;
  if (!salon) return <ErrorState message="Salon not found." />;

  const isDangerous = DANGEROUS_STATUSES.includes(accountStatus);

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
          <Link
            href={`/superadmin/dashboard/salons/${salonId}`}
            className="hover:text-slate-700"
          >
            {salon.name}
          </Link>
          <span>/</span>
          <span className="text-slate-900">Status</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Manage Status
        </h1>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          Current status
        </h2>
        <div className="mt-4 flex flex-wrap gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Account Status
            </p>
            <div className="mt-1">
              <StatusBadge value={salon.accountStatus} type="account" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              Website Status
            </p>
            <div className="mt-1">
              <StatusBadge value={salon.websiteStatus} type="website" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active</p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {salon.isActive ? "Yes" : "No"}
            </p>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200/80 bg-white shadow-sm"
      >
        <div className="space-y-5 p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Update status
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Account Status
              </label>
              <select
                value={accountStatus}
                onChange={(e) => setAccountStatus(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {ACCOUNT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Website Status
              </label>
              <select
                value={websiteStatus}
                onChange={(e) => setWebsiteStatus(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {WEBSITE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Reason for status change..."
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {isDangerous ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <strong>Warning:</strong>{" "}
              {accountStatus === "cancelled"
                ? "Cancelling will deactivate the salon and set the website to inactive."
                : "Suspending will deactivate the salon account."}
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mx-6 mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mx-6 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <Link
            href={`/superadmin/dashboard/salons/${salonId}`}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            Back
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className={`rounded-md px-6 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isDangerous
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {submitting ? "Updating..." : "Update Status"}
          </button>
        </div>
      </form>
    </div>
  );
}
