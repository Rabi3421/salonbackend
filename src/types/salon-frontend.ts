export type SalonSubscriptionAccessStatus =
  | "trial"
  | "active"
  | "payment_due"
  | "grace_period"
  | "access_blocked"
  | "suspended"
  | "cancelled"
  | "expired";

export type SalonSubscriptionPaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled";

export type SalonPaymentInstruction = {
  upiId: string;
  accountName: string;
  note: string;
};

export type SalonCurrentSubscription = {
  planCode: "basic" | "premium" | string;
  planName: string;
  accessStatus: SalonSubscriptionAccessStatus;
  subscriptionStatus: string;
  finalMonthlyPrice: number;
  standardMonthlyPrice: number;
  minimumMonthlyPrice?: number;
  trialStartDate: string | null;
  trialEndDate: string | null;
  nextDueDate: string | null;
  nextGraceEndDate: string | null;
  currentDueDate: string | null;
  currentGraceEndDate: string | null;
  paymentStatus: SalonSubscriptionPaymentStatus;
  lastPaidAt: string | null;
  dueAmount: number;
  billingPolicy?: {
    collectionDay: number;
    graceEndDay: number;
  };
  subscriptionWarning?: string;
  paymentInstructions: SalonPaymentInstruction;
};

export type SalonSubscriptionPaymentItem = {
  paymentId: string;
  amount: number;
  paymentMode: string;
  paymentStatus: SalonSubscriptionPaymentStatus;
  paymentDate: string | null;
  receiptNumber: string;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
  transactionId: string;
  notes: string;
};

export type SalonSubscriptionPaymentsResponse = {
  payments: SalonSubscriptionPaymentItem[];
};

export type SalonDashboardMeta = {
  salon: {
    salonId: string;
    name: string;
    websiteStatus?: string;
    accountStatus?: string;
    accessStatus?: string;
  };
  user: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role: "owner" | "manager" | "receptionist" | "stylist" | "accountant";
  };
  subscription: Omit<SalonCurrentSubscription, "paymentInstructions"> | null;
  subscriptionWarning: string;
};
