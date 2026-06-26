import {
  formatAccessStatus,
  formatDaysLeft,
  formatNullableDate,
} from "@/src/lib/formatters";
import type { SalonCurrentSubscription } from "@/src/types/salon-frontend";

const bannerStyles: Record<string, string> = {
  trial: "border-blue-200 bg-blue-50 text-blue-800",
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  payment_due: "border-yellow-200 bg-yellow-50 text-yellow-800",
  grace_period: "border-orange-200 bg-orange-50 text-orange-800",
  access_blocked: "border-red-200 bg-red-50 text-red-800",
  suspended: "border-red-200 bg-red-50 text-red-800",
  cancelled: "border-slate-200 bg-slate-100 text-slate-700",
  expired: "border-slate-200 bg-slate-100 text-slate-700",
};

export function SubscriptionStatusBanner({
  subscription,
}: {
  subscription: SalonCurrentSubscription;
}) {
  const status = subscription.accessStatus;
  const daysLeft = formatDaysLeft(
    status === "trial" ? subscription.trialEndDate : subscription.nextGraceEndDate,
  );

  const messageByStatus: Record<string, string> = {
    trial: `You are currently on free trial. Trial ends ${formatNullableDate(subscription.trialEndDate)}${daysLeft ? ` (${daysLeft})` : ""}.`,
    active: "Your subscription is active.",
    payment_due: "Payment is due on the 5th. Please complete payment to avoid interruption.",
    grace_period: "You are in grace period. Please pay before 10th to avoid access block.",
    access_blocked: "Your salon access is blocked due to pending subscription payment. Please contact support after payment.",
    suspended: "Your salon account is suspended. Please contact support.",
    cancelled: "Your salon subscription has been cancelled.",
    expired: "Your salon subscription has expired.",
  };

  return (
    <div className={`rounded-2xl border px-5 py-4 text-sm font-medium ${bannerStyles[status] ?? bannerStyles.expired}`}>
      {messageByStatus[status] ?? `Subscription status: ${formatAccessStatus(status)}.`}
    </div>
  );
}
