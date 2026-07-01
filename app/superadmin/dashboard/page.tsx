"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { fetchDashboardOverview, type OverviewData } from "@/src/lib/superadmin-api";
import { ErrorState } from "@/src/components/superadmin/ErrorState";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import type {
  DashboardAttentionSalon,
  DashboardChartPoint,
  DashboardRecentEnquiry,
  DashboardRecentPayment,
  DashboardRecentSalon,
} from "@/src/types/superadmin-frontend";

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

const PIE_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#64748b"];
const STATUS_STYLES: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  trial: "border-indigo-200 bg-indigo-50 text-indigo-700",
  unpaid: "border-amber-200 bg-amber-50 text-amber-700",
  blocked: "border-red-200 bg-red-50 text-red-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-600",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  failed: "border-red-200 bg-red-50 text-red-700",
};

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
  }).format(amount || 0);
}

function fmtDate(date: string | null) {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function label(value: string) {
  return value ? value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "Unknown";
}

function hasValues(data: DashboardChartPoint[]) {
  return data.some((item) => (item.value ?? item.revenue ?? item.salons ?? item.payments ?? 0) > 0);
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[value] ?? "border-slate-200 bg-slate-50 text-slate-600"}`}>
      {label(value)}
    </span>
  );
}

function KpiCard({
  title,
  value,
  helper,
  href,
  tone = "indigo",
}: {
  title: string;
  value: string | number;
  helper: string;
  href?: string;
  tone?: "indigo" | "emerald" | "amber" | "red" | "blue" | "slate";
}) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  const content = (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <span className={`flex size-10 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}>
          <span className="size-2.5 rounded-full bg-current" />
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-500">{helper}</p>
    </article>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      <div className="mt-4 h-64 min-w-0">{children}</div>
    </section>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm font-medium text-slate-400">
      No data yet
    </div>
  );
}

function RevenueTrendChart({ data }: { data: DashboardChartPoint[] }) {
  if (!hasValues(data)) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
        <Tooltip formatter={(value) => fmtCurrency(Number(value))} />
        <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function SalonGrowthChart({ data }: { data: DashboardChartPoint[] }) {
  if (!hasValues(data)) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip />
        <Bar dataKey="salons" fill="#10b981" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function DonutChart({ data }: { data: DashboardChartPoint[] }) {
  if (!hasValues(data)) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={86} paddingAngle={3}>
          {data.map((entry, index) => (
            <Cell key={entry.name ?? index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => Number(value).toLocaleString("en-IN")} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function PaymentCollection({ data }: { data: DashboardChartPoint[] }) {
  const collected = data.find((item) => item.name === "Collected")?.value ?? 0;
  const pending = data.find((item) => item.name === "Pending")?.value ?? 0;
  const total = collected + pending;
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <div className="flex h-full flex-col justify-center">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-bold text-slate-950">{pct}%</p>
          <p className="mt-1 text-sm text-slate-500">Collected this month</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold text-emerald-600">{fmtCurrency(collected)}</p>
          <p className="mt-1 font-semibold text-amber-600">{fmtCurrency(pending)} pending</p>
        </div>
      </div>
      <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {data.map((item) => (
          <div key={item.name} className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-medium text-slate-500">{item.name}</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{fmtCurrency(item.value ?? 0)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NeedsAttentionTable({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: DashboardAttentionSalon[];
  emptyText: string;
}) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{emptyText}</div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-3 pr-3">Salon</th>
                <th className="py-3 pr-3">Plan</th>
                <th className="py-3 pr-3">Monthly</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3">Date</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.type}-${row.salonId}`} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 pr-3">
                    <p className="font-semibold text-slate-900">{row.name}</p>
                    <p className="font-mono text-xs text-slate-400">{row.salonId}</p>
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{row.planName}</td>
                  <td className="py-3 pr-3 font-semibold text-slate-900">{fmtCurrency(row.monthlyPrice)}</td>
                  <td className="py-3 pr-3"><StatusBadge value={row.status} /></td>
                  <td className="py-3 pr-3 text-slate-500">
                    {row.type === "trial"
                      ? `${fmtDate(row.trialEndDate)} (${row.daysLeft ?? 0}d left)`
                      : row.type === "blocked"
                        ? row.blockedReason || "Blocked"
                        : `${fmtDate(row.dueDate)} / grace ${fmtDate(row.graceEndDate)}`}
                  </td>
                  <td className="py-3 text-right">
                    <Link href={`/superadmin/dashboard/salons/${row.salonId}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function RecentSalons({ rows }: { rows: DashboardRecentSalon[] }) {
  return (
    <RecentCard title="Recent Salons">
      {rows.map((row) => (
        <RecentRow key={row.salonId} title={row.name} meta={`${row.salonId} · ${row.planName}`} right={<StatusBadge value={row.status} />} href={`/superadmin/dashboard/salons/${row.salonId}`} />
      ))}
    </RecentCard>
  );
}

function RecentPayments({ rows }: { rows: DashboardRecentPayment[] }) {
  return (
    <RecentCard title="Recent Payments">
      {rows.map((row) => (
        <RecentRow key={row.paymentId} title={row.salonName} meta={`${fmtCurrency(row.amount)} · ${label(row.method)} · ${fmtDate(row.paidAt || row.createdAt)}`} right={<StatusBadge value={row.status} />} href={`/superadmin/dashboard/payments/${row.paymentId}`} />
      ))}
    </RecentCard>
  );
}

function RecentEnquiries({ rows }: { rows: DashboardRecentEnquiry[] }) {
  return (
    <RecentCard title="Recent Enquiries">
      {rows.map((row) => (
        <RecentRow key={row.enquiryId} title={row.name || row.phone || "Unknown lead"} meta={`${label(row.type)} · ${fmtDate(row.createdAt)}`} right={<StatusBadge value={row.status} />} href={`/superadmin/dashboard/enquiries/${row.enquiryId}`} />
      ))}
    </RecentCard>
  );
}

function RecentCard({ title, children }: { title: string; children: ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-3">
        {hasChildren ? children : <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No recent activity yet.</div>}
      </div>
    </section>
  );
}

function RecentRow({
  title,
  meta,
  right,
  href,
}: {
  title: string;
  meta: string;
  right: ReactNode;
  href: string;
}) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-indigo-100 hover:bg-indigo-50/40">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 truncate text-xs text-slate-500">{meta}</p>
      </div>
      <div className="shrink-0">{right}</div>
    </Link>
  );
}

function QuickActions() {
  const actions = [
    { label: "Add New Salon", href: "/superadmin/dashboard/salons/new", tone: "bg-indigo-600 text-white" },
    { label: "Record Payment", href: "/superadmin/dashboard/payments", tone: "bg-emerald-600 text-white" },
    { label: "View Unpaid Salons", href: "/superadmin/dashboard/salons?status=unpaid", tone: "bg-amber-500 text-white" },
    { label: "View Trial Salons", href: "/superadmin/dashboard/salons?status=trial", tone: "bg-blue-600 text-white" },
    { label: "View Blocked Salons", href: "/superadmin/dashboard/salons?status=blocked", tone: "bg-red-600 text-white" },
    { label: "View Reports", href: "/superadmin/dashboard/reports", tone: "bg-slate-800 text-white" },
  ];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {actions.map((action) => (
          <Link key={action.label} href={action.href} className={`rounded-xl px-4 py-3 text-center text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 ${action.tone}`}>
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function SuperadminDashboardPage() {
  const [state, dispatch] = useReducer(reducer, {
    data: null,
    error: "",
    loading: true,
    retryCount: 0,
  });
  const [attentionTab, setAttentionTab] = useState<"unpaid" | "trial" | "blocked" | "due">("unpaid");

  useEffect(() => {
    fetchDashboardOverview()
      .then((res) => dispatch({ type: "FETCH_SUCCESS", data: res.data! }))
      .catch((err: Error) => dispatch({ type: "FETCH_ERROR", error: err.message }));
  }, [state.retryCount]);

  const { data, error, loading } = state;

  if (loading) return <LoadingState message="Loading dashboard analytics..." />;
  if (error) return <ErrorState message={error} onRetry={() => dispatch({ type: "RETRY" })} />;
  if (!data) return <ErrorState message="No dashboard data available." />;

  const { summary, charts, attention, recent } = data;
  const attentionTabs = [
    { key: "unpaid" as const, label: "Unpaid", rows: attention.unpaidSalons, empty: "No unpaid salons right now." },
    { key: "trial" as const, label: "Trials Ending", rows: attention.trialsEndingSoon, empty: "No trials ending in the next 7 days." },
    { key: "blocked" as const, label: "Blocked", rows: attention.blockedSalons, empty: "No blocked salons right now." },
    { key: "due" as const, label: "Due This Month", rows: attention.dueThisMonth, empty: "No due-date follow-ups this month." },
  ];
  const activeAttention = attentionTabs.find((tab) => tab.key === attentionTab) ?? attentionTabs[0];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-slate-500">
          Monitor salons, revenue, trials, and payment follow-ups.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: "RETRY" })}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            Refresh Data
          </button>
          <Link href="/superadmin/dashboard/reports" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700">
            View Reports
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Salons" value={summary.totalSalons} helper={`${summary.activeSalons} active · ${summary.trialSalons} trial`} href="/superadmin/dashboard/salons" />
        <KpiCard title="Monthly Revenue" value={fmtCurrency(summary.collectedThisMonth)} helper={`${fmtCurrency(summary.totalRevenue)} total revenue`} tone="emerald" />
        <KpiCard title="Expected Revenue" value={fmtCurrency(summary.expectedMonthlyRevenue)} helper={`${fmtCurrency(summary.pendingCollection)} pending`} tone={summary.pendingCollection > 0 ? "amber" : "emerald"} />
        <KpiCard title="Trial Salons" value={summary.trialSalons} helper={`${summary.trialsEndingSoon} ending soon`} href="/superadmin/dashboard/salons?status=trial" tone="blue" />
        <KpiCard title="Unpaid Salons" value={summary.unpaidSalons} helper="Needs payment follow-up" href="/superadmin/dashboard/salons?status=unpaid" tone="amber" />
        <KpiCard title="Blocked Salons" value={summary.blockedSalons} helper="Access blocked" href="/superadmin/dashboard/salons?status=blocked" tone="red" />
        <KpiCard title="Basic Plan" value={summary.basicPlanSalons} helper="Basic salons" href="/superadmin/dashboard/plans" tone="slate" />
        <KpiCard title="Premium Plan" value={summary.premiumPlanSalons} helper="Premium salons" href="/superadmin/dashboard/plans" tone="indigo" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Monthly Revenue Trend"><RevenueTrendChart data={charts.revenueTrend} /></ChartCard>
        <ChartCard title="Salon Growth Trend"><SalonGrowthChart data={charts.salonGrowthTrend} /></ChartCard>
        <ChartCard title="Plan Distribution"><DonutChart data={charts.planDistribution} /></ChartCard>
        <ChartCard title="Subscription Status"><DonutChart data={charts.statusDistribution} /></ChartCard>
        <ChartCard title="Payment Collection"><PaymentCollection data={charts.paymentCollection} /></ChartCard>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Needs Attention</h2>
            <p className="mt-1 text-sm text-slate-600">Follow up unpaid, due, trial-ending, and blocked salons first.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {attentionTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setAttentionTab(tab.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  attentionTab === tab.key
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.label} ({tab.rows.length})
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <NeedsAttentionTable title={activeAttention.label} rows={activeAttention.rows} emptyText={activeAttention.empty} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <RecentSalons rows={recent.salons} />
        <RecentPayments rows={recent.payments} />
        <RecentEnquiries rows={recent.enquiries} />
      </section>

      <QuickActions />
    </div>
  );
}
