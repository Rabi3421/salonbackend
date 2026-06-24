import type { ReportRange } from "@/src/constants/reports";

export type DateRangeResult = {
  startDate: Date;
  endDate: Date;
  label: string;
};

export function getDateRange(opts: {
  range: string;
  dateFrom?: string;
  dateTo?: string;
}): DateRangeResult {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000 - 1);

  const range = opts.range as ReportRange;

  switch (range) {
    case "today":
      return { startDate: todayStart, endDate: todayEnd, label: "Today" };

    case "yesterday": {
      const s = new Date(todayStart.getTime() - 86400000);
      return { startDate: s, endDate: new Date(todayStart.getTime() - 1), label: "Yesterday" };
    }

    case "last_7_days": {
      const s = new Date(todayStart.getTime() - 7 * 86400000);
      return { startDate: s, endDate: todayEnd, label: "Last 7 Days" };
    }

    case "last_30_days": {
      const s = new Date(todayStart.getTime() - 30 * 86400000);
      return { startDate: s, endDate: todayEnd, label: "Last 30 Days" };
    }

    case "this_month": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: s, endDate: todayEnd, label: "This Month" };
    }

    case "last_month": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { startDate: s, endDate: e, label: "Last Month" };
    }

    case "this_year": {
      const s = new Date(now.getFullYear(), 0, 1);
      return { startDate: s, endDate: todayEnd, label: "This Year" };
    }

    case "custom": {
      const s = opts.dateFrom ? new Date(opts.dateFrom) : todayStart;
      const e = opts.dateTo ? new Date(opts.dateTo + "T23:59:59.999Z") : todayEnd;
      return { startDate: s, endDate: e, label: "Custom Range" };
    }

    default:
      return { startDate: todayStart, endDate: todayEnd, label: "Today" };
  }
}
