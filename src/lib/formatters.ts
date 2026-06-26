import type { SubscriptionAccessStatus } from "@/src/types/superadmin-frontend";

export function formatAccessStatus(status?: SubscriptionAccessStatus | string | null) {
  if (!status) return "N/A";
  const labels: Record<string, string> = {
    trial: "Trial",
    active: "Active",
    payment_due: "Payment Due",
    grace_period: "Grace Period",
    access_blocked: "Access Blocked",
    expired: "Expired",
    suspended: "Suspended",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status.replace(/_/g, " ");
}

export function formatPlanCode(planCode?: string | null) {
  if (!planCode) return "N/A";
  const normalized = planCode.toLowerCase();
  if (normalized === "basic") return "Basic";
  if (normalized === "premium") return "Premium";
  return planCode;
}

export function formatPaymentStatus(status?: string | null) {
  if (!status) return "N/A";
  const labels: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status.replace(/_/g, " ");
}

export function formatPaymentMode(mode?: string | null) {
  if (!mode) return "N/A";
  const labels: Record<string, string> = {
    cash: "Cash",
    upi: "UPI",
    bank_transfer: "Bank Transfer",
    card: "Card",
    cheque: "Cheque",
    gateway: "Gateway",
    other: "Other",
  };
  return labels[mode] ?? mode.replace(/_/g, " ");
}

export function formatCurrencyINR(amount?: number | null) {
  if (amount === undefined || amount === null || Number.isNaN(amount)) return "N/A";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNullableDate(dateStr?: string | null) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDaysLeft(dateStr?: string | Date | null) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const days = Math.ceil((date.getTime() - start.getTime()) / 86_400_000);
  if (days > 1) return `${days} days left`;
  if (days === 1) return "1 day left";
  if (days === 0) return "Due today";
  if (days === -1) return "1 day overdue";
  return `${Math.abs(days)} days overdue`;
}
