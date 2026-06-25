export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function groupByField<T extends Record<string, unknown>>(
  items: T[],
  field: string,
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const key = String(item[field] ?? "unknown");
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

export function countByField<T extends Record<string, unknown>>(
  items: T[],
  field: string,
): { value: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = String(item[field] ?? "unknown");
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

function shapeDoc(doc: Record<string, unknown>): Record<string, unknown> {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export function shapeList(docs: Record<string, unknown>[]): Record<string, unknown>[] {
  return docs.map(shapeDoc);
}
