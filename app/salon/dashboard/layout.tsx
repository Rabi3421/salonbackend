"use client";

import { useEffect, useState } from "react";

import { SalonSidebar } from "@/src/components/salon/SalonSidebar";
import {
  fetchSalonDashboardMeta,
  type SalonApiError,
} from "@/src/lib/salon-api";
import type { SalonDashboardMeta } from "@/src/types/salon-frontend";

export default function SalonDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [meta, setMeta] = useState<SalonDashboardMeta | null>(null);

  useEffect(() => {
    fetchSalonDashboardMeta()
      .then((response) => setMeta(response.data ?? null))
      .catch((error: SalonApiError) => {
        if (error.status !== 403) setMeta(null);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <SalonSidebar meta={meta} />
        <main className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white px-5 py-4 lg:px-8">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-400">Welcome back</p>
                <p className="font-semibold text-slate-900">{meta?.user.name ?? "Salon team"}</p>
              </div>
              {meta?.user.role ? (
                <span className="w-fit rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-medium capitalize text-pink-600">
                  {meta.user.role}
                </span>
              ) : null}
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
