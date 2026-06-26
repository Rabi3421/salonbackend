import { formatNullableDate } from "@/src/lib/formatters";
import type { SalonCurrentSubscription } from "@/src/types/salon-frontend";

const bannerStyles: Record<string, string> = {
  trial: "border-blue-200 bg-blue-50 text-blue-800",
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  unpaid: "border-amber-200 bg-amber-50 text-amber-800",
  blocked: "border-red-200 bg-red-50 text-red-800",
  cancelled: "border-slate-200 bg-slate-100 text-slate-700",
};

export function SubscriptionStatusBanner({
  subscription,
}: {
  subscription: SalonCurrentSubscription;
}) {
  const status = subscription.subscriptionStatus;

  const messageByStatus: Record<string, string> = {
    trial: `Your free trial is active until ${formatNullableDate(subscription.trialEndDate)}.`,
    active: "Your subscription is active.",
    unpaid: "Payment is due. Please pay before 10th to avoid access block.",
    blocked: "Your salon access is blocked due to pending payment. Please contact support.",
    cancelled: "Your subscription is cancelled. Please contact support.",
  };

  return (
    <div className={`rounded-2xl border px-5 py-4 text-sm font-medium ${bannerStyles[status] ?? bannerStyles.cancelled}`}>
      {messageByStatus[status] ?? `Subscription status: ${status}.`}
    </div>
  );
}
