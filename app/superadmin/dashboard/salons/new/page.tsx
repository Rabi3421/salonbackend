"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";

import {
  createSalon,
  getPlans,
  type CreateSalonPayload,
  type CreateSalonData,
  type PlanRecord,
} from "@/src/lib/superadmin-api";
import { BUSINESS_TYPES } from "@/src/constants/salon";
import { CopyButton } from "@/src/components/superadmin/CopyButton";

type Toast = {
  id: number;
  message: string;
  type: "error" | "success";
};

type FormErrors = Partial<Record<keyof CreateSalonPayload, string>>;
type BusinessTypeOption = (typeof BUSINESS_TYPES)[number];

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
  trialDays: undefined,
  planCode: "",
};

function getIndianMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  const withoutCountryCode = digits.startsWith("91") && digits.length > 10 ? digits.slice(2) : digits;
  const phone = parsePhoneNumberFromString(withoutCountryCode, "IN");

  if (!/^[6-9]\d{9}$/.test(withoutCountryCode) || !phone?.isValid() || phone.getType() !== "MOBILE") {
    return null;
  }

  return phone.nationalNumber;
}

function formatPhoneInput(value: string) {
  const hasPlus = value.trim().startsWith("+");
  const digits = value.replace(/\D/g, "").slice(0, hasPlus ? 12 : 10);
  return hasPlus ? `+${digits}` : digits;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function isBusinessType(value: string): value is BusinessTypeOption {
  return BUSINESS_TYPES.includes(value as BusinessTypeOption);
}

function validateSalonForm(form: CreateSalonPayload) {
  const errors: FormErrors = {};
  const name = form.name.trim();
  const ownerName = form.ownerName.trim();
  const ownerEmail = form.ownerEmail.trim();
  const ownerPhone = getIndianMobile(form.ownerPhone);
  const city = form.city.trim();
  const state = form.state.trim();
  const pincode = form.pincode?.trim() ?? "";
  const gstNumber = form.gstNumber?.trim().toUpperCase() ?? "";
  const logoUrl = form.logoUrl?.trim() ?? "";
  const ownerPassword = form.ownerPassword ?? "";

  if (name.length < 2) errors.name = "Salon name must be at least 2 characters.";
  if (!isBusinessType(form.businessType)) errors.businessType = "Select a valid business type.";
  if (ownerName.length < 2) errors.ownerName = "Owner name must be at least 2 characters.";
  if (!isValidEmail(ownerEmail)) errors.ownerEmail = "Enter a valid owner email address.";
  if (!ownerPhone) errors.ownerPhone = "Enter a valid 10-digit Indian mobile number.";
  if (ownerPassword && ownerPassword.length < 8) {
    errors.ownerPassword = "Owner password must be at least 8 characters.";
  }
  if (city.length < 2) errors.city = "City must be at least 2 characters.";
  if (state.length < 2) errors.state = "State must be at least 2 characters.";
  if (pincode && !/^\d{6}$/.test(pincode)) errors.pincode = "Pincode must be exactly 6 digits.";
  if (gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstNumber)) {
    errors.gstNumber = "Enter a valid 15-character GST number.";
  }
  if (logoUrl && !isValidUrl(logoUrl)) errors.logoUrl = "Logo URL must be a valid http or https URL.";
  if (
    form.trialDays !== undefined &&
    (!Number.isInteger(form.trialDays) || form.trialDays < 0 || form.trialDays > 365)
  ) {
    errors.trialDays = "Trial days must be a whole number between 0 and 365.";
  }

  return { errors, ownerPhone };
}

export default function CreateSalonPage() {
  const [form, setForm] = useState<CreateSalonPayload>({ ...INITIAL_FORM });
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [result, setResult] = useState<CreateSalonData | null>(null);
  const [activePlans, setActivePlans] = useState<PlanRecord[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    getPlans({ status: "active", limit: 100 })
      .then((res) => setActivePlans(res.data?.plans ?? []))
      .catch(() => {});
  }, []);

  function showToast(message: string, type: Toast["type"] = "error") {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }].slice(-3));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4200);
  }

  function updateField(field: keyof CreateSalonPayload, value: string | number | undefined) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function updateOwnerPhone(value: string) {
    const formatted = formatPhoneInput(value);
    updateField("ownerPhone", formatted);
    if (phoneError) setPhoneError("");
  }

  function inputClass(field: keyof CreateSalonPayload) {
    return `mt-1 w-full rounded-md border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
      fieldErrors[field]
        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
        : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20"
    }`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setPhoneError("");
    setFieldErrors({});

    try {
      const payload = { ...form };
      const validation = validateSalonForm(payload);
      const messages = Object.values(validation.errors);

      if (messages.length > 0 || !validation.ownerPhone) {
        setFieldErrors(validation.errors);
        if (validation.errors.ownerPhone) setPhoneError(validation.errors.ownerPhone);
        messages.slice(0, 3).forEach((message) => showToast(message));
        if (messages.length > 3) {
          showToast(`Please fix ${messages.length - 3} more validation issue(s).`);
        }
        setSubmitting(false);
        return;
      }

      payload.name = payload.name.trim();
      payload.ownerName = payload.ownerName.trim();
      payload.ownerEmail = payload.ownerEmail.trim().toLowerCase();
      payload.ownerPhone = validation.ownerPhone;
      payload.city = payload.city.trim();
      payload.state = payload.state.trim();
      if (payload.gstNumber) payload.gstNumber = payload.gstNumber.trim().toUpperCase();
      if (payload.logoUrl) payload.logoUrl = payload.logoUrl.trim();
      if (payload.address) payload.address = payload.address.trim();
      if (payload.pincode) payload.pincode = payload.pincode.trim();
      if (!payload.ownerPassword) delete payload.ownerPassword;
      if (!payload.planCode) delete payload.planCode;
      if (!payload.gstNumber) delete payload.gstNumber;
      if (!payload.logoUrl) delete payload.logoUrl;
      if (!payload.address) delete payload.address;
      if (!payload.pincode) delete payload.pincode;
      if (payload.trialDays === undefined || payload.trialDays === 0) {
        delete payload.trialDays;
      }

      const res = await createSalon(payload);
      showToast("Salon created successfully.", "success");
      setResult(res.data ?? null);
    } catch (err) {
      const message = (err as Error).message;
      showToast(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) return <SuccessView data={result} />;

  return (
    <div className="space-y-6">
      <div className="fixed right-5 top-5 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`w-80 rounded-2xl border px-4 py-3 text-sm font-medium shadow-xl ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

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
        noValidate
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
                  className={inputClass("name")}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Business Type *
                </label>
                <select
                  value={form.businessType}
                  onChange={(e) => updateField("businessType", e.target.value)}
                  className={inputClass("businessType")}
                >
                  {BUSINESS_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
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
                  className={inputClass("ownerName")}
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
                  className={inputClass("ownerEmail")}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Owner Phone *
                </label>
                <input
                  type="tel"
                  value={form.ownerPhone}
                  onChange={(e) => updateOwnerPhone(e.target.value)}
                  onBlur={() => {
                    if (form.ownerPhone && !getIndianMobile(form.ownerPhone)) {
                      setPhoneError("Enter a valid 10-digit Indian mobile number.");
                    }
                  }}
                  placeholder="10-digit Indian mobile"
                  inputMode="numeric"
                  autoComplete="tel"
                  pattern="[0-9+]{10,13}"
                  className={`mt-1 w-full rounded-md border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
                    phoneError || fieldErrors.ownerPhone
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                  }`}
                />
                {phoneError ? (
                  <p className="mt-1 text-xs font-medium text-red-600">{phoneError}</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">
                    Use a valid Indian mobile number, e.g. 9876543210.
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Owner Password
                </label>
                <div className="relative mt-1">
                  <input
                    type={showOwnerPassword ? "text" : "password"}
                    value={form.ownerPassword ?? ""}
                    onChange={(e) => updateField("ownerPassword", e.target.value)}
                    placeholder="Auto-generated if empty"
                    className={`w-full rounded-md border px-3 py-2.5 pr-12 text-sm outline-none transition focus:ring-2 ${
                      fieldErrors.ownerPassword
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOwnerPassword((value) => !value)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showOwnerPassword ? "Hide owner password" : "Show owner password"}
                    title={showOwnerPassword ? "Hide password" : "Show password"}
                  >
                    {showOwnerPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58" />
                        <path d="M9.88 5.09A10.4 10.4 0 0112 5c5 0 9 5 9 7a8.7 8.7 0 01-2.2 3.35" />
                        <path d="M6.61 6.61C4.42 8.06 3 10.22 3 12c0 2 4 7 9 7a9.77 9.77 0 004.39-1.06" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
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
                className={inputClass("address")}
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
                  className={inputClass("city")}
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
                  className={inputClass("state")}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Pincode
                </label>
                <input
                  type="text"
                  value={form.pincode ?? ""}
                  onChange={(e) => updateField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6 digits"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className={inputClass("pincode")}
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
                  onChange={(e) => updateField("gstNumber", e.target.value.toUpperCase())}
                  className={inputClass("gstNumber")}
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
                  className={inputClass("trialDays")}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Plan
                </label>
                <select
                  value={form.planCode ?? ""}
                  onChange={(e) => updateField("planCode", e.target.value)}
                  className={inputClass("planCode")}
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
                className={inputClass("logoUrl")}
              />
            </div>
          </fieldset>
        </div>

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
