"use client";

const ACCOUNT_COLORS: Record<string, string> = {
  trial: "bg-indigo-50 text-indigo-700 border-indigo-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  unpaid: "bg-amber-50 text-amber-700 border-amber-200",
  blocked: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-slate-100 text-slate-400 border-slate-200",
  expired: "bg-slate-100 text-slate-600 border-slate-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
};

const WEBSITE_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-400 border-slate-200",
  maintenance: "bg-slate-100 text-slate-600 border-slate-200",
};

export function StatusBadge({
  value,
  type = "account",
}: {
  value: string;
  type?: "account" | "website";
}) {
  const colorMap = type === "website" ? WEBSITE_COLORS : ACCOUNT_COLORS;
  const colors = colorMap[value] ?? "bg-slate-100 text-slate-500 border-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${colors}`}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}
