"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  createSalon,
  getPlans,
  type CreateSalonPayload,
  type CreateSalonData,
  type PlanRecord,
} from "@/src/lib/superadmin-api";
import { BUSINESS_TYPES } from "@/src/constants/salon";
import { CopyButton } from "@/src/components/superadmin/CopyButton";

function SuccessView({ data }: { data: CreateSalonData }) {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-indigo-600">Salon Created</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Salon registered successfully
        </h1>
      </section>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-base font-semibold text-emerald-800">
          Salon details
        </h2>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">Salon ID:</span>
            <span className="font-mono text-slate-900">
              {data.salon.salonId}
            </span>
            <CopyButton text={data.salon.salonId} />
          </div>
          <div>
            <span className="font-medium text-slate-700">Name:</span>{" "}
            <span className="text-slate-900">{data.salon.name}</span>
          </div>
          <div>
            <span className="font-medium text-slate-700">Slug:</span>{" "}
            <span className="font-mono text-slate-600">{data.salon.slug}</span>
          </div>
          <div>
            <span className="font-medium text-slate-700">Owner Email:</span>{" "}
            <span className="text-slate-900">{data.salon.ownerEmail}</span>
          </div>
        </div>
      </div>

      {data.temporaryPassword ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-base font-semibold text-amber-800">
            Owner login credentials
          </h2>
          <p className="mt-1 text-xs text-amber-700">
            This temporary password is shown only once. Copy it now.
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">Email:</span>
              <span className="text-slate-900">{data.salon.ownerEmail}</span>
              <CopyButton text={data.salon.ownerEmail} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">
                Temporary Password:
              </span>
              <code className="rounded bg-white px-2 py-1 font-mono text-sm text-slate-900">
                {data.temporaryPassword}
              </code>
              <CopyButton text={data.temporaryPassword} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex gap-3">
        <Link
          href={`/superadmin/dashboard/salons/${data.salon.salonId}`}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          View Salon
        </Link>
        <Link
          href="/superadmin/dashboard/salons/new"
          onClick={() => window.location.reload()}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          Create Another
        </Link>
        <Link
          href="/superadmin/dashboard/salons"
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          Back to List
        </Link>
      </div>
    </div>
  );
}

const INITIAL_FORM: CreateSalonPayload = {
  name: "",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  ownerPassword: "",
  businessType: "salon",
  address: "",
  city: "",
  state: "",
  pincode: "",
  gstNumber: "",
  logoUrl: "",
  slug: "",
  trialDays: undefined,
  planCode: "",
};

export default function CreateSalonPage() {
  const [form, setForm] = useState<CreateSalonPayload>({ ...INITIAL_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CreateSalonData | null>(null);
  const [activePlans, setActivePlans] = useState<PlanRecord[]>([]);

  useEffect(() => {
    getPlans({ status: "active", limit: 100 })
      .then((res) => setActivePlans(res.data?.plans ?? []))
      .catch(() => {});
  }, []);

  function updateField(field: string, value: string | number | undefined) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = { ...form };
      if (!payload.ownerPassword) delete payload.ownerPassword;
      if (!payload.slug) delete payload.slug;
      if (!payload.planCode) delete payload.planCode;
      if (!payload.gstNumber) delete payload.gstNumber;
      if (!payload.logoUrl) delete payload.logoUrl;
      if (!payload.address) delete payload.address;
      if (!payload.pincode) delete payload.pincode;
      if (payload.trialDays === undefined || payload.trialDays === 0) {
        delete payload.trialDays;
      }

      const res = await createSalon(payload);
      setResult(res.data ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) return <SuccessView data={result} />;

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
          <span className="text-slate-900">Create</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Create new salon
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
                  Salon Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Business Type *
                </label>
                <select
                  value={form.businessType}
                  onChange={(e) => updateField("businessType", e.target.value)}
                  required
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
                Custom Slug
              </label>
              <input
                type="text"
                value={form.slug ?? ""}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="Auto-generated if empty"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-slate-900">
              Owner information
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Owner Name *
                </label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => updateField("ownerName", e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Owner Email *
                </label>
                <input
                  type="email"
                  value={form.ownerEmail}
                  onChange={(e) => updateField("ownerEmail", e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Owner Phone *
                </label>
                <input
                  type="tel"
                  value={form.ownerPhone}
                  onChange={(e) => updateField("ownerPhone", e.target.value)}
                  placeholder="10-digit Indian mobile"
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Owner Password
                </label>
                <input
                  type="password"
                  value={form.ownerPassword ?? ""}
                  onChange={(e) => updateField("ownerPassword", e.target.value)}
                  placeholder="Auto-generated if empty"
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
                  City *
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  State *
                </label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  required
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
                  placeholder="6 digits"
                  maxLength={6}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-slate-900">
              Optional settings
            </legend>

            <div className="grid gap-4 sm:grid-cols-3">
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
                  Trial Days
                </label>
                <input
                  type="number"
                  value={form.trialDays ?? ""}
                  onChange={(e) =>
                    updateField(
                      "trialDays",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="Default: 14"
                  min={0}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Plan
                </label>
                <select
                  value={form.planCode ?? ""}
                  onChange={(e) => updateField("planCode", e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Trial (no plan)</option>
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

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <Link
            href="/superadmin/dashboard/salons"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Salon"}
          </button>
        </div>
      </form>
    </div>
  );
}
