"use client";

export function SimpleBar({
  items,
  maxValue,
}: {
  items: { label: string; value: number; color?: string }[];
  maxValue?: number;
}) {
  const max = maxValue ?? Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-xs font-medium text-slate-500 capitalize">
            {item.label.replace(/_/g, " ")}
          </span>
          <div className="flex-1">
            <div className="h-4 w-full rounded-full bg-slate-100">
              <div
                className={`h-4 rounded-full ${item.color ?? "bg-indigo-500"}`}
                style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }}
              />
            </div>
          </div>
          <span className="w-12 text-right text-xs font-semibold text-slate-600">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
