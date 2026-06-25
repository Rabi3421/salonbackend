type DateRange = {
  startDate: Date;
  endDate: Date;
  previousStartDate: Date;
  previousEndDate: Date;
  label: string;
};

export function parseReportDateRange(url: URL): DateRange {
  const range = url.searchParams.get("range")?.trim() ?? "30d";
  const customFrom = url.searchParams.get("dateFrom")?.trim() ?? "";
  const customTo = url.searchParams.get("dateTo")?.trim() ?? "";

  const now = new Date();
  let startDate: Date;
  let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let label = "Last 30 days";

  if (range === "custom" && customFrom && customTo) {
    startDate = new Date(customFrom);
    endDate = new Date(customTo);
    endDate.setHours(23, 59, 59, 999);
    label = `${customFrom} to ${customTo}`;
  } else if (range === "today") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    label = "Today";
  } else if (range === "7d") {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    label = "Last 7 days";
  } else if (range === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    label = "This month";
  } else {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);
    label = "Last 30 days";
  }

  const durationMs = endDate.getTime() - startDate.getTime();
  const previousEndDate = new Date(startDate.getTime() - 1);
  previousEndDate.setHours(23, 59, 59, 999);
  const previousStartDate = new Date(previousEndDate.getTime() - durationMs);
  previousStartDate.setHours(0, 0, 0, 0);

  return { startDate, endDate, previousStartDate, previousEndDate, label };
}

export function getDateBuckets(
  startDate: Date,
  endDate: Date,
): { date: string; start: Date; end: Date }[] {
  const buckets: { date: string; start: Date; end: Date }[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const dayStart = new Date(current);
    const dayEnd = new Date(current);
    dayEnd.setHours(23, 59, 59, 999);
    buckets.push({
      date: current.toISOString().split("T")[0],
      start: dayStart,
      end: dayEnd,
    });
    current.setDate(current.getDate() + 1);
  }

  return buckets;
}
