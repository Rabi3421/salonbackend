function baseShape(doc: Record<string, unknown>): Record<string, unknown> {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export function serializeSalonSettings(
  doc: Record<string, unknown>,
): Record<string, unknown> {
  return baseShape(doc);
}
