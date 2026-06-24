"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { LogoutButton } from "@/src/components/superadmin/LogoutButton";

const navigationItems = [
  { label: "Dashboard", href: "/superadmin/dashboard", icon: "grid" },
  { label: "Salons", href: "/superadmin/dashboard/salons", icon: "store" },
  { label: "Plans", href: "/superadmin/dashboard/plans", icon: "layers" },
  { label: "Subscriptions", href: "/superadmin/dashboard/subscriptions", icon: "repeat" },
  { label: "Payments", href: "/superadmin/dashboard/payments", icon: "wallet" },
  { label: "Enquiries", href: "/superadmin/dashboard/enquiries", icon: "mail" },
  { label: "Reports", href: "/superadmin/dashboard/reports", icon: "chart" },
  { label: "Audit Logs", href: "/superadmin/dashboard/audit-logs", icon: "shield" },
  { label: "Settings", href: "/superadmin/dashboard/settings", icon: "settings" },
];

const ICONS: Record<string, ReactNode> = {
  grid: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  store: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  layers: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>,
  repeat: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>,
  wallet: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>,
  mail: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  chart: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  shield: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  settings: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>,
};

export default function SuperadminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/superadmin/dashboard") return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-100/60 text-slate-900">
      <div className="flex h-screen">
        <aside className="hidden w-60 flex-shrink-0 flex-col overflow-y-auto bg-white lg:flex">
          <div className="px-5 py-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-200">
                R
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Rabivio</p>
                <p className="text-[11px] text-slate-400">Superadmin</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-2">
            {navigationItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                    active
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <span className={active ? "text-white" : "text-slate-400"}>
                    {ICONS[item.icon]}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 px-3 py-4">
            <LogoutButton />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex-shrink-0 bg-white px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 lg:hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                  R
                </div>
                <span className="text-sm font-bold text-slate-900">Rabivio</span>
              </div>

              <div className="hidden flex-1 lg:block">
                <div className="relative max-w-md">
                  <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 lg:flex">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                    SA
                  </div>
                </div>
                <div className="lg:hidden">
                  <LogoutButton />
                </div>
              </div>
            </div>

            <nav className="mt-3 flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
              {navigationItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "bg-indigo-600 text-white"
                        : "border border-slate-200 text-slate-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
