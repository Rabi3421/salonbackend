"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { SalonDashboardMeta } from "@/src/types/salon-frontend";

const navItems = [
  { label: "Overview", href: "/salon/dashboard", roles: ["owner", "manager", "receptionist", "stylist", "accountant"] },
  { label: "Appointments", href: "/salon/dashboard/appointments", roles: ["owner", "manager", "receptionist", "stylist"] },
  { label: "Customers", href: "/salon/dashboard/customers", roles: ["owner", "manager", "receptionist", "stylist", "accountant"] },
  { label: "Payments", href: "/salon/dashboard/payments", roles: ["owner", "manager"] },
] as const;

export function SalonSidebar({ meta }: { meta: SalonDashboardMeta | null }) {
  const pathname = usePathname();
  const role = meta?.user.role;

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="border-b border-slate-100 p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-pink-500 text-sm font-semibold text-white">
            {(meta?.salon.name ?? "S").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{meta?.salon.name ?? "Salon"}</p>
            <p className="text-sm text-slate-500">Dashboard</p>
          </div>
        </div>
      </div>
      <nav className="space-y-1 p-4">
        {navItems
          .filter((item) => !role || (item.roles as readonly string[]).includes(role))
          .map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-pink-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}
