"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/superadmin/auth/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`flex w-full items-center rounded-xl py-2.5 text-[13px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60 ${
        compact ? "justify-center px-0" : "gap-3 px-3"
      }`}
      title={compact ? (isLoggingOut ? "Signing out" : "Logout") : undefined}
    >
      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      {compact ? null : isLoggingOut ? "Signing out..." : "Logout"}
    </button>
  );
}
