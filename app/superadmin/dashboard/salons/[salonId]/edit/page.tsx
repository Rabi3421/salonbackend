"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { useParams } from "next/navigation";

import {
  getSalon,
  updateSalon,
  getPlans,
  type UpdateSalonPayload,
  type PlanRecord,
} from "@/src/lib/superadmin-api";
import { BUSINESS_TYPES, WEBSITE_STATUSES } from "@/src/constants/salon";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";

type LoadState = { loading: boolean; loadError: string };
type LoadAction =
  | { type: "LOADED"; form: UpdateSalonPayload }
  | { type: "LOAD_ERROR"; error: string };

function loadReducer(_state: LoadState, action: LoadAction): LoadState {
  switch (action.type) {
    case "LOADED":
      return { loading: false, loadError: "" };
    case "LOAD_ERROR":
      return { loading: false, loadError: action.error };
  }
}

export default function EditSalonPage() {
  const params = useParams<{ salonId: string }>();
  const salonId = params.salonId;

  const [form, setForm] = useState<UpdateSalonPayload>({});
  const [loadState, loadDispatch] = useReducer(loadReducer, {
    loading: true,
    loadError: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activePlans, setActivePlans] = useState<PlanRecord[]>([]);

  useEffect(() => {
    getPlans({ status: "active", limit: 100 })
      .then((res) => setActivePlans(res.data?.plans ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    getSalon(salonId)
      .then((res) => {
        const s = res.data?.salon;
        if (s) {
          setForm({
            name: s.name,
            ownerName: s.ownerName,
            ownerEmail: s.ownerEmail,
            ownerPhone: s.ownerPhone,
            businessType: s.businessType,
            address: s.address,
            city: s.city,
            state: s.state,
            pincode: s.pincode,
            gstNumber: s.gstNumber,
            logoUrl: s.logoUrl,
            websiteStatus: s.websiteStatus,
            currentPlanCode: s.currentPlanCode,
          });
          loadDispatch({ type: "LOADED", form: {} });
        }
      })
      .catch((err: Error) => loadDispatch({ type: "LOAD_ERROR", error: err.message }));
  }, [salonId]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await updateSalon(salonId, form);
      setSuccess("Salon updated successfully.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const { loading, loadError } = loadState;

  if (loading) return <LoadingState message="Loading salon..." />;
  if (loadError) return <ErrorState message={loadError} />;

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
            {salonId}
          </Link>
          <span>/</span>
          <span className="text-slate-900">Edit</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Edit salon
        </h1>
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200/80 bg-white shadow-sm"
      >
        <div className="space-y-6 p-6">
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-slate-900">
              Salon information
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Salon Name
                </label>
                <input
                  type="text"
                  value={form.name ?? ""}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Business Type
                </label>
                <select
                  value={form.businessType ?? "salon"}
                  onChange={(e) => updateField("businessType", e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {BUSINESS_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Website Status
              </label>
              <select
                value={form.websiteStatus ?? "inactive"}
                onChange={(e) => updateField("websiteStatus", e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {WEBSITE_STATUSES.map((ws) => (
                  <option key={ws} value={ws}>
                    {ws.charAt(0).toUpperCase() + ws.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-slate-900">
              Owner information
            </legend>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Owner Name
                </label>
                <input
                  type="text"
                  value={form.ownerName ?? ""}
                  onChange={(e) => updateField("ownerName", e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Owner Email
                </label>
                <input
                  type="email"
                  value={form.ownerEmail ?? ""}
                  onChange={(e) => updateField("ownerEmail", e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Owner Phone
                </label>
                <input
                  type="tel"
                  value={form.ownerPhone ?? ""}
                  onChange={(e) => updateField("ownerPhone", e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-slate-900">
              Location
            </legend>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Address
              </label>
              <input
                type="text"
                value={form.address ?? ""}
                onChange={(e) => updateField("address", e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  City
                </label>
                <input
                  type="text"
                  value={form.city ?? ""}
                  onChange={(e) => updateField("city", e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  State
                </label>
                <input
                  type="text"
                  value={form.state ?? ""}
                  onChange={(e) => updateField("state", e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Pincode
                </label>
                <input
                  type="text"
                  value={form.pincode ?? ""}
                  onChange={(e) => updateField("pincode", e.target.value)}
                  maxLength={6}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-slate-900">
              Other
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  GST Number
                </label>
                <input
                  type="text"
                  value={form.gstNumber ?? ""}
                  onChange={(e) => updateField("gstNumber", e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Plan
                </label>
                <select
                  value={form.currentPlanCode ?? ""}
                  onChange={(e) =>
                    updateField("currentPlanCode", e.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">None</option>
                  {activePlans.map((p) => (
                    <option key={p.planCode} value={p.planCode}>
                      {p.name} ({p.planCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Logo URL
              </label>
              <input
                type="url"
                value={form.logoUrl ?? ""}
                onChange={(e) => updateField("logoUrl", e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </fieldset>
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
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
