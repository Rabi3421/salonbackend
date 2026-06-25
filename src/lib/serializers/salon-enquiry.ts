function toIso(value: unknown): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function normalizeStatus(status: unknown): string {
  const value = String(status ?? "new");
  if (value === "in_progress") return "contacted";
  if (value === "resolved" || value === "spam") return "closed";
  return value;
}

function normalizePriority(priority: unknown): string {
  const value = String(priority ?? "normal");
  if (value === "medium") return "normal";
  return value;
}

function normalizeSource(source: unknown): string {
  const value = String(source ?? "website");
  if (value === "salon_website" || value === "unknown") return "website";
  return value;
}

function normalizeType(type: unknown): string {
  const value = String(type ?? "contact");
  if (value === "demo_request" || value === "platform_lead") return "contact";
  return value;
}

function normalizeFollowUpNotes(doc: Record<string, unknown>): Record<string, unknown>[] {
  const internalNotes = Array.isArray(doc.internalNotes) ? doc.internalNotes : [];

  return internalNotes.map((note, index) => {
    const item = note as Record<string, unknown>;
    const createdAt = toIso(item.addedAt) ?? toIso(doc.updatedAt) ?? new Date().toISOString();

    return {
      id: `${String(doc._id ?? doc.enquiryId ?? "note")}-${index}`,
      note: String(item.note ?? ""),
      createdBy: String(item.addedBy ?? item.addedByEmail ?? "Team"),
      createdAt,
    };
  });
}

function baseShape(doc: Record<string, unknown>): Record<string, unknown> {
  const { _id, __v, ...rest } = doc;
  return {
    id: String(_id),
    ...rest,
    enquiryNo: String(doc.enquiryId ?? ""),
    type: normalizeType(doc.type),
    status: normalizeStatus(doc.status),
    priority: normalizePriority(doc.priority),
    source: normalizeSource(doc.source),
    followUpNotes: normalizeFollowUpNotes(doc),
    preferredDate: toIso(doc.preferredDate),
    nextFollowUpAt: toIso(doc.nextFollowUpAt),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function serializeSalonEnquiry(
  doc: Record<string, unknown>,
): Record<string, unknown> {
  return baseShape(doc);
}

export function serializeSalonEnquiryList(
  docs: Record<string, unknown>[],
): Record<string, unknown>[] {
  return docs.map(serializeSalonEnquiry);
}
