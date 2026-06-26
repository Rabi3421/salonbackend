export type SalonSubscriptionAccessStatus =
  | "trial"
  | "active"
  | "unpaid"
  | "blocked"
  | "cancelled";

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
  monthlyPrice: number;
  standardPrice: number;
  minimumPrice: number;
  subscriptionStatus: SalonSubscriptionAccessStatus;
  trialStartDate: string | null;
  trialEndDate: string | null;
  nextDueDate: string | null;
  graceEndDate: string | null;
  lastPaymentDate: string | null;
  dueAmount: number;
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
  subscription: {
    planCode: string;
    planName: string;
    monthlyPrice: number;
    subscriptionStatus: string;
    trialEndDate: string | null;
    nextDueDate: string | null;
    graceEndDate: string | null;
    warningMessage: string;
  } | null;
};
