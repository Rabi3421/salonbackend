"use client";

export function EmptyState({
  title = "No data found",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white py-16">
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      ) : null}
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
