"use client";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  const btnColor =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-indigo-600 hover:bg-indigo-700 text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/50"
        onClick={loading ? undefined : onCancel}
      />
      <div className="relative mx-4 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        ) : null}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${btnColor}`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
