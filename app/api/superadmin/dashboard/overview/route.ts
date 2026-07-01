import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getPlan, normalizePlanCode } from "@/src/lib/simple-subscription-policy";
import { Enquiry } from "@/src/models/Enquiry";
import { Payment } from "@/src/models/Payment";
import { Salon } from "@/src/models/Salon";

type CountAgg = { _id: string | null; count: number };
type SumAgg = { _id: null; total: number };
type TrendAgg = { _id: { year: number; month: number }; revenue?: number; payments?: number; salons?: number };
type LeanRecord = Record<string, unknown>;

const ATTENTION_LIMIT = 8;
const RECENT_LIMIT = 6;
const ACTIVE_REVENUE_STATUSES = ["active", "trial", "unpaid"];
const SIMPLE_STATUSES = ["trial", "active", "unpaid", "blocked", "cancelled"] as const;

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function nextMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleString("en-IN", { month: "short" });
}

function lastSixMonths(now: Date) {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: monthKey(date),
      label: monthLabel(date),
      start: date,
    };
  });
}

function asDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function iso(value: unknown) {
  return asDate(value)?.toISOString() ?? null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function planLabel(planCode: unknown) {
  return getPlan(normalizePlanCode(planCode)).name;
}

function monthlyPrice(salon: LeanRecord) {
  const plan = getPlan(normalizePlanCode(salon.planCode ?? salon.currentPlanCode));
  return (
    numberValue(salon.monthlyPrice) ||
    numberValue(salon.finalMonthlyPrice) ||
    numberValue(salon.standardPrice) ||
    plan.standardPrice
  );
}

function statusOf(salon: LeanRecord) {
  return textValue(salon.subscriptionStatus || salon.accountStatus || salon.accessStatus || "trial");
}

function mapAttentionSalon(salon: LeanRecord, type: "unpaid" | "trial" | "blocked" | "due") {
  const trialEndDate = asDate(salon.trialEndDate);
  const now = new Date();
  const daysLeft = trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / 86_400_000))
    : null;

  return {
    salonId: textValue(salon.salonId),
    name: textValue(salon.name),
    planCode: normalizePlanCode(salon.planCode || salon.currentPlanCode),
    planName: planLabel(salon.planCode || salon.currentPlanCode),
    monthlyPrice: monthlyPrice(salon),
    status: statusOf(salon),
    dueDate: iso(salon.nextDueDate || salon.nextBillingDate),
    graceEndDate: iso(salon.graceEndDate),
    trialEndDate: iso(salon.trialEndDate),
    daysLeft,
    blockedReason: textValue(salon.blockedReason),
    type,
  };
}

function mapRecentSalon(salon: LeanRecord) {
  return {
    salonId: textValue(salon.salonId),
    name: textValue(salon.name),
    planCode: normalizePlanCode(salon.planCode || salon.currentPlanCode),
    planName: planLabel(salon.planCode || salon.currentPlanCode),
    status: statusOf(salon),
    createdAt: iso(salon.createdAt),
  };
}

function mapRecentPayment(payment: LeanRecord, salonNames: Map<string, string>) {
  const salonId = textValue(payment.salonId);
  return {
    paymentId: textValue(payment.paymentId),
    salonId,
    salonName: salonNames.get(salonId) ?? salonId,
    amount: numberValue(payment.amount),
    method: textValue(payment.method),
    status: textValue(payment.status),
    paidAt: iso(payment.paidAt),
    createdAt: iso(payment.createdAt),
  };
}

function mapRecentEnquiry(enquiry: LeanRecord) {
  return {
    enquiryId: textValue(enquiry.enquiryId),
    name: textValue(enquiry.name),
    phone: textValue(enquiry.phone),
    type: textValue(enquiry.type),
    status: textValue(enquiry.status),
    createdAt: iso(enquiry.createdAt),
  };
}

function countMap(items: CountAgg[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    if (item._id) acc[item._id] = item.count;
    return acc;
  }, {});
}

export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const currentMonthStart = monthStart(now);
    const currentMonthEnd = nextMonthStart(now);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const months = lastSixMonths(now);
    const trendStart = months[0].start;

    const [
      totalSalons,
      statusAgg,
      planAgg,
      expectedMonthlyRevenueAgg,
      totalRevenueAgg,
      collectedThisMonthAgg,
      pendingPaymentAgg,
      revenueTrendAgg,
      salonGrowthTrendAgg,
      unpaidSalons,
      trialsEndingSoonRows,
      blockedSalonsRows,
      dueThisMonthRows,
      recentSalons,
      recentPayments,
      recentEnquiries,
      newEnquiries,
      openEnquiries,
      demoRequests,
      supportRequests,
    ] = await Promise.all([
      Salon.countDocuments(),
      Salon.aggregate<CountAgg>([
        { $group: { _id: "$subscriptionStatus", count: { $sum: 1 } } },
      ]),
      Salon.aggregate<CountAgg>([
        {
          $project: {
            planCode: {
              $toLower: {
                $ifNull: [
                  { $cond: [{ $ne: ["$planCode", ""] }, "$planCode", "$currentPlanCode"] },
                  "premium",
                ],
              },
            },
          },
        },
        { $group: { _id: "$planCode", count: { $sum: 1 } } },
      ]),
      Salon.aggregate<SumAgg>([
        { $match: { subscriptionStatus: { $in: ACTIVE_REVENUE_STATUSES } } },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $ifNull: [
                  "$monthlyPrice",
                  { $ifNull: ["$finalMonthlyPrice", "$standardPrice"] },
                ],
              },
            },
          },
        },
      ]),
      Payment.aggregate<SumAgg>([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Payment.aggregate<SumAgg>([
        { $match: { status: "paid", paidAt: { $gte: currentMonthStart, $lt: currentMonthEnd } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Payment.aggregate<SumAgg>([
        { $match: { status: "pending" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Payment.aggregate<TrendAgg>([
        { $match: { status: "paid", paidAt: { $gte: trendStart } } },
        {
          $group: {
            _id: { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } },
            revenue: { $sum: "$amount" },
            payments: { $sum: 1 },
          },
        },
      ]),
      Salon.aggregate<TrendAgg>([
        { $match: { createdAt: { $gte: trendStart } } },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            salons: { $sum: 1 },
          },
        },
      ]),
      Salon.find({ subscriptionStatus: "unpaid" })
        .sort({ nextDueDate: 1, updatedAt: -1 })
        .limit(ATTENTION_LIMIT)
        .lean<LeanRecord[]>(),
      Salon.find({
        subscriptionStatus: "trial",
        trialEndDate: { $gte: now, $lte: sevenDaysFromNow },
      })
        .sort({ trialEndDate: 1 })
        .limit(ATTENTION_LIMIT)
        .lean<LeanRecord[]>(),
      Salon.find({ subscriptionStatus: "blocked" })
        .sort({ blockedAt: -1, updatedAt: -1 })
        .limit(ATTENTION_LIMIT)
        .lean<LeanRecord[]>(),
      Salon.find({
        subscriptionStatus: { $in: ACTIVE_REVENUE_STATUSES },
        nextDueDate: { $gte: currentMonthStart, $lt: currentMonthEnd },
      })
        .sort({ nextDueDate: 1 })
        .limit(ATTENTION_LIMIT)
        .lean<LeanRecord[]>(),
      Salon.find()
        .sort({ createdAt: -1 })
        .limit(RECENT_LIMIT)
        .lean<LeanRecord[]>(),
      Payment.find()
        .sort({ paidAt: -1, createdAt: -1 })
        .limit(RECENT_LIMIT)
        .lean<LeanRecord[]>(),
      Enquiry.find()
        .sort({ createdAt: -1 })
        .limit(RECENT_LIMIT)
        .lean<LeanRecord[]>(),
      Enquiry.countDocuments({ status: "new" }),
      Enquiry.countDocuments({ status: { $in: ["new", "in_progress"] } }),
      Enquiry.countDocuments({ type: "demo_request", status: { $in: ["new", "in_progress"] } }),
      Enquiry.countDocuments({ type: "support", status: { $in: ["new", "in_progress"] } }),
    ]);

    const statusCounts = countMap(statusAgg);
    const planCounts = countMap(planAgg);
    const collectedThisMonth = collectedThisMonthAgg[0]?.total ?? 0;
    const totalRevenue = totalRevenueAgg[0]?.total ?? 0;
    const expectedMonthlyRevenue = expectedMonthlyRevenueAgg[0]?.total ?? 0;
    const pendingPaymentAmount = pendingPaymentAgg[0]?.total ?? 0;
    const pendingCollection = Math.max(expectedMonthlyRevenue - collectedThisMonth, 0);

    const revenueByMonth = new Map(
      revenueTrendAgg.map((item) => [
        `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
        item,
      ]),
    );
    const growthByMonth = new Map(
      salonGrowthTrendAgg.map((item) => [
        `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
        item,
      ]),
    );

    const paymentSalonIds = [...new Set(recentPayments.map((payment) => textValue(payment.salonId)))].filter(Boolean);
    const paymentSalons = paymentSalonIds.length
      ? await Salon.find({ salonId: { $in: paymentSalonIds } }).select("salonId name").lean<LeanRecord[]>()
      : [];
    const salonNames = new Map(paymentSalons.map((salon) => [textValue(salon.salonId), textValue(salon.name)]));

    const summary = {
      totalSalons,
      activeSalons: statusCounts.active ?? 0,
      trialSalons: statusCounts.trial ?? 0,
      unpaidSalons: statusCounts.unpaid ?? 0,
      blockedSalons: statusCounts.blocked ?? 0,
      cancelledSalons: statusCounts.cancelled ?? 0,
      basicPlanSalons: (planCounts.basic ?? 0) + (planCounts.BASIC ?? 0),
      premiumPlanSalons: (planCounts.premium ?? 0) + (planCounts.PREMIUM ?? 0),
      monthlyRevenue: collectedThisMonth,
      expectedMonthlyRevenue,
      collectedThisMonth,
      pendingCollection,
      totalRevenue,
      trialsEndingSoon: trialsEndingSoonRows.length,
      paymentsDueThisMonth: dueThisMonthRows.length,
    };

    const charts = {
      revenueTrend: months.map((month) => {
        const item = revenueByMonth.get(month.key);
        return { month: month.label, revenue: item?.revenue ?? 0, payments: item?.payments ?? 0 };
      }),
      salonGrowthTrend: months.map((month) => {
        const item = growthByMonth.get(month.key);
        return { month: month.label, salons: item?.salons ?? 0 };
      }),
      planDistribution: [
        { name: "Basic", value: summary.basicPlanSalons },
        { name: "Premium", value: summary.premiumPlanSalons },
      ],
      statusDistribution: SIMPLE_STATUSES.map((status) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: statusCounts[status] ?? 0,
      })),
      paymentCollection: [
        { name: "Collected", value: collectedThisMonth },
        { name: "Pending", value: pendingCollection },
      ],
    };

    return successResponse({
      summary,
      charts,
      attention: {
        unpaidSalons: unpaidSalons.map((salon) => mapAttentionSalon(salon, "unpaid")),
        trialsEndingSoon: trialsEndingSoonRows.map((salon) => mapAttentionSalon(salon, "trial")),
        blockedSalons: blockedSalonsRows.map((salon) => mapAttentionSalon(salon, "blocked")),
        dueThisMonth: dueThisMonthRows.map((salon) => mapAttentionSalon(salon, "due")),
      },
      recent: {
        salons: recentSalons.map(mapRecentSalon),
        payments: recentPayments.map((payment) => mapRecentPayment(payment, salonNames)),
        enquiries: recentEnquiries.map(mapRecentEnquiry),
      },

      // Backwards-compatible fields for older dashboard consumers.
      totalSalons,
      activeSalons: summary.activeSalons,
      trialSalons: summary.trialSalons,
      expiredSalons: statusCounts.expired ?? 0,
      suspendedSalons: statusCounts.suspended ?? 0,
      cancelledSalons: summary.cancelledSalons,
      monthlyRevenue: summary.monthlyRevenue,
      totalRevenue,
      pendingPayments: await Payment.countDocuments({ status: "pending" }),
      pendingPaymentAmount,
      failedPayments: await Payment.countDocuments({ status: "failed" }),
      refundedPayments: await Payment.countDocuments({ status: "refunded" }),
      expiringTrials: summary.trialsEndingSoon,
      newEnquiries,
      openEnquiries,
      demoRequests,
      supportRequests,
    });
  } catch {
    return errorResponse("Unable to load dashboard overview.", 500);
  }
}
