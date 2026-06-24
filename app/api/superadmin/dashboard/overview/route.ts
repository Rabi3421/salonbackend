import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { Payment } from "@/src/models/Payment";
import { Salon } from "@/src/models/Salon";
import { Enquiry } from "@/src/models/Enquiry";

export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysFromNow = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000,
    );

    const [
      totalSalons,
      activeSalons,
      trialSalons,
      expiredSalons,
      suspendedSalons,
      cancelledSalons,
      pendingPayments,
      pendingPaymentAmount,
      failedPayments,
      refundedPayments,
      totalRevenue,
      monthlyRevenue,
      expiringTrials,
      newEnquiries,
      openEnquiries,
      demoRequests,
      supportRequests,
    ] = await Promise.all([
      Salon.countDocuments(),
      Salon.countDocuments({ accountStatus: "active" }),
      Salon.countDocuments({ accountStatus: "trial" }),
      Salon.countDocuments({ accountStatus: "expired" }),
      Salon.countDocuments({ accountStatus: "suspended" }),
      Salon.countDocuments({ accountStatus: "cancelled" }),
      Payment.countDocuments({ status: "pending" }),
      Payment.aggregate<{ total: number }>([
        { $match: { status: "pending" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Payment.countDocuments({ status: "failed" }),
      Payment.countDocuments({ status: "refunded" }),
      Payment.aggregate<{ total: number }>([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Payment.aggregate<{ total: number }>([
        { $match: { status: "paid", paidAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Salon.countDocuments({
        accountStatus: "trial",
        trialEndDate: { $gte: now, $lte: sevenDaysFromNow },
      }),
      Enquiry.countDocuments({ status: "new" }),
      Enquiry.countDocuments({ status: { $in: ["new", "in_progress"] } }),
      Enquiry.countDocuments({ type: "demo_request", status: { $in: ["new", "in_progress"] } }),
      Enquiry.countDocuments({ type: "support", status: { $in: ["new", "in_progress"] } }),
    ]);

    return successResponse({
      totalSalons,
      activeSalons,
      trialSalons,
      expiredSalons,
      suspendedSalons,
      cancelledSalons,
      monthlyRevenue: monthlyRevenue[0]?.total ?? 0,
      totalRevenue: totalRevenue[0]?.total ?? 0,
      pendingPayments,
      pendingPaymentAmount: pendingPaymentAmount[0]?.total ?? 0,
      failedPayments,
      refundedPayments,
      expiringTrials,
      newEnquiries,
      openEnquiries,
      demoRequests,
      supportRequests,
    });
  } catch {
    return errorResponse("Unable to load dashboard overview.", 500);
  }
}
