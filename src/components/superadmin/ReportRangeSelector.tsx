"use client";

import { REPORT_RANGES, REPORT_RANGE_LABELS } from "@/src/constants/reports";

export function ReportRangeSelector({
  range,
  dateFrom,
  dateTo,
  onRangeChange,
  onDateFromChange,
  onDateToChange,
  onApply,
}: {
  range: string;
  dateFrom: string;
  dateTo: string;
  onRangeChange: (range: string) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onApply: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div>
        <label className="text-xs font-medium text-slate-400">Range</label>
        <select
          value={range}
          onChange={(e) => onRangeChange(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:w-44"
        >
          {REPORT_RANGES.map((r) => (
            <option key={r} value={r}>
              {REPORT_RANGE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>
      {range === "custom" ? (
        <>
          <div>
            <label className="text-xs font-medium text-slate-400">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </>
      ) : null}
      <button
        type="button"
        onClick={onApply}
        className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        Apply
      </button>
    </div>
  );
}
