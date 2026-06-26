import type {
  SalonSubscriptionPolicyPayload,
  SalonSubscriptionPolicySummary,
  SalonSubscriptionPolicyUpdateResponse,
  SubscriptionAccessStatus,
  SubscriptionBlockPayload,
  SubscriptionEvaluateAccessResponse,
  SubscriptionReactivatePayload,
} from "@/src/types/superadmin-frontend";

type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  details?: unknown;
};

async function request<T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !json.success) {
    throw new Error(json.message || "Something went wrong.");
  }

  return json;
}

// ── Dashboard ──

export type OverviewData = {
  totalSalons: number;
  activeSalons: number;
  trialSalons: number;
  expiredSalons: number;
  suspendedSalons: number;
  cancelledSalons: number;
  monthlyRevenue: number;
  totalRevenue: number;
  pendingPayments: number;
  pendingPaymentAmount: number;
  failedPayments: number;
  refundedPayments: number;
  expiringTrials: number;
  newEnquiries: number;
  openEnquiries: number;
  demoRequests: number;
  supportRequests: number;
};

export function getDashboardOverview() {
  return request<OverviewData>("/api/superadmin/dashboard/overview");
}

// ── Salons ──

export type SalonListParams = {
  search?: string;
  status?: string;
  city?: string;
  state?: string;
  page?: number;
  limit?: number;
};

export type SalonRecord = {
  _id: string;
  salonId: string;
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  businessType: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string;
  logoUrl: string;
  websiteStatus: string;
  accountStatus: string;
  trialStartDate: string;
  trialEndDate: string;
  currentPlanCode: string;
  subscriptionStatus: string;
  accessStatus?: SubscriptionAccessStatus | string;
  subscriptionPlan?: string;
  nextBillingDate?: string;
  graceEndDate?: string;
  finalMonthlyPrice?: number;
  lastPaymentDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type SalonListData = {
  salons: SalonRecord[];
  pagination: Pagination;
  summary: Record<string, number>;
};

export function getSalons(params?: SalonListParams) {
  const qs = new URLSearchParams();

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }
  }

  const query = qs.toString();
  return request<SalonListData>(
    `/api/superadmin/salons${query ? `?${query}` : ""}`,
  );
}

export type CreateSalonPayload = {
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerPassword?: string;
  businessType: string;
  address?: string;
  city: string;
  state: string;
  pincode?: string;
  gstNumber?: string;
  logoUrl?: string;
  trialDays?: number;
  planCode?: string;
};

export type CreateSalonData = {
  salon: SalonRecord;
  ownerUser: SalonUserRecord;
  subscription: unknown;
  temporaryPassword?: string;
};

export function createSalon(payload: CreateSalonPayload) {
  return request<CreateSalonData>("/api/superadmin/salons", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type SalonDetailData = {
  salon: SalonRecord;
  owner: SalonUserRecord | null;
  currentSubscription: {
    subscriptionId: string;
    planCode: string;
    planName?: string;
    status: string;
    accessStatus?: SubscriptionAccessStatus;
    paymentStatus?: string;
    billingCycle: string;
    startDate: string;
    endDate: string;
    nextBillingDate: string;
    amount: number;
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
    lastPaidAt?: string;
    lastPaymentId?: string;
  } | null;
  payments: {
    totalPayments: number;
    totalPaid: number;
  };
};

export function getSalon(salonId: string) {
  return request<SalonDetailData>(`/api/superadmin/salons/${salonId}`);
}

export type UpdateSalonPayload = {
  name?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  businessType?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  logoUrl?: string;
  websiteStatus?: string;
  currentPlanCode?: string;
};

export function updateSalon(salonId: string, payload: UpdateSalonPayload) {
  return request<{ salon: SalonRecord }>(
    `/api/superadmin/salons/${salonId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function cancelSalon(salonId: string) {
  return request(`/api/superadmin/salons/${salonId}`, { method: "DELETE" });
}

export type StatusPayload = {
  accountStatus?: string;
  websiteStatus?: string;
  reason?: string;
};

export function updateSalonStatus(salonId: string, payload: StatusPayload) {
  return request<{ salon: SalonRecord }>(
    `/api/superadmin/salons/${salonId}/status`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function updateSalonSubscriptionPolicy(
  salonId: string,
  payload: SalonSubscriptionPolicyPayload,
) {
  return request<SalonSubscriptionPolicyUpdateResponse>(
    `/api/superadmin/salons/${salonId}/subscription-policy`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function blockSalonSubscriptionAccess(
  salonId: string,
  payload: SubscriptionBlockPayload,
) {
  return request<{ subscription: SalonSubscriptionPolicySummary }>(
    `/api/superadmin/salons/${salonId}/subscription/block`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function reactivateSalonSubscriptionAccess(
  salonId: string,
  payload: SubscriptionReactivatePayload,
) {
  return request<{ subscription: SalonSubscriptionPolicySummary }>(
    `/api/superadmin/salons/${salonId}/subscription/reactivate`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

// ── Salon Users ──

export type SalonUserRecord = {
  _id: string;
  salonId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function getSalonUsers(salonId: string) {
  return request<{ users: SalonUserRecord[] }>(
    `/api/superadmin/salons/${salonId}/users`,
  );
}

export type CreateSalonUserPayload = {
  name: string;
  email: string;
  phone: string;
  role: string;
  password?: string;
};

export type CreateSalonUserData = {
  user: SalonUserRecord;
  temporaryPassword?: string;
};

export function createSalonUser(
  salonId: string,
  payload: CreateSalonUserPayload,
) {
  return request<CreateSalonUserData>(
    `/api/superadmin/salons/${salonId}/users`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export type ResetPasswordData = {
  userId: string;
  temporaryPassword?: string;
};

export function resetSalonUserPassword(
  salonId: string,
  userId: string,
  payload?: { newPassword?: string },
) {
  return request<ResetPasswordData>(
    `/api/superadmin/salons/${salonId}/users/${userId}/reset-password`,
    { method: "POST", body: JSON.stringify(payload ?? {}) },
  );
}

// ── Plans ──

export type PlanModules = Record<string, boolean>;

export type PlanRecord = {
  _id: string;
  planCode: string;
  name: string;
  description: string;
  monthlyPrice: number;
  minimumMonthlyPrice?: number;
  yearlyPrice: number;
  trialDays: number;
  maxStaff: number;
  maxBranches: number;
  maxAppointmentsPerMonth: number;
  modules: PlanModules;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PlanListParams = {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
};

export type PlanListData = {
  plans: PlanRecord[];
  pagination: Pagination;
  summary: { total: number; active: number; inactive: number };
};

export function getPlans(params?: PlanListParams) {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }
  }
  const query = qs.toString();
  return request<PlanListData>(
    `/api/superadmin/plans${query ? `?${query}` : ""}`,
  );
}

export type PlanDetailData = {
  plan: PlanRecord;
  usage: { salonsUsingPlan: number; subscriptionsUsingPlan: number };
};

export function getPlan(planCode: string) {
  return request<PlanDetailData>(`/api/superadmin/plans/${planCode}`);
}

export type CreatePlanPayload = {
  planCode: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  trialDays?: number;
  maxStaff?: number;
  maxBranches?: number;
  maxAppointmentsPerMonth?: number;
  modules?: PlanModules;
  isActive?: boolean;
};

export function createPlan(payload: CreatePlanPayload) {
  return request<{ plan: PlanRecord }>("/api/superadmin/plans", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type UpdatePlanPayload = {
  name?: string;
  description?: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  trialDays?: number;
  maxStaff?: number;
  maxBranches?: number;
  maxAppointmentsPerMonth?: number;
  modules?: PlanModules;
  isActive?: boolean;
};

export function updatePlan(planCode: string, payload: UpdatePlanPayload) {
  return request<{ plan: PlanRecord }>(
    `/api/superadmin/plans/${planCode}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function deactivatePlan(planCode: string) {
  return request(`/api/superadmin/plans/${planCode}`, { method: "DELETE" });
}

export type SeedResult = { created: string[]; skipped: string[] };

export function seedDefaultPlans() {
  return request<SeedResult>("/api/superadmin/plans/seed", { method: "POST" });
}

// ── Subscriptions ──

export type SubscriptionRecord = {
  _id: string;
  subscriptionId: string;
  salonId: string;
  planCode: string;
  planName?: string;
  status: string;
  accessStatus?: SubscriptionAccessStatus | string;
  paymentStatus?: string;
  billingCycle: string;
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  amount: number;
  standardMonthlyPrice?: number;
  minimumMonthlyPrice?: number;
  finalMonthlyPrice?: number;
  negotiatedMonthlyPrice?: number;
  nextDueDate?: string;
  nextGraceEndDate?: string;
  lastPaidAt?: string;
  lastPaymentId?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  salonName?: string;
  salonPhone?: string;
  salonCity?: string;
};

export type SubscriptionListParams = {
  search?: string;
  status?: string;
  accessStatus?: string;
  billingCycle?: string;
  salonId?: string;
  planCode?: string;
  page?: number;
  limit?: number;
};

export type SubscriptionListData = {
  subscriptions: SubscriptionRecord[];
  pagination: Pagination;
  summary: Record<string, number>;
};

export function getSubscriptions(params?: SubscriptionListParams) {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }
  }
  const query = qs.toString();
  return request<SubscriptionListData>(
    `/api/superadmin/subscriptions${query ? `?${query}` : ""}`,
  );
}

export type SubscriptionDetailData = {
  subscription: SubscriptionRecord;
  salon: SalonRecord | null;
  plan: PlanRecord | null;
};

export function getSubscription(subscriptionId: string) {
  return request<SubscriptionDetailData>(
    `/api/superadmin/subscriptions/${subscriptionId}`,
  );
}

export type AssignSubscriptionPayload = {
  salonId: string;
  planCode: string;
  billingCycle: string;
  amount?: number;
  startDate?: string;
  endDate?: string;
  nextBillingDate?: string;
  notes?: string;
};

export function createSubscription(payload: AssignSubscriptionPayload) {
  return request<{ subscription: SubscriptionRecord }>(
    "/api/superadmin/subscriptions",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export type UpdateSubscriptionPayload = {
  status?: string;
  billingCycle?: string;
  startDate?: string;
  endDate?: string;
  nextBillingDate?: string;
  amount?: number;
  notes?: string;
};

export function updateSubscription(
  subscriptionId: string,
  payload: UpdateSubscriptionPayload,
) {
  return request<{ subscription: SubscriptionRecord }>(
    `/api/superadmin/subscriptions/${subscriptionId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function cancelSubscription(
  subscriptionId: string,
  payload?: { reason?: string },
) {
  return request(
    `/api/superadmin/subscriptions/${subscriptionId}/cancel`,
    { method: "POST", body: JSON.stringify(payload ?? {}) },
  );
}

export type RenewPayload = {
  billingCycle?: string;
  amount?: number;
  startDate?: string;
  notes?: string;
};

export function renewSubscription(
  subscriptionId: string,
  payload: RenewPayload,
) {
  return request<{ subscription: SubscriptionRecord }>(
    `/api/superadmin/subscriptions/${subscriptionId}/renew`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export type ChangePlanPayload = {
  planCode: string;
  billingCycle: string;
  amount?: number;
  startDate?: string;
  notes?: string;
};

export function changeSubscriptionPlan(
  subscriptionId: string,
  payload: ChangePlanPayload,
) {
  return request<{ subscription: SubscriptionRecord }>(
    `/api/superadmin/subscriptions/${subscriptionId}/change-plan`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function checkExpiredSubscriptions() {
  return request<{ expiredCount: number }>(
    "/api/superadmin/subscriptions/check-expired",
    { method: "POST" },
  );
}

export function evaluateAllSubscriptionAccess() {
  return request<SubscriptionEvaluateAccessResponse>(
    "/api/superadmin/subscriptions/evaluate-access",
    { method: "POST" },
  );
}

// ── Payments ──

export type PaymentRecord = {
  _id: string;
  paymentId: string;
  salonId: string;
  subscriptionId: string;
  amount: number;
  method: string;
  status: string;
  transactionId: string;
  referenceNote: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  salonName?: string;
  salonPhone?: string;
  salonCity?: string;
};

export type PaymentListParams = {
  search?: string;
  status?: string;
  method?: string;
  salonId?: string;
  subscriptionId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type PaymentListData = {
  payments: PaymentRecord[];
  pagination: Pagination;
  summary: Record<string, number>;
};

export function getPayments(params?: PaymentListParams) {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }
  }
  const query = qs.toString();
  return request<PaymentListData>(
    `/api/superadmin/payments${query ? `?${query}` : ""}`,
  );
}

export type PaymentDetailData = {
  payment: PaymentRecord;
  salon: SalonRecord | null;
  subscription: SubscriptionRecord | null;
};

export function getPayment(paymentId: string) {
  return request<PaymentDetailData>(`/api/superadmin/payments/${paymentId}`);
}

export type CreatePaymentPayload = {
  salonId: string;
  subscriptionId?: string;
  amount: number;
  method: string;
  status?: string;
  transactionId?: string;
  referenceNote?: string;
  paidAt?: string;
};

export function createPayment(payload: CreatePaymentPayload) {
  return request<{ payment: PaymentRecord }>("/api/superadmin/payments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type UpdatePaymentPayload = {
  amount?: number;
  method?: string;
  status?: string;
  transactionId?: string;
  referenceNote?: string;
  paidAt?: string | null;
};

export function updatePayment(paymentId: string, payload: UpdatePaymentPayload) {
  return request<{ payment: PaymentRecord }>(
    `/api/superadmin/payments/${paymentId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function cancelPayment(paymentId: string, payload?: { reason?: string; status?: string }) {
  return request(`/api/superadmin/payments/${paymentId}`, {
    method: "DELETE",
    body: JSON.stringify(payload ?? {}),
  });
}

export function markPaymentPaid(paymentId: string, payload?: { transactionId?: string; paidAt?: string; referenceNote?: string }) {
  return request<{ payment: PaymentRecord }>(
    `/api/superadmin/payments/${paymentId}/mark-paid`,
    { method: "POST", body: JSON.stringify(payload ?? {}) },
  );
}

export function refundPayment(paymentId: string, payload?: { reason?: string }) {
  return request<{ payment: PaymentRecord }>(
    `/api/superadmin/payments/${paymentId}/refund`,
    { method: "POST", body: JSON.stringify(payload ?? {}) },
  );
}

export function getSubscriptionPayments(subscriptionId: string) {
  return request<{ payments: PaymentRecord[]; totalPaid: number }>(
    `/api/superadmin/subscriptions/${subscriptionId}/payments`,
  );
}

export function createSubscriptionPayment(subscriptionId: string, payload: { amount: number; method: string; status?: string; transactionId?: string; referenceNote?: string; paidAt?: string }) {
  return request<{ payment: PaymentRecord }>(
    `/api/superadmin/subscriptions/${subscriptionId}/payments`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

// ── Enquiries ──

export type InternalNote = {
  note: string;
  addedBy: string;
  addedByEmail: string;
  addedAt: string;
};

export type EnquiryRecord = {
  _id: string;
  enquiryId: string;
  salonId: string;
  type: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: string;
  priority: string;
  source: string;
  notes: string;
  internalNotes: InternalNote[];
  assignedTo: string;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  salonName?: string;
  salonCity?: string;
};

export type EnquiryListParams = {
  search?: string;
  status?: string;
  type?: string;
  priority?: string;
  salonId?: string;
  page?: number;
  limit?: number;
};

export type EnquiryListData = {
  enquiries: EnquiryRecord[];
  pagination: Pagination;
  summary: Record<string, number>;
};

export function getEnquiries(params?: EnquiryListParams) {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }
  }
  const query = qs.toString();
  return request<EnquiryListData>(
    `/api/superadmin/enquiries${query ? `?${query}` : ""}`,
  );
}

export type EnquiryDetailData = {
  enquiry: EnquiryRecord;
  salon: SalonRecord | null;
};

export function getEnquiry(enquiryId: string) {
  return request<EnquiryDetailData>(`/api/superadmin/enquiries/${enquiryId}`);
}

export type CreateEnquiryPayload = {
  salonId?: string;
  type: string;
  name: string;
  phone?: string;
  email?: string;
  message: string;
  priority?: string;
  source?: string;
  notes?: string;
};

export function createEnquiry(payload: CreateEnquiryPayload) {
  return request<{ enquiry: EnquiryRecord }>("/api/superadmin/enquiries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type UpdateEnquiryPayload = {
  type?: string;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  priority?: string;
  source?: string;
  notes?: string;
  assignedTo?: string;
};

export function updateEnquiry(enquiryId: string, payload: UpdateEnquiryPayload) {
  return request<{ enquiry: EnquiryRecord }>(
    `/api/superadmin/enquiries/${enquiryId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function closeEnquiry(enquiryId: string, payload?: { status?: string }) {
  return request(`/api/superadmin/enquiries/${enquiryId}`, {
    method: "DELETE",
    body: JSON.stringify(payload ?? {}),
  });
}

export function updateEnquiryStatus(enquiryId: string, payload: { status: string; note?: string }) {
  return request<{ enquiry: EnquiryRecord }>(
    `/api/superadmin/enquiries/${enquiryId}/status`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function addEnquiryNote(enquiryId: string, payload: { note: string }) {
  return request<{ enquiry: EnquiryRecord }>(
    `/api/superadmin/enquiries/${enquiryId}/notes`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

// ── Audit Logs ──

export type AuditLogRecord = {
  _id: string;
  actorType: string;
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  ip: string;
  userAgent: string;
  createdAt: string;
  category?: string;
  actionLabel?: string;
};

export type AuditLogListParams = {
  search?: string;
  actorType?: string;
  actorEmail?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type AuditLogListData = {
  auditLogs: AuditLogRecord[];
  pagination: Pagination;
  summary: Record<string, number>;
};

export function getAuditLogs(params?: AuditLogListParams) {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }
  }
  const query = qs.toString();
  return request<AuditLogListData>(
    `/api/superadmin/audit-logs${query ? `?${query}` : ""}`,
  );
}

export function getAuditLog(auditLogId: string) {
  return request<{ auditLog: AuditLogRecord }>(
    `/api/superadmin/audit-logs/${auditLogId}`,
  );
}

// ── Platform Settings ──

export type PlatformSettingsData = Record<string, unknown>;

export function getPlatformSettingsApi() {
  return request<{ settings: PlatformSettingsData }>("/api/superadmin/settings");
}

export function updatePlatformSettingsApi(payload: Record<string, unknown>) {
  return request<{ settings: PlatformSettingsData }>("/api/superadmin/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function ensureDefaultPlatformSettingsApi() {
  return request<{ settings: PlatformSettingsData; created: string[]; skipped: string[] }>(
    "/api/superadmin/settings/reset",
    { method: "POST" },
  );
}

// ── Reports ──

export type ReportParams = {
  range?: string;
  dateFrom?: string;
  dateTo?: string;
};

function reportQs(params?: ReportParams): string {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }
  }
  const q = qs.toString();
  return q ? `?${q}` : "";
}

export function getOverviewReport(params?: ReportParams) {
  return request<Record<string, unknown>>(`/api/superadmin/reports/overview${reportQs(params)}`);
}

export function getRevenueReport(params?: ReportParams) {
  return request<Record<string, unknown>>(`/api/superadmin/reports/revenue${reportQs(params)}`);
}

export function getSalonReport(params?: ReportParams) {
  return request<Record<string, unknown>>(`/api/superadmin/reports/salons${reportQs(params)}`);
}

export function getSubscriptionReport(params?: ReportParams) {
  return request<Record<string, unknown>>(`/api/superadmin/reports/subscriptions${reportQs(params)}`);
}

export function getPaymentReport(params?: ReportParams) {
  return request<Record<string, unknown>>(`/api/superadmin/reports/payments${reportQs(params)}`);
}

export function getEnquiryReport(params?: ReportParams) {
  return request<Record<string, unknown>>(`/api/superadmin/reports/enquiries${reportQs(params)}`);
}

export function getPlanUsageReport() {
  return request<Record<string, unknown>>("/api/superadmin/reports/plans");
}

// ── Website Content ──

export type WebsiteContentImage = {
  key: string;
  url: string;
  alt?: string;
  title?: string;
  sortOrder?: number;
};

export type WebsiteContentButton = {
  label: string;
  href: string;
  type?: "primary" | "secondary" | "whatsapp" | "phone" | "link";
  enabled?: boolean;
};

export type WebsiteContentSection = {
  sectionKey: string;
  sectionType: string;
  enabled: boolean;
  sortOrder: number;
  content: Record<string, unknown>;
  images: WebsiteContentImage[];
  buttons: WebsiteContentButton[];
  items: unknown[];
  settings: Record<string, unknown>;
};

export type WebsiteContentSeo = {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogImageUrl?: string;
};

export type WebsiteContentPage = {
  pageKey: string;
  title: string;
  slug: string;
  seo: WebsiteContentSeo;
  sections: WebsiteContentSection[];
};

export type WebsiteContentTheme = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
};

export type WebsiteContentGlobal = {
  salonName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  instagramUrl: string;
  facebookUrl: string;
  googleMapUrl: string;
  openingHours: string;
};

export type SalonWebsiteContent = {
  _id?: string;
  salonId: string;
  status: "draft" | "published";
  version: number;
  theme: WebsiteContentTheme;
  global: WebsiteContentGlobal;
  pages: WebsiteContentPage[];
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
};

export function fetchSalonWebsiteContent(salonId: string) {
  return request<{ content: SalonWebsiteContent }>(
    `/api/superadmin/salons/${salonId}/website-content`,
  );
}

export function updateSalonWebsiteContent(
  salonId: string,
  payload: {
    theme?: Partial<WebsiteContentTheme>;
    global?: Partial<WebsiteContentGlobal>;
    status?: "draft" | "published";
  },
) {
  return request<{ content: SalonWebsiteContent }>(
    `/api/superadmin/salons/${salonId}/website-content`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function fetchSalonWebsitePage(salonId: string, pageKey: string) {
  return request<{ page: WebsiteContentPage }>(
    `/api/superadmin/salons/${salonId}/website-content/pages/${pageKey}`,
  );
}

export function updateSalonWebsitePage(
  salonId: string,
  pageKey: string,
  payload: {
    title?: string;
    slug?: string;
    seo?: WebsiteContentSeo;
    sections?: WebsiteContentSection[];
  },
) {
  return request<{ page: WebsiteContentPage }>(
    `/api/superadmin/salons/${salonId}/website-content/pages/${pageKey}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function updateSalonWebsiteSection(
  salonId: string,
  pageKey: string,
  sectionKey: string,
  payload: Partial<
    Pick<
      WebsiteContentSection,
      "enabled" | "sortOrder" | "content" | "images" | "buttons" | "items" | "settings"
    >
  >,
) {
  return request<{ section: WebsiteContentSection }>(
    `/api/superadmin/salons/${salonId}/website-content/pages/${pageKey}/sections/${sectionKey}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function resetSalonWebsiteContent(salonId: string) {
  return request<{ content: SalonWebsiteContent }>(
    `/api/superadmin/salons/${salonId}/website-content/reset-default`,
    { method: "POST", body: JSON.stringify({ confirm: true }) },
  );
}
