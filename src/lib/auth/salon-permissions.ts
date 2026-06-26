import type { SalonUserRole } from "@/src/constants/salon";

export const FRONTEND_SALON_ROLES = [
  "owner",
  "manager",
  "receptionist",
  "stylist",
  "accountant",
] as const;

export type FrontendSalonRole = (typeof FRONTEND_SALON_ROLES)[number];

const BACKEND_TO_FRONTEND_ROLE: Record<SalonUserRole, FrontendSalonRole> = {
  salon_owner: "owner",
  salon_admin: "manager",
  manager: "manager",
  receptionist: "receptionist",
  stylist: "stylist",
  cashier: "accountant",
  staff: "stylist",
  beautician: "stylist",
  accountant: "accountant",
  inventory_manager: "manager",
};

export function mapBackendSalonRoleToFrontend(
  role: SalonUserRole,
): FrontendSalonRole {
  return BACKEND_TO_FRONTEND_ROLE[role] ?? "stylist";
}

const FRONTEND_TO_BACKEND_ROLE: Record<FrontendSalonRole, SalonUserRole> = {
  owner: "salon_owner",
  manager: "manager",
  receptionist: "receptionist",
  stylist: "stylist",
  accountant: "cashier",
};

export function mapFrontendSalonRoleToBackend(
  role: FrontendSalonRole,
): SalonUserRole {
  return FRONTEND_TO_BACKEND_ROLE[role] ?? "stylist";
}

export function getSalonRoleLabel(role: FrontendSalonRole): string {
  const labels: Record<FrontendSalonRole, string> = {
    owner: "Owner",
    manager: "Manager",
    receptionist: "Receptionist",
    stylist: "Stylist",
    accountant: "Accountant",
  };
  return labels[role] ?? role;
}

export function hasSalonRole(
  userRole: FrontendSalonRole,
  allowedRoles: FrontendSalonRole[],
): boolean {
  return allowedRoles.includes(userRole);
}

export type SalonModule =
  | "auth"
  | "overview"
  | "services"
  | "packages"
  | "customers"
  | "appointments"
  | "staff"
  | "billing"
  | "payments"
  | "enquiries"
  | "reports"
  | "settings"
  | "users"
  | "inventory";

const MODULE_ACCESS: Record<SalonModule, FrontendSalonRole[]> = {
  auth: ["owner", "manager", "receptionist", "stylist", "accountant"],
  overview: ["owner", "manager", "receptionist", "stylist", "accountant"],
  services: ["owner", "manager", "receptionist", "stylist"],
  packages: ["owner", "manager", "receptionist"],
  customers: ["owner", "manager", "receptionist", "stylist", "accountant"],
  appointments: ["owner", "manager", "receptionist", "stylist"],
  staff: ["owner", "manager"],
  billing: ["owner", "manager", "receptionist", "accountant"],
  payments: ["owner", "manager", "receptionist", "accountant"],
  enquiries: ["owner", "manager", "receptionist"],
  reports: ["owner", "manager", "accountant"],
  settings: ["owner", "manager", "receptionist", "accountant"],
  users: ["owner", "manager"],
  inventory: ["owner", "manager", "accountant"],
};

export function canAccessSalonModule(
  role: FrontendSalonRole,
  module: SalonModule,
): boolean {
  return MODULE_ACCESS[module]?.includes(role) ?? false;
}

export function sanitizeSalonUser(user: Record<string, unknown>) {
  const {
    passwordHash: _ph,
    refreshTokenId: _rt,
    __v: _v,
    ...safe
  } = user;

  return {
    ...safe,
    id: safe._id ? String(safe._id) : safe.id,
    _id: undefined,
  };
}
