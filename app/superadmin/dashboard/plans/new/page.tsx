"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createPlan } from "@/src/lib/superadmin-api";

const MODULE_KEYS = [
  { key: "website", label: "Website" },
  { key: "appointments", label: "Appointments" },
  { key: "customers", label: "Customers" },
  { key: "staff", label: "Staff" },
  { key: "services", label: "Services" },
  { key: "packages", label: "Packages" },
  { key: "pos", label: "POS / Billing" },
  { key: "inventory", label: "Inventory" },
  { key: "expenses", label: "Expenses" },
  { key: "marketing", label: "Marketing" },
  { key: "reports", label: "Reports" },
  { key: "multi_branch", label: "Multi-Branch" },
] as const;

export default function CreatePlanPage() {
  const router = useRouter();

  const [planCode, setPlanCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [minimumMonthlyPrice, setMinimumMonthlyPrice] = useState("");

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [yearlyPrice, setYearlyPrice] = useState("");
  const [trialDays, setTrialDays] = useState("30");
  const [maxStaff, setMaxStaff] = useState("10");
  const [maxBranches, setMaxBranches] = useState("1");
  const [maxAppointments, setMaxAppointments] = useState("500");
  const [modules, setModules] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const { key } of MODULE_KEYS) m[key] = true;
    return m;
  });
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleModule(key: string) {
    setModules((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const code = planCode.trim().toUpperCase();
    if (!code) { setError("Plan code is required."); return; }
    if (!/^[A-Z0-9_-]+$/.test(code)) { setError("Plan code: only letters, numbers, hyphens, underscores."); return; }
    if (!name.trim()) { setError("Plan name is required."); return; }

    const price = Number(monthlyPrice);
    if (!price || price <= 0) { setError("Monthly price is required and must be positive."); return; }

    const minPrice = Number(minimumMonthlyPrice || monthlyPrice);
    if (minPrice > price) { setError("Minimum price cannot exceed standard price."); return; }

    setSaving(true);
    try {
      await createPlan({
        planCode: code,
        name: name.trim(),
        description: description.trim() || undefined,
        monthlyPrice: price,
        yearlyPrice: Number(yearlyPrice) || undefined,
        trialDays: Number(trialDays) || undefined,
        maxStaff: Number(maxStaff) || undefined,
        maxBranches: Number(maxBranches) || undefined,
        maxAppointmentsPerMonth: Number(maxAppointments) || undefined,
        modules,
        isActive,
      });
      router.push("/superadmin/dashboard/plans");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const enabledModuleCount = Object.values(modules).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/superadmin/dashboard/plans" className="transition hover:text-slate-600">Plans</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">Create</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Create New Plan</h1>
        <p className="mt-1 text-sm text-slate-500">Only plan code, name, and monthly price are required.</p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        {/* Required fields */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1 text-sm font-medium text-slate-700">
              <span>Plan Code <span className="text-red-500">*</span></span>
              <input
                type="text"
                value={planCode}
                onChange={(e) => setPlanCode(e.target.value.toUpperCase())}
                placeholder="e.g. STARTER"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">
              <span>Plan Name <span className="text-red-500">*</span></span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Starter"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">
              <span>Monthly Price <span className="text-red-500">*</span></span>
              <input
                type="number"
                min="1"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                placeholder="e.g. 2000"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-slate-700">
              <span>Minimum Monthly Price</span>
              <input
                type="number"
                min="0"
                value={minimumMonthlyPrice}
                onChange={(e) => setMinimumMonthlyPrice(e.target.value)}
                placeholder="Same as standard if empty"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">
              <span>Description</span>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of the plan"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
          </div>
        </div>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          <svg
            className={`size-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          Advanced Settings
          <span className="text-xs font-normal text-slate-400">
            (limits, modules, trial days)
          </span>
        </button>

        {showAdvanced ? (
          <>
            {/* Limits & Pricing */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Limits & Pricing</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-5">
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Trial Days</span>
                  <input type="number" min="0" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Max Staff</span>
                  <input type="number" min="0" value={maxStaff} onChange={(e) => setMaxStaff(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Max Branches</span>
                  <input type="number" min="1" value={maxBranches} onChange={(e) => setMaxBranches(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Max Appts/mo</span>
                  <input type="number" min="0" value={maxAppointments} onChange={(e) => setMaxAppointments(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                </label>
                <label className="space-y-1 text-sm font-medium text-slate-700">
                  <span>Yearly Price</span>
                  <input type="number" min="0" value={yearlyPrice} onChange={(e) => setYearlyPrice(e.target.value)} placeholder="0" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                </label>
              </div>
            </div>

            {/* Modules */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Modules <span className="font-normal normal-case text-slate-400">({enabledModuleCount}/{MODULE_KEYS.length} enabled)</span>
                </h2>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { const m: Record<string, boolean> = {}; for (const { key } of MODULE_KEYS) m[key] = true; setModules(m); }} className="text-xs font-medium text-indigo-600 hover:underline">All</button>
                  <button type="button" onClick={() => { const m: Record<string, boolean> = {}; for (const { key } of MODULE_KEYS) m[key] = false; setModules(m); }} className="text-xs font-medium text-slate-500 hover:underline">None</button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {MODULE_KEYS.map(({ key, label }) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm transition hover:bg-slate-50">
                    <input type="checkbox" checked={modules[key] ?? false} onChange={() => toggleModule(key)} className="size-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30" />
                    <span className="text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-4 shadow-sm">
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30" />
                <span className="text-sm font-medium text-slate-700">Active</span>
                <span className="text-xs text-slate-400">(salons can be assigned to this plan)</span>
              </label>
            </div>
          </>
        ) : null}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/superadmin/dashboard/plans" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Cancel</Link>
          <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60">{saving ? "Creating..." : "Create Plan"}</button>
        </div>
      </form>
    </div>
  );
}
