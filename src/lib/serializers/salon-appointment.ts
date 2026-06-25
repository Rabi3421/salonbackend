import type { FrontendSalonRole } from "@/src/lib/auth/salon-permissions";

const STYLIST_HIDDEN_FIELDS = ["paidAmount", "billId", "internalNotes"];

function baseShape(doc: Record<string, unknown>): Record<string, unknown> {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export function serializeAppointment(
  doc: Record<string, unknown>,
  role: FrontendSalonRole,
): Record<string, unknown> {
  const shaped = baseShape(doc);

  if (role === "stylist") {
    for (const key of STYLIST_HIDDEN_FIELDS) {
      delete shaped[key];
    }
  }

  return shaped;
}

export function serializeAppointmentList(
  docs: Record<string, unknown>[],
  role: FrontendSalonRole,
): Record<string, unknown>[] {
  return docs.map((doc) => serializeAppointment(doc, role));
}
