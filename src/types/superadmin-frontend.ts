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

export type DashboardSummary = {
  totalSalons: number;
  activeSalons: number;
  trialSalons: number;
  unpaidSalons: number;
  blockedSalons: number;
  cancelledSalons: number;
  basicPlanSalons: number;
  premiumPlanSalons: number;
  monthlyRevenue: number;
  expectedMonthlyRevenue: number;
  collectedThisMonth: number;
  pendingCollection: number;
  totalRevenue: number;
  trialsEndingSoon: number;
  paymentsDueThisMonth: number;
};

export type DashboardChartPoint = {
  month?: string;
  name?: string;
  revenue?: number;
  payments?: number;
  salons?: number;
  value?: number;
};

export type DashboardAttentionSalon = {
  salonId: string;
  name: string;
  planCode: string;
  planName: string;
  monthlyPrice: number;
  status: string;
  dueDate: string | null;
  graceEndDate: string | null;
  trialEndDate: string | null;
  daysLeft: number | null;
  blockedReason: string;
  type: "unpaid" | "trial" | "blocked" | "due";
};

export type DashboardRecentSalon = {
  salonId: string;
  name: string;
  planCode: string;
  planName: string;
  status: string;
  createdAt: string | null;
};

export type DashboardRecentPayment = {
  paymentId: string;
  salonId: string;
  salonName: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string | null;
  createdAt: string | null;
};

export type DashboardRecentEnquiry = {
  enquiryId: string;
  name: string;
  phone: string;
  type: string;
  status: string;
  createdAt: string | null;
};

export type DashboardOverviewResponse = {
  summary: DashboardSummary;
  charts: {
    revenueTrend: DashboardChartPoint[];
    salonGrowthTrend: DashboardChartPoint[];
    planDistribution: DashboardChartPoint[];
    statusDistribution: DashboardChartPoint[];
    paymentCollection: DashboardChartPoint[];
  };
  attention: {
    unpaidSalons: DashboardAttentionSalon[];
    trialsEndingSoon: DashboardAttentionSalon[];
    blockedSalons: DashboardAttentionSalon[];
    dueThisMonth: DashboardAttentionSalon[];
  };
  recent: {
    salons: DashboardRecentSalon[];
    payments: DashboardRecentPayment[];
    enquiries: DashboardRecentEnquiry[];
  };
  totalSalons?: number;
  activeSalons?: number;
  trialSalons?: number;
  expiredSalons?: number;
  suspendedSalons?: number;
  cancelledSalons?: number;
  monthlyRevenue?: number;
  totalRevenue?: number;
  pendingPayments?: number;
  pendingPaymentAmount?: number;
  failedPayments?: number;
  refundedPayments?: number;
  expiringTrials?: number;
  newEnquiries?: number;
  openEnquiries?: number;
  demoRequests?: number;
  supportRequests?: number;
};
