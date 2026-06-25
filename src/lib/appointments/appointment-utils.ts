import type { FrontendSalonRole } from "@/src/lib/auth/salon-permissions";

type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "checked_in"
  | "in_service"
  | "completed"
  | "cancelled"
  | "no_show";

type ServiceSnapshot = { price?: number; duration?: number };

const FULL_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["in_service", "cancelled"],
  in_service: ["completed"],
  completed: [],
  cancelled: [],
  no_show: [],
};

const STYLIST_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  requested: [],
  confirmed: ["in_service"],
  checked_in: ["in_service"],
  in_service: ["completed"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function getAllowedNextStatuses(
  currentStatus: AppointmentStatus,
  role: FrontendSalonRole,
): AppointmentStatus[] {
  if (role === "accountant") return [];

  if (role === "stylist") {
    return STYLIST_TRANSITIONS[currentStatus] ?? [];
  }

  return FULL_TRANSITIONS[currentStatus] ?? [];
}

export function canTransitionStatus(
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus,
  role: FrontendSalonRole,
): boolean {
  return getAllowedNextStatuses(currentStatus, role).includes(nextStatus);
}

export function calculateTotal(services: ServiceSnapshot[]): number {
  return services.reduce((sum, s) => sum + (s.price ?? 0), 0);
}

export function calculateEndTime(
  startTime: string,
  services: ServiceSnapshot[],
): string {
  const totalMinutes = services.reduce(
    (sum, s) => sum + (s.duration ?? 0),
    0,
  );

  const [hours, minutes] = startTime.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return startTime;

  const totalMins = hours * 60 + minutes + totalMinutes;
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;

  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

export function isStylistAssigned(
  userId: string,
  userName: string,
  appointment: Record<string, unknown>,
): boolean {
  const stylist = appointment.stylist as
    | { id?: string; name?: string }
    | undefined;
  if (!stylist) return false;
  if (stylist.id && stylist.id === userId) return true;
  if (stylist.name && stylist.name === userName) return true;
  return false;
}
