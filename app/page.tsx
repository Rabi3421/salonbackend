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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden w-1/2 bg-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
              R
            </div>
            <span className="text-xl font-semibold text-white">Rabivio</span>
          </div>
          <h1 className="mt-16 max-w-md text-4xl font-bold leading-tight text-white">
            Platform controls for every salon tenant.
          </h1>
          <p className="mt-4 max-w-sm text-base leading-7 text-slate-400">
            Manage salons, plans, subscriptions, billing, enquiries, and
            platform settings from one console.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-slate-500">
          <span>Tenants</span>
          <span>&middot;</span>
          <span>Billing</span>
          <span>&middot;</span>
          <span>Analytics</span>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
                R
              </div>
              <span className="text-lg font-semibold text-slate-900">Rabivio</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">
              Superadmin platform access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Enter password"
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
