"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  success: boolean;
  message?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/superadmin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as LoginResponse;

      if (!response.ok || !result.success) {
        setError(result.message ?? "Unable to login.");
        return;
      }

      const nextPath = new URLSearchParams(window.location.search).get("next");
      router.replace(nextPath ?? "/superadmin/dashboard");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const platformStats = [
    { label: "Active salons", value: "124", accent: "bg-emerald-400" },
    { label: "MRR tracked", value: "98%", accent: "bg-violet-400" },
    { label: "Open enquiries", value: "32", accent: "bg-cyan-400" },
  ];

  const activityItems = [
    { title: "Trial converted", meta: "Velvet Studio", amount: "+₹4,999" },
    { title: "Subscription due", meta: "Glow Room", amount: "Today" },
    { title: "New salon onboarded", meta: "Aura Salon", amount: "Live" },
  ];

  return (
    <main className="h-screen overflow-hidden bg-[#f4f7fb] text-slate-950">
      <div className="relative grid h-full lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative hidden h-screen overflow-hidden bg-[#0b1020] px-10 py-7 text-white lg:flex lg:flex-col lg:justify-between xl:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(79,70,229,0.42),transparent_31%),radial-gradient(circle_at_78%_28%,rgba(14,165,233,0.28),transparent_30%),linear-gradient(145deg,#0b1020_0%,#111827_52%,#111126_100%)]" />
          <div className="absolute -right-28 top-16 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute bottom-24 left-12 h-56 w-56 rounded-full border border-white/10" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/35 to-transparent" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-black text-indigo-700 shadow-2xl shadow-indigo-950/40">
                R
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">RNPTECHSOLUTIONS</p>
                <p className="text-xs font-medium uppercase tracking-[0.26em] text-white/45">
                  SALON MANAGEMENT
                </p>
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-indigo-100 backdrop-blur">
              Superadmin
            </div>
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
              Live tenant operations
            </div>
            <h1 className="max-w-xl text-5xl font-black leading-[1.04] tracking-tight xl:text-[3.35rem]">
              Command center for every salon tenant.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">
              Review subscriptions, salons, enquiries, billing, and platform settings from one
              focused superadmin workspace.
            </p>

            <div className="mt-6 grid max-w-xl grid-cols-3 gap-3">
              {platformStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.08] p-3.5 shadow-2xl shadow-black/10 backdrop-blur"
                >
                  <span className={`mb-2.5 block h-1.5 w-8 rounded-full ${stat.accent}`} />
                  <p className="text-xl font-black tracking-tight">{stat.value}</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 max-w-xl rounded-[1.5rem] border border-white/10 bg-white/[0.09] p-3.5 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <p className="text-sm font-bold">Platform pulse</p>
                  <p className="mt-1 text-xs text-slate-400">Recent subscription activity</p>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Healthy
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                {activityItems.map((item) => (
                  <div
                    key={`${item.title}-${item.meta}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl bg-white/[0.08] px-4 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.meta}</p>
                    </div>
                    <span className="text-sm font-bold text-indigo-100">{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-sm font-medium text-slate-400">
            <span>Tenants</span>
            <span>Billing</span>
            <span>Subscriptions</span>
            <span>Analytics</span>
          </div>
        </section>

        <section className="relative flex h-screen items-center justify-center overflow-hidden px-5 py-6 sm:px-8 lg:px-12">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(79,70,229,0.08),transparent_38%),radial-gradient(circle_at_82%_14%,rgba(14,165,233,0.14),transparent_26%)]" />
          <div className="relative w-full max-w-[440px]">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-base font-black text-white shadow-lg shadow-indigo-600/25">
                  R
                </div>
                <div>
                  <p className="text-lg font-bold tracking-tight text-slate-950">
                    RNPTECHSOLUTIONS
                  </p>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    SALON MANAGEMENT
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                Superadmin
              </span>
            </div>

            <div className="rounded-[2rem] border border-white bg-white/90 p-6 shadow-[0_26px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
              <div className="mb-8">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-xl shadow-slate-950/20">
                  <span className="text-xl font-black">R</span>
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
                  Secure superadmin access
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sign in to manage tenant operations and platform billing.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700">
                    Email address
                  </label>
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      @
                    </span>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      required
                      className="block h-13 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 pl-11 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-slate-700">
                    Password
                  </label>
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-slate-400">
                      *
                    </span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                      className="block h-13 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 pl-11 pr-20 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-2 top-1/2 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-white hover:text-indigo-600"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-13 w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-xl shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-indigo-600/25 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing in
                    </span>
                  ) : (
                    "Sign in to console"
                  )}
                </button>
              </form>

              <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-2">
                {["Encrypted", "Tenant safe", "Audit ready"].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl bg-white px-2 py-2 text-center text-[11px] font-bold text-slate-500 shadow-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-6 text-center text-xs font-medium leading-5 text-slate-500">
              Protected access for platform administrators only.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
