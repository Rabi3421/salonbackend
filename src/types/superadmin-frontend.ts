export type SubscriptionAccessStatus =
  | "trial"
  | "active"
  | "payment_due"
  | "grace_period"
  | "access_blocked"
  | "expired"
  | "suspended"
  | "cancelled";

export type SalonSubscriptionPolicyPayload = {
  planCode: "basic" | "premium";
  finalMonthlyPrice: number;
  negotiationNote?: string;
  nextDueDate?: string;
  nextGraceEndDate?: string;
  accessStatus: SubscriptionAccessStatus;
};

export type SalonSubscriptionPolicySummary = {
  subscriptionId: string;
  salonId: string;
  planCode: string;
  planName?: string;
  status: SubscriptionAccessStatus | string;
  accessStatus?: SubscriptionAccessStatus;
  paymentStatus?: string;
  standardMonthlyPrice?: number;
  minimumMonthlyPrice?: number;
  finalMonthlyPrice?: number;
  negotiatedMonthlyPrice?: number;
  negotiationNote?: string;
  priceLockedBySuperadmin?: boolean;
  trialStartDate?: string;
  trialEndDate?: string;
  currentDueDate?: string;
  currentGraceEndDate?: string;
  nextDueDate?: string;
  nextGraceEndDate?: string;
  nextBillingDate?: string;
  lastPaidAt?: string;
  lastPaymentId?: string;
};

export type SalonSubscriptionPolicyUpdateResponse = {
  subscription: SalonSubscriptionPolicySummary;
};

export type SubscriptionBlockPayload = {
  reason: string;
};

export type SubscriptionReactivatePayload = {
  reason: string;
};

export type SubscriptionEvaluateAccessResponse = {
  checked: number;
  active: number;
  trial: number;
  paymentDue: number;
  gracePeriod: number;
  blocked: number;
};
