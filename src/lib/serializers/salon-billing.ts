function baseShape(doc: Record<string, unknown>): Record<string, unknown> {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export function serializeBill(doc: Record<string, unknown>): Record<string, unknown> {
  return baseShape(doc);
}

export function serializeBillList(docs: Record<string, unknown>[]): Record<string, unknown>[] {
  return docs.map(serializeBill);
}

export function serializePayment(doc: Record<string, unknown>): Record<string, unknown> {
  return baseShape(doc);
}

export function serializePaymentList(docs: Record<string, unknown>[]): Record<string, unknown>[] {
  return docs.map(serializePayment);
}
