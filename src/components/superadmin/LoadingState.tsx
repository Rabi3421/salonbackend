"use client";

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      <p className="mt-4 text-sm text-slate-500">{message}</p>
    </div>
  );
}
