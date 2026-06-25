import type { FrontendSalonRole } from "@/src/lib/auth/salon-permissions";
import { getTodayRange, getMonthRange } from "./date-utils";
import { SalonAppointment } from "@/src/models/SalonAppointment";
import { SalonCustomer } from "@/src/models/SalonCustomer";
import { SalonStaff } from "@/src/models/SalonStaff";
import { SalonBill } from "@/src/models/SalonBill";
import { SalonBillPayment } from "@/src/models/SalonBillPayment";
import { Enquiry } from "@/src/models/Enquiry";
import { SalonInventoryProduct } from "@/src/models/SalonInventoryProduct";

type Stat = {
  label: string;
  value: string | number;
  icon?: string;
  trend?: string;
  variant?: string;
};

type OverviewResult = {
  role: string;
  salonName: string;
  generatedAt: string;
  isDemoData: boolean;
  stats: Stat[];
  todayAppointments: Record<string, unknown>[];
  recentEnquiries: Record<string, unknown>[];
  revenueSummary: Record<string, unknown>;
  staffSnapshot: Record<string, unknown>;
  lowStockAlerts: unknown[];
  quickActions: Record<string, unknown>[];
  alerts: string[];
};

function shape(doc: Record<string, unknown>): Record<string, unknown> {
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

function fmt(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

// ── Shared queries ──

async function getTodayAppointments(
  salonId: string,
  limitN = 8,
  stylistFilter?: { userId: string; userName: string },
) {
  const { start, end } = getTodayRange();
  const filter: Record<string, unknown> = {
    salonId,
    date: { $gte: start, $lte: end },
  };
  if (stylistFilter) {
    filter.$or = [
      { "stylist.id": stylistFilter.userId },
      { "stylist.name": stylistFilter.userName },
    ];
  }
  const apts = await SalonAppointment.find(filter)
    .sort({ startTime: 1 })
    .limit(limitN)
    .select("appointmentNo customer services stylist date startTime status source totalAmount")
    .lean();
  return (apts as Record<string, unknown>[]).map(shape);
}

async function getAppointmentCounts(salonId: string) {
  const { start, end } = getTodayRange();
  const base = { salonId, date: { $gte: start, $lte: end } };
  const [total, requested, confirmed, checked_in, in_service, completed, no_show, walk_in] =
    await Promise.all([
      SalonAppointment.countDocuments(base),
      SalonAppointment.countDocuments({ ...base, status: "requested" }),
      SalonAppointment.countDocuments({ ...base, status: "confirmed" }),
      SalonAppointment.countDocuments({ ...base, status: "checked_in" }),
      SalonAppointment.countDocuments({ ...base, status: "in_service" }),
      SalonAppointment.countDocuments({ ...base, status: "completed" }),
      SalonAppointment.countDocuments({ ...base, status: "no_show" }),
      SalonAppointment.countDocuments({ ...base, source: "walk_in" }),
    ]);
  return { total, requested, confirmed, checked_in, in_service, completed, no_show, walk_in };
}

async function getRecentEnquiries(salonId: string, limitN = 5) {
  const enqs = await Enquiry.find({
    salonId,
    status: { $in: ["new", "contacted", "follow_up", "in_progress"] },
  })
    .sort({ createdAt: -1 })
    .limit(limitN)
    .select("enquiryId name phone type status priority createdAt")
    .lean();
  return (enqs as Record<string, unknown>[]).map(shape);
}

async function getLowStockAlerts(salonId: string, limitN = 5) {
  const products = await SalonInventoryProduct.find({
    salonId,
    status: "active",
    stockState: { $in: ["low_stock", "out_of_stock"] },
  })
    .sort({ currentStock: 1 })
    .limit(limitN)
    .select("name currentStock minStockLevel stockState unit category")
    .lean();
  return (products as Record<string, unknown>[]).map(shape);
}

async function getOpenEnquiryCount(salonId: string) {
  return Enquiry.countDocuments({
    salonId,
    status: { $in: ["new", "contacted", "follow_up", "in_progress"] },
  });
}

async function getRevenueSummary(salonId: string) {
  const { start: tStart, end: tEnd } = getTodayRange();
  const { start: mStart, end: mEnd } = getMonthRange();
  const completedFilter = { salonId, status: "completed" };

  const [todayPayments, monthPayments, pendingBills] = await Promise.all([
    SalonBillPayment.find({ ...completedFilter, paidAt: { $gte: tStart, $lte: tEnd } })
      .select("amount mode")
      .lean(),
    SalonBillPayment.find({ ...completedFilter, paidAt: { $gte: mStart, $lte: mEnd } })
      .select("amount mode")
      .lean(),
    SalonBill.find({ salonId, status: { $in: ["unpaid", "partially_paid"] } })
      .select("dueAmount")
      .lean(),
  ]);

  const todayCollection = (todayPayments as { amount: number }[]).reduce(
    (s, p) => s + p.amount, 0,
  );
  const monthCollection = (monthPayments as { amount: number }[]).reduce(
    (s, p) => s + p.amount, 0,
  );
  const pendingDues = (pendingBills as { dueAmount: number }[]).reduce(
    (s, b) => s + b.dueAmount, 0,
  );

  const modes: Record<string, number> = {};
  for (const p of todayPayments as { amount: number; mode: string }[]) {
    modes[p.mode] = (modes[p.mode] ?? 0) + p.amount;
  }
  const paymentModes = Object.entries(modes).map(([mode, amount]) => ({ mode, amount }));

  return { todayCollection, monthCollection, pendingDues, paymentModes };
}

async function getStaffSnapshot(salonId: string) {
  const { start, end } = getTodayRange();
  const [totalStaff, onLeave, busyNow] = await Promise.all([
    SalonStaff.countDocuments({ salonId, status: "active" }),
    SalonStaff.countDocuments({ salonId, status: "on_leave" }),
    SalonAppointment.countDocuments({
      salonId,
      date: { $gte: start, $lte: end },
      status: { $in: ["checked_in", "in_service"] },
    }),
  ]);
  return {
    totalStaff,
    availableToday: Math.max(totalStaff - onLeave, 0),
    busyNow,
    onLeave,
  };
}

function ownerQuickActions() {
  return [
    { label: "New Appointment", icon: "CalendarDaysIcon", href: "/dashboard/appointments/new" },
    { label: "Add Customer", icon: "UserPlusIcon", href: "/dashboard/customers/new" },
    { label: "Create Bill", icon: "DocumentTextIcon", href: "/dashboard/billing/new" },
    { label: "View Reports", icon: "ChartBarIcon", href: "/dashboard/reports" },
  ];
}

function managerQuickActions() {
  return [
    { label: "Confirm Booking", icon: "CheckCircleIcon", href: "/dashboard/appointments" },
    { label: "Add Walk-In", icon: "ArrowRightOnRectangleIcon", href: "/dashboard/appointments/new" },
    { label: "Assign Stylist", icon: "UsersIcon", href: "/dashboard/appointments" },
    { label: "View Enquiries", icon: "ChatBubbleLeftRightIcon", href: "/dashboard/enquiries" },
  ];
}

function receptionistQuickActions() {
  return [
    { label: "New Appointment", icon: "CalendarDaysIcon", href: "/dashboard/appointments/new" },
    { label: "Walk-In Customer", icon: "UserPlusIcon", href: "/dashboard/customers/new" },
    { label: "Check-In Client", icon: "CheckCircleIcon", href: "/dashboard/appointments" },
    { label: "Follow Up", icon: "PhoneIcon", href: "/dashboard/enquiries" },
  ];
}

function stylistQuickActions() {
  return [
    { label: "My Schedule", icon: "CalendarDaysIcon", href: "/dashboard/appointments" },
    { label: "Start Service", icon: "PlayIcon", href: "/dashboard/appointments" },
    { label: "Complete Service", icon: "CheckIcon", href: "/dashboard/appointments" },
    { label: "Add Note", icon: "PencilIcon", href: "/dashboard/customers" },
  ];
}

function accountantQuickActions() {
  return [
    { label: "Create Bill", icon: "DocumentTextIcon", href: "/dashboard/billing/new" },
    { label: "Record Payment", icon: "CreditCardIcon", href: "/dashboard/payments" },
    { label: "Finance Report", icon: "ChartBarIcon", href: "/dashboard/reports" },
    { label: "View Dues", icon: "ExclamationTriangleIcon", href: "/dashboard/billing" },
  ];
}

// ── Role-specific overviews ──

async function getOwnerOverview(
  salonId: string,
  salonName: string,
): Promise<OverviewResult> {
  const [aptCounts, todayApts, enquiries, openEnqCount, revenue, staff, activeCustomers, unpaidBills, stockAlerts] =
    await Promise.all([
      getAppointmentCounts(salonId),
      getTodayAppointments(salonId),
      getRecentEnquiries(salonId),
      getOpenEnquiryCount(salonId),
      getRevenueSummary(salonId),
      getStaffSnapshot(salonId),
      SalonCustomer.countDocuments({ salonId, status: "active" }),
      SalonBill.countDocuments({ salonId, status: { $in: ["unpaid", "partially_paid"] } }),
      getLowStockAlerts(salonId),
    ]);

  const alerts: string[] = [];
  if (aptCounts.requested > 0) alerts.push(`${aptCounts.requested} pending appointment confirmations`);
  if (openEnqCount > 0) alerts.push(`${openEnqCount} open website enquiries`);
  if (revenue.pendingDues > 0) alerts.push(`${fmt(revenue.pendingDues)} dues pending from ${unpaidBills} bills`);
  if (aptCounts.no_show > 0) alerts.push(`${aptCounts.no_show} no-shows today`);
  if (stockAlerts.length > 0) alerts.push(`${stockAlerts.length} products low/out of stock`);

  return {
    role: "owner",
    salonName,
    generatedAt: new Date().toISOString(),
    isDemoData: false,
    stats: [
      { label: "Today Revenue", value: fmt(revenue.todayCollection), icon: "CurrencyRupeeIcon", variant: "success" },
      { label: "Monthly Revenue", value: fmt(revenue.monthCollection), icon: "ChartBarIcon", variant: "success" },
      { label: "Today Appointments", value: aptCounts.total, icon: "CalendarDaysIcon", variant: "info" },
      { label: "Pending Requests", value: aptCounts.requested, icon: "ClockIcon", variant: "warning" },
      { label: "Active Customers", value: activeCustomers, icon: "UserGroupIcon" },
      { label: "Pending Dues", value: fmt(revenue.pendingDues), icon: "ExclamationTriangleIcon", variant: "warning" },
    ],
    todayAppointments: todayApts,
    recentEnquiries: enquiries,
    revenueSummary: revenue,
    staffSnapshot: staff,
    lowStockAlerts: stockAlerts,
    quickActions: ownerQuickActions(),
    alerts,
  };
}

async function getManagerOverview(
  salonId: string,
  salonName: string,
): Promise<OverviewResult> {
  const [aptCounts, todayApts, enquiries, openEnqCount, staff] = await Promise.all([
    getAppointmentCounts(salonId),
    getTodayAppointments(salonId),
    getRecentEnquiries(salonId),
    getOpenEnquiryCount(salonId),
    getStaffSnapshot(salonId),
  ]);

  const alerts: string[] = [];
  if (aptCounts.requested > 0) alerts.push(`${aptCounts.requested} pending confirmations`);
  if (aptCounts.no_show > 0) alerts.push(`${aptCounts.no_show} no-shows today`);
  if (openEnqCount > 0) alerts.push(`${openEnqCount} open enquiries`);

  return {
    role: "manager",
    salonName,
    generatedAt: new Date().toISOString(),
    isDemoData: false,
    stats: [
      { label: "Today Appointments", value: aptCounts.total, icon: "CalendarDaysIcon", variant: "info" },
      { label: "Pending Confirmations", value: aptCounts.requested, icon: "ClockIcon", variant: "warning" },
      { label: "Checked-In Clients", value: aptCounts.checked_in, icon: "CheckCircleIcon", variant: "success" },
      { label: "Open Enquiries", value: openEnqCount, icon: "ChatBubbleLeftRightIcon", variant: "warning" },
      { label: "Staff Available", value: staff.availableToday, icon: "UsersIcon" },
      { label: "Completed Today", value: aptCounts.completed, icon: "CheckCircleIcon", variant: "success" },
    ],
    todayAppointments: todayApts,
    recentEnquiries: enquiries,
    revenueSummary: {},
    staffSnapshot: staff,
    lowStockAlerts: [],
    quickActions: managerQuickActions(),
    alerts,
  };
}

async function getReceptionistOverview(
  salonId: string,
  salonName: string,
): Promise<OverviewResult> {
  const [aptCounts, todayApts, enquiries, openEnqCount] = await Promise.all([
    getAppointmentCounts(salonId),
    getTodayAppointments(salonId),
    getRecentEnquiries(salonId),
    getOpenEnquiryCount(salonId),
  ]);

  const nextApt = todayApts.find(
    (a) => a.status === "confirmed" || a.status === "requested",
  );

  const alerts: string[] = [];
  if (aptCounts.requested > 0) alerts.push(`${aptCounts.requested} bookings need confirmation`);
  if (openEnqCount > 0) alerts.push(`${openEnqCount} open enquiries to follow up`);

  return {
    role: "receptionist",
    salonName,
    generatedAt: new Date().toISOString(),
    isDemoData: false,
    stats: [
      { label: "Today Queue", value: aptCounts.total, icon: "QueueListIcon", variant: "info" },
      { label: "Next Appointment", value: nextApt ? String(nextApt.startTime ?? "—") : "—", icon: "ClockIcon" },
      { label: "Pending Confirmations", value: aptCounts.requested, icon: "ExclamationCircleIcon", variant: "warning" },
      { label: "Checked-In", value: aptCounts.checked_in, icon: "CheckCircleIcon", variant: "success" },
      { label: "Walk-Ins Today", value: aptCounts.walk_in, icon: "ArrowRightOnRectangleIcon" },
      { label: "Open Enquiries", value: openEnqCount, icon: "ChatBubbleLeftRightIcon", variant: "warning" },
    ],
    todayAppointments: todayApts,
    recentEnquiries: enquiries,
    revenueSummary: {},
    staffSnapshot: {},
    lowStockAlerts: [],
    quickActions: receptionistQuickActions(),
    alerts,
  };
}

async function getStylistOverview(
  salonId: string,
  salonName: string,
  user: Record<string, unknown>,
): Promise<OverviewResult> {
  const userId = String(user.id ?? "");
  const userName = String(user.name ?? "");

  const myApts = await getTodayAppointments(salonId, 8, { userId, userName });

  const myCompleted = myApts.filter((a) => a.status === "completed").length;
  const myPending = myApts.filter(
    (a) => a.status === "confirmed" || a.status === "checked_in" || a.status === "requested",
  ).length;
  const nextClient = myApts.find(
    (a) => a.status === "confirmed" || a.status === "checked_in",
  );

  const alerts: string[] = [];
  if (myPending > 0) alerts.push(`${myPending} pending services`);

  return {
    role: "stylist",
    salonName,
    generatedAt: new Date().toISOString(),
    isDemoData: false,
    stats: [
      { label: "My Appointments", value: myApts.length, icon: "CalendarDaysIcon", variant: "info" },
      { label: "Next Client", value: nextClient ? String(nextClient.startTime ?? "—") : "—", icon: "ClockIcon" },
      { label: "Completed Today", value: myCompleted, icon: "CheckCircleIcon", variant: "success" },
      { label: "Pending Services", value: myPending, icon: "SparklesIcon", variant: "warning" },
    ],
    todayAppointments: myApts,
    recentEnquiries: [],
    revenueSummary: {},
    staffSnapshot: {},
    lowStockAlerts: [],
    quickActions: stylistQuickActions(),
    alerts,
  };
}

async function getAccountantOverview(
  salonId: string,
  salonName: string,
): Promise<OverviewResult> {
  const [revenue, unpaidCount, partialCount, todayPaymentCount] = await Promise.all([
    getRevenueSummary(salonId),
    SalonBill.countDocuments({ salonId, status: "unpaid" }),
    SalonBill.countDocuments({ salonId, status: "partially_paid" }),
    (async () => {
      const { start, end } = getTodayRange();
      return SalonBillPayment.countDocuments({
        salonId,
        status: "completed",
        paidAt: { $gte: start, $lte: end },
      });
    })(),
  ]);

  const alerts: string[] = [];
  if (revenue.pendingDues > 0)
    alerts.push(`${fmt(revenue.pendingDues)} dues pending`);
  if (unpaidCount > 0) alerts.push(`${unpaidCount} unpaid bills`);

  return {
    role: "accountant",
    salonName,
    generatedAt: new Date().toISOString(),
    isDemoData: false,
    stats: [
      { label: "Today Collection", value: fmt(revenue.todayCollection), icon: "CurrencyRupeeIcon", trend: "", variant: "success" },
      { label: "Monthly Collection", value: fmt(revenue.monthCollection), icon: "ChartBarIcon", variant: "success" },
      { label: "Pending Dues", value: fmt(revenue.pendingDues), icon: "ExclamationTriangleIcon", variant: "warning" },
      { label: "Payments Today", value: todayPaymentCount, icon: "CreditCardIcon" },
      { label: "Unpaid Bills", value: unpaidCount, icon: "DocumentTextIcon", variant: "warning" },
      { label: "Partially Paid", value: partialCount, icon: "DocumentTextIcon" },
    ],
    todayAppointments: [],
    recentEnquiries: [],
    revenueSummary: revenue,
    staffSnapshot: {},
    lowStockAlerts: [],
    quickActions: accountantQuickActions(),
    alerts,
  };
}

// ── Main dispatcher ──

export async function getDashboardOverviewByRole(
  salonId: string,
  salonName: string,
  user: Record<string, unknown>,
  role: FrontendSalonRole,
): Promise<OverviewResult> {
  switch (role) {
    case "owner":
      return getOwnerOverview(salonId, salonName);
    case "manager":
      return getManagerOverview(salonId, salonName);
    case "receptionist":
      return getReceptionistOverview(salonId, salonName);
    case "stylist":
      return getStylistOverview(salonId, salonName, user);
    case "accountant":
      return getAccountantOverview(salonId, salonName);
    default:
      return getOwnerOverview(salonId, salonName);
  }
}
