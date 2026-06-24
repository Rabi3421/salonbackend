"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { createPlan, type CreatePlanPayload, type PlanModules } from "@/src/lib/superadmin-api";
import { PLAN_MODULES, MODULE_META } from "@/src/constants/modules";

const INITIAL: CreatePlanPayload = {
  planCode: "",
  name: "",
  description: "",
  monthlyPrice: 0,
  yearlyPrice: 0,
  trialDays: 14,
  maxStaff: 5,
  maxBranches: 1,
  maxAppointmentsPerMonth: 0,
  modules: {},
  isActive: true,
};

export default function CreatePlanPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreatePlanPayload>({ ...INITIAL });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleModule(key: string) {
    setForm((prev) => {
      const modules: PlanModules = { ...prev.modules };
      modules[key] = !modules[key];
      return { ...prev, modules };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await createPlan(form);
      router.push(`/superadmin/dashboard/plans/${res.data!.plan.planCode}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/superadmin/dashboard/plans" className="hover:text-slate-700">Plans</Link>
          <span>/</span>
          <span className="text-slate-900">Create</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Create new plan</h1>
      </section>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="space-y-6 p-6">
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-slate-900">Plan information</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Plan Code *</label>
                <input
                  type="text"
                  value={form.planCode}
                  onChange={(e) => updateField("planCode", e.target.value)}
                  placeholder="e.g. BASIC, STANDARD"
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={form.description ?? ""}
                onChange={(e) => updateField("description", e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-slate-900">Pricing & Limits</legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Monthly Price *</label>
                <input
                  type="number"
                  value={form.monthlyPrice}
                  onChange={(e) => updateField("monthlyPrice", Number(e.target.value))}
                  min={0}
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Yearly Price</label>
                <input
                  type="number"
                  value={form.yearlyPrice ?? 0}
                  onChange={(e) => updateField("yearlyPrice", Number(e.target.value))}
                  min={0}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Trial Days</label>
                <input
                  type="number"
                  value={form.trialDays ?? 14}
                  onChange={(e) => updateField("trialDays", Number(e.target.value))}
                  min={0}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Max Staff</label>
                <input
                  type="number"
                  value={form.maxStaff ?? 5}
                  onChange={(e) => updateField("maxStaff", Number(e.target.value))}
                  min={0}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Max Branches</label>
                <input
                  type="number"
                  value={form.maxBranches ?? 1}
                  onChange={(e) => updateField("maxBranches", Number(e.target.value))}
                  min={1}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Max Appointments/Month</label>
                <input
                  type="number"
                  value={form.maxAppointmentsPerMonth ?? 0}
                  onChange={(e) => updateField("maxAppointmentsPerMonth", Number(e.target.value))}
                  min={0}
                  placeholder="0 = unlimited"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-slate-900">Modules</legend>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PLAN_MODULES.map((key) => {
                const meta = MODULE_META[key];
                const checked = form.modules?.[key] ?? false;
                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                      checked ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleModule(key)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{meta.label}</p>
                      <p className="text-xs text-slate-500">{meta.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive ?? true}
              onChange={(e) => updateField("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
              Active (available for new subscriptions)
            </label>
          </div>
        </div>

        {error ? (
          <div className="mx-6 mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <Link
            href="/superadmin/dashboard/plans"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Plan"}
          </button>
        </div>
      </form>
    </div>
  );
}
