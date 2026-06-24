"use client";

export function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  const dot = color ?? "text-slate-900";

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${dot === "text-emerald-600" ? "bg-emerald-500" : dot === "text-red-600" ? "bg-red-500" : dot === "text-amber-600" ? "bg-amber-500" : dot === "text-indigo-600" ? "bg-indigo-500" : "bg-slate-300"}`} />
        <p className="text-xs font-medium text-slate-400">{label}</p>
      </div>
      <p className={`mt-2 text-2xl font-bold ${dot}`}>
        {value}
      </p>
    </article>
  );
}
