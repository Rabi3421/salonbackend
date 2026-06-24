"use client";

import { useEffect, useReducer, useState } from "react";

import {
  getPlatformSettingsApi,
  updatePlatformSettingsApi,
  ensureDefaultPlatformSettingsApi,
} from "@/src/lib/superadmin-api";
import { PLAN_MODULES, MODULE_META } from "@/src/constants/modules";
import { LoadingState } from "@/src/components/superadmin/LoadingState";
import { ErrorState } from "@/src/components/superadmin/ErrorState";

type LS = { loading: boolean; error: string };
type LA = { type: "LOADED" } | { type: "ERR"; error: string };
function lr(_s: LS, a: LA): LS {
  if (a.type === "LOADED") return { loading: false, error: "" };
  return { loading: false, error: a.error };
}

export default function PlatformSettingsPage() {
  const [ls, ld] = useReducer(lr, { loading: true, error: "" });

  const [appName, setAppName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [defaultTrialDays, setDefaultTrialDays] = useState(14);
  const [invoicePrefix, setInvoicePrefix] = useState("SALON");

  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportWhatsApp, setSupportWhatsApp] = useState("");

  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [termsUrl, setTermsUrl] = useState("");
  const [privacyUrl, setPrivacyUrl] = useState("");

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [publicLeadEnabled, setPublicLeadEnabled] = useState(true);
  const [salonSignupEnabled, setSalonSignupEnabled] = useState(false);
  const [defaultModules, setDefaultModules] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetMsg, setResetMsg] = useState("");

  useEffect(() => {
    getPlatformSettingsApi()
      .then((r) => {
        const s = r.data?.settings;
        if (s) {
          setAppName((s.appName as string) ?? "");
          setCurrency((s.currency as string) ?? "INR");
          setDefaultTrialDays((s.defaultTrialDays as number) ?? 14);
          setInvoicePrefix((s.invoicePrefix as string) ?? "SALON");
          setSupportEmail((s.supportEmail as string) ?? "");
          setSupportPhone((s.supportPhone as string) ?? "");
          setSupportWhatsApp((s.supportWhatsApp as string) ?? "");
          setGstEnabled(Boolean(s.gstEnabled));
          setGstNumber((s.gstNumber as string) ?? "");
          setTermsUrl((s.termsUrl as string) ?? "");
          setPrivacyUrl((s.privacyUrl as string) ?? "");
          setMaintenanceMode(Boolean(s.maintenanceMode));
          setPublicLeadEnabled(s.publicLeadEnabled !== false);
          setSalonSignupEnabled(Boolean(s.salonSignupEnabled));
          setDefaultModules(Array.isArray(s.defaultModules) ? (s.defaultModules as string[]) : []);
          ld({ type: "LOADED" });
        }
      })
      .catch((e: Error) => ld({ type: "ERR", error: e.message }));
  }, []);

  function toggleModule(key: string) {
    setDefaultModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await updatePlatformSettingsApi({
        appName, currency, defaultTrialDays, invoicePrefix,
        supportEmail, supportPhone, supportWhatsApp,
        gstEnabled, gstNumber, termsUrl, privacyUrl,
        maintenanceMode, publicLeadEnabled, salonSignupEnabled, defaultModules,
      });
      setSuccess("Settings saved successfully.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    setResetMsg("");
    try {
      const res = await ensureDefaultPlatformSettingsApi();
      setResetMsg(res.message);
    } catch (err) {
      setResetMsg((err as Error).message);
    }
  }

  const { loading, error: loadError } = ls;
  if (loading) return <LoadingState message="Loading settings..." />;
  if (loadError) return <ErrorState message={loadError} />;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">Platform Settings</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Configuration</h1>
        </div>
        <button type="button" onClick={handleReset}
          className="shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">
          Ensure Defaults
        </button>
      </section>

      {resetMsg ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {resetMsg}
          <button type="button" onClick={() => setResetMsg("")} className="ml-3 underline">Dismiss</button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">General</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-slate-700">App Name</label>
              <input type="text" value={appName} onChange={(e) => setAppName(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Currency</label>
              <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Default Trial Days</label>
              <input type="number" value={defaultTrialDays} onChange={(e) => setDefaultTrialDays(Number(e.target.value))} min={0}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Invoice Prefix</label>
              <input type="text" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Support</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Support Email</label>
              <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Support Phone</label>
              <input type="tel" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">WhatsApp</label>
              <input type="tel" value={supportWhatsApp} onChange={(e) => setSupportWhatsApp(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Legal & GST</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="gstEnabled" checked={gstEnabled} onChange={(e) => setGstEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500" />
              <label htmlFor="gstEnabled" className="text-sm font-medium text-slate-700">GST Enabled</label>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">GST Number</label>
              <input type="text" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Terms URL</label>
              <input type="url" value={termsUrl} onChange={(e) => setTermsUrl(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Privacy URL</label>
              <input type="url" value={privacyUrl} onChange={(e) => setPrivacyUrl(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Platform Controls</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="maintenanceMode" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500" />
              <label htmlFor="maintenanceMode" className="text-sm font-medium text-slate-700">Maintenance Mode</label>
            </div>
            {maintenanceMode ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                Maintenance mode is ON. Public APIs may be restricted.
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              <input type="checkbox" id="publicLeadEnabled" checked={publicLeadEnabled} onChange={(e) => setPublicLeadEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500" />
              <label htmlFor="publicLeadEnabled" className="text-sm font-medium text-slate-700">Public Lead/Enquiry Form Enabled</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="salonSignupEnabled" checked={salonSignupEnabled} onChange={(e) => setSalonSignupEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500" />
              <label htmlFor="salonSignupEnabled" className="text-sm font-medium text-slate-700">Salon Self-Signup Enabled</label>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Default Modules</h2>
          <p className="mt-1 text-xs text-slate-500">Modules enabled by default for new salon plans.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PLAN_MODULES.map((key) => {
              const meta = MODULE_META[key];
              const checked = defaultModules.includes(key);
              return (
                <label key={key}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${checked ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleModule(key)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{meta.label}</p>
                    <p className="text-xs text-slate-500">{meta.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        {error ? (<div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>) : null}
        {success ? (<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>) : null}

        <div className="flex justify-end">
          <button type="submit" disabled={submitting}
            className="rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
