"use client";

import Link from "next/link";
import { useEffect, useReducer } from "react";

import { getDashboardOverview, type OverviewData } from "@/src/lib/superadmin-api";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";

type State = {
  data: OverviewData | null;
  error: string;
  loading: boolean;
  retryCount: number;
};

type Action =
  | { type: "FETCH_SUCCESS"; data: OverviewData }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "RETRY" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_SUCCESS":
      return { ...state, data: action.data, error: "", loading: false };
    case "FETCH_ERROR":
      return { ...state, error: action.error, loading: false };
    case "RETRY":
      return { ...state, loading: true, error: "", retryCount: state.retryCount + 1 };
  }
}

function fmtCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SuperadminDashboardPage() {
  const [state, dispatch] = useReducer(reducer, {
    data: null,
    error: "",
    loading: true,
    retryCount: 0,
  });

  useEffect(() => {
    getDashboardOverview()
      .then((res) => dispatch({ type: "FETCH_SUCCESS", data: res.data! }))
      .catch((err: Error) => dispatch({ type: "FETCH_ERROR", error: err.message }));
  }, [state.retryCount]);

  const { data, error, loading } = state;

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={() => dispatch({ type: "RETRY" })} />;
  if (!data) return <ErrorState message="No data available." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: "RETRY" })}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>
            Refresh Data
          </button>
          <Link
            href="/superadmin/dashboard/reports"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
            View Reports
          </Link>
        </div>
      </div>

      {/* Hero Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-indigo-50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-200">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            </div>
            <p className="text-sm font-medium text-indigo-900/70">Total Salons</p>
          </div>
          <p className="mt-4 text-3xl font-bold text-indigo-900">{data.totalSalons}</p>
          <p className="mt-1 text-xs text-indigo-600">{data.activeSalons} active &middot; {data.trialSalons} trial</p>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shadow-md shadow-emerald-200">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
            </div>
            <p className="text-sm font-medium text-emerald-900/70">Monthly Revenue</p>
          </div>
          <p className="mt-4 text-3xl font-bold text-emerald-900">{fmtCurrency(data.monthlyRevenue)}</p>
          <p className="mt-1 text-xs text-emerald-600">Total: {fmtCurrency(data.totalRevenue)}</p>
        </div>

        <div className="rounded-2xl bg-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700 shadow-md shadow-slate-300">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
            </div>
            <p className="text-sm font-medium text-slate-700">Enquiries</p>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{data.newEnquiries + data.openEnquiries}</p>
          <p className="mt-1 text-xs text-slate-500">{data.newEnquiries} new &middot; {data.demoRequests} demo</p>
        </div>

        <div className="rounded-2xl bg-amber-50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 shadow-md shadow-amber-200">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>
            </div>
            <p className="text-sm font-medium text-amber-900/70">Pending</p>
          </div>
          <p className="mt-4 text-3xl font-bold text-amber-900">{data.pendingPayments}</p>
          <p className="mt-1 text-xs text-amber-600">{data.expiringTrials} trials expiring</p>
        </div>
      </div>

      {/* Platform Summary + Salon Breakdown */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Platform Summary</h2>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-600">All Systems Operational</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{fmtCurrency(data.totalRevenue)}</p>
              <p className="mt-1 text-xs font-medium text-slate-400">Total Revenue</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{data.activeSalons}</p>
              <p className="mt-1 text-xs font-medium text-slate-400">Active Salons</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{data.supportRequests}</p>
              <p className="mt-1 text-xs font-medium text-slate-400">Support Tickets</p>
            </div>
          </div>

          {/* Quick Actions in gradient band */}
          <div className="mt-5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 p-4">
            <div className="grid grid-cols-3 gap-3">
              <Link href="/superadmin/dashboard/salons/new" className="flex flex-col items-center gap-2 rounded-xl bg-white/20 p-3 text-center transition hover:bg-white/30">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/30">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </div>
                <span className="text-xs font-semibold text-white">New Salon</span>
              </Link>
              <Link href="/superadmin/dashboard/payments/new" className="flex flex-col items-center gap-2 rounded-xl bg-white/20 p-3 text-center transition hover:bg-white/30">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/30">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
                </div>
                <span className="text-xs font-semibold text-white">Add Payment</span>
              </Link>
              <Link href="/superadmin/dashboard/enquiries" className="flex flex-col items-center gap-2 rounded-xl bg-white/20 p-3 text-center transition hover:bg-white/30">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/30">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                </div>
                <span className="text-xs font-semibold text-white">Enquiries</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Salon Status Breakdown */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-900">Salon Breakdown</h2>

          <div className="mt-5 space-y-3">
            {[
              { label: "Active", value: data.activeSalons, color: "bg-emerald-500" },
              { label: "Trial", value: data.trialSalons, color: "bg-indigo-500" },
              { label: "Expired", value: data.expiredSalons, color: "bg-amber-500" },
              { label: "Suspended", value: data.suspendedSalons, color: "bg-red-500" },
              { label: "Cancelled", value: data.cancelledSalons, color: "bg-slate-400" },
            ].map((item) => {
              const pct = data.totalSalons > 0 ? Math.max((item.value / data.totalSalons) * 100, 2) : 0;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="w-20 text-xs font-medium text-slate-500">{item.label}</span>
                  <div className="flex-1">
                    <div className="h-3 w-full rounded-full bg-slate-100">
                      <div className={`h-3 rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="w-8 text-right text-sm font-bold text-slate-700">{item.value}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap gap-2">
              <Link href="/superadmin/dashboard/salons" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">View All Salons</Link>
              <Link href="/superadmin/dashboard/plans" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Plans</Link>
              <Link href="/superadmin/dashboard/subscriptions" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Subscriptions</Link>
              <Link href="/superadmin/dashboard/settings" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Settings</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
