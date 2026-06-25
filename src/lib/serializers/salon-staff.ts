import type { FrontendSalonRole } from "@/src/lib/auth/salon-permissions";

const OWNER_ONLY_FIELDS = [
  "salary",
  "commissionPercent",
  "emergencyContactName",
  "emergencyContactPhone",
  "revenueThisMonth",
];

function baseShape(doc: Record<string, unknown>): Record<string, unknown> {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export function serializeStaff(
  doc: Record<string, unknown>,
  role: FrontendSalonRole,
): Record<string, unknown> {
  const shaped = baseShape(doc);

  if (role !== "owner") {
    for (const key of OWNER_ONLY_FIELDS) {
      delete shaped[key];
    }
  }

  return shaped;
}

export function serializeStaffList(
  docs: Record<string, unknown>[],
  role: FrontendSalonRole,
): Record<string, unknown>[] {
  return docs.map((doc) => serializeStaff(doc, role));
}
