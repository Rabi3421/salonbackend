import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/src/lib/api-response";
import { connectDB } from "@/src/lib/db";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { PLAN_MODULES, MODULE_META } from "@/src/constants/modules";
import { Plan } from "@/src/models/Plan";
import { Salon } from "@/src/models/Salon";
import { Subscription } from "@/src/models/Subscription";
import { Payment } from "@/src/models/Payment";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const superadmin = await getSuperadminFromRequest(request);
    if (!superadmin) return errorResponse("Unauthorized.", 401);

    const [plans, totalPlans, activePlans, salonsByPlan, subsByPlan, revenueByPlan] = await Promise.all([
      Plan.find().sort({ createdAt: -1 }).lean(),
      Plan.countDocuments(),
      Plan.countDocuments({ isActive: true }),
      Salon.aggregate<{ _id: string; count: number }>([
        { $match: { currentPlanCode: { $ne: "" } } },
        { $group: { _id: "$currentPlanCode", count: { $sum: 1 } } },
      ]),
      Subscription.aggregate<{ _id: string; count: number }>([
        { $match: { status: "active" } },
        { $group: { _id: "$planCode", count: { $sum: 1 } } },
      ]),
      Payment.aggregate<{ _id: string; total: number }>([
        { $match: { status: "paid", subscriptionId: { $ne: "" } } },
        {
          $lookup: {
            from: "subscriptions",
            localField: "subscriptionId",
            foreignField: "subscriptionId",
            as: "sub",
          },
        },
        { $unwind: { path: "$sub", preserveNullAndEmptyArrays: true } },
        { $group: { _id: "$sub.planCode", total: { $sum: "$amount" } } },
      ]),
    ]);

    const salonMap = new Map(salonsByPlan.map((s) => [s._id, s.count]));
    const subsMap = new Map(subsByPlan.map((s) => [s._id, s.count]));
    const revMap = new Map(revenueByPlan.map((r) => [r._id, r.total]));

    const planUsage = plans.map((p) => {
      const o = p as Record<string, unknown>;
      const code = o.planCode as string;
      return {
        planCode: code,
        name: o.name as string,
        monthlyPrice: o.monthlyPrice as number,
        yearlyPrice: o.yearlyPrice as number,
        isActive: o.isActive as boolean,
        salonsUsingPlan: salonMap.get(code) ?? 0,
        activeSubscriptions: subsMap.get(code) ?? 0,
        totalRevenue: revMap.get(code) ?? 0,
      };
    });

    const moduleUsage = PLAN_MODULES.map((key) => {
      const count = plans.filter((p) => {
        const mods = (p as Record<string, unknown>).modules as Record<string, boolean> | undefined;
        return mods?.[key] === true;
      }).length;
      return { moduleKey: key, label: MODULE_META[key].label, planCount: count };
    });

    return successResponse({
      totalPlans,
      activePlans,
      inactivePlans: totalPlans - activePlans,
      planUsage,
      moduleUsage,
    });
  } catch { return errorResponse("Unable to load plan usage report.", 500); }
}
