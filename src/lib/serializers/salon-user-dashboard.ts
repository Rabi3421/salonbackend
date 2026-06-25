import {
  mapBackendSalonRoleToFrontend,
  type FrontendSalonRole,
} from "@/src/lib/auth/salon-permissions";
import type { SalonUserRole } from "@/src/constants/salon";

function baseShape(doc: Record<string, unknown>): Record<string, unknown> {
  const { _id, __v, passwordHash: _ph, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export function serializeSalonDashboardUser(
  doc: Record<string, unknown>,
): Record<string, unknown> {
  const shaped = baseShape(doc);
  const backendRole = shaped.role as SalonUserRole;
  const frontendRole: FrontendSalonRole =
    mapBackendSalonRoleToFrontend(backendRole);
  shaped.backendRole = backendRole;
  shaped.role = frontendRole;
  return shaped;
}

export function serializeSalonDashboardUserList(
  docs: Record<string, unknown>[],
): Record<string, unknown>[] {
  return docs.map(serializeSalonDashboardUser);
}
