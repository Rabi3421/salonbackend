export const REPORT_RANGES = [
  "today",
  "yesterday",
  "last_7_days",
  "last_30_days",
  "this_month",
  "last_month",
  "this_year",
  "custom",
] as const;

export type ReportRange = (typeof REPORT_RANGES)[number];

export const REPORT_RANGE_LABELS: Record<ReportRange, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last_7_days: "Last 7 Days",
  last_30_days: "Last 30 Days",
  this_month: "This Month",
  last_month: "Last Month",
  this_year: "This Year",
  custom: "Custom Range",
};

export function getReportRangeLabel(range: string): string {
  return REPORT_RANGE_LABELS[range as ReportRange] ?? range;
}
