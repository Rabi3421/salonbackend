export type SubscriptionAccessStatus =
  | "trial"
  | "active"
  | "unpaid"
  | "blocked"
  | "cancelled";

export type SalonSubscriptionPolicyPayload = {
  planCode: "basic" | "premium";
  monthlyPrice: number;
  negotiationNote?: string;
  subscriptionStatus?: SubscriptionAccessStatus;
  nextDueDate?: string;
  graceEndDate?: string;
};

export type SalonSubscriptionPolicySummary = {
  salonId: string;
  salonName?: string;
  planCode: string;
  planName: string;
  monthlyPrice: number;
  standardPrice: number;
  minimumPrice: number;
  subscriptionStatus: SubscriptionAccessStatus | string;
  trialStartDate?: string | null;
  trialEndDate?: string | null;
  nextDueDate?: string | null;
  graceEndDate?: string | null;
  lastPaymentDate?: string | null;
  negotiationNote?: string;
  isActive: boolean;
  blockedAt?: string | null;
  blockedReason?: string;
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

export type SimplePaymentRecord = {
  paymentId: string;
  salonId: string;
  amount: number;
  paymentMode: string;
  paymentStatus: string;
  paymentDate: string | null;
  transactionId: string;
  receiptNumber: string;
  notes: string;
  billingMonth?: number;
  billingYear?: number;
  recordedBy: string;
  createdAt?: string;
};
