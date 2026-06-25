import type { FrontendSalonRole } from "@/src/lib/auth/salon-permissions";

const FINANCIAL_FIELDS = ["totalSpent", "dueAmount"];
const BEAUTY_PRIVATE_FIELDS = ["notes", "allergies", "hairSkinNotes", "favoriteServices", "preferredStylistId", "preferredStylistName"];

function baseShape(doc: Record<string, unknown>): Record<string, unknown> {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export function serializeCustomer(
  doc: Record<string, unknown>,
  role: FrontendSalonRole,
): Record<string, unknown> {
  const shaped = baseShape(doc);

  if (role === "stylist") {
    for (const key of FINANCIAL_FIELDS) {
      delete shaped[key];
    }
  }

  if (role === "accountant") {
    for (const key of BEAUTY_PRIVATE_FIELDS) {
      delete shaped[key];
    }
  }

  return shaped;
}

export function serializeCustomerList(
  docs: Record<string, unknown>[],
  role: FrontendSalonRole,
): Record<string, unknown>[] {
  return docs.map((doc) => serializeCustomer(doc, role));
}
