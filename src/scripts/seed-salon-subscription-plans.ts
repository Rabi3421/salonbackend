import mongoose from "mongoose";

import {
  BILLING_POLICY,
  PLAN_FEATURES,
  PLAN_PRICING,
  ROLE_ACCESS_BY_PLAN,
} from "@/src/lib/subscription-policy";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const plans = mongoose.connection.db!.collection("plans");

  const seedPlans = [
    {
      planCode: "BASIC",
      name: "Basic",
      description: "Public website and basic salon dashboard access.",
      monthlyPrice: PLAN_PRICING.basic.standardMonthlyPrice,
      minimumMonthlyPrice: PLAN_PRICING.basic.minimumMonthlyPrice,
      yearlyPrice: PLAN_PRICING.basic.standardMonthlyPrice * 12,
      trialDays: BILLING_POLICY.trialDays,
      maxStaff: 10,
      maxBranches: 1,
      maxAppointmentsPerMonth: 0,
      modules: {
        website: true,
        appointments: true,
        customers: true,
        staff: true,
        services: true,
        packages: false,
        pos: false,
        inventory: false,
        expenses: false,
        marketing: false,
        reports: false,
        multi_branch: false,
      },
      features: PLAN_FEATURES.basic,
      roleAccess: ROLE_ACCESS_BY_PLAN.basic,
      allowedRoles: ROLE_ACCESS_BY_PLAN.basic,
      status: "active",
      isActive: true,
    },
    {
      planCode: "PREMIUM",
      name: "Premium",
      description: "Full dashboard access for all salon roles and modules.",
      monthlyPrice: PLAN_PRICING.premium.standardMonthlyPrice,
      minimumMonthlyPrice: PLAN_PRICING.premium.minimumMonthlyPrice,
      yearlyPrice: PLAN_PRICING.premium.standardMonthlyPrice * 12,
      trialDays: BILLING_POLICY.trialDays,
      maxStaff: 0,
      maxBranches: 1,
      maxAppointmentsPerMonth: 0,
      modules: {
        website: true,
        appointments: true,
        customers: true,
        staff: true,
        services: true,
        packages: true,
        pos: true,
        inventory: true,
        expenses: false,
        marketing: false,
        reports: true,
        multi_branch: false,
      },
      features: PLAN_FEATURES.premium,
      roleAccess: ROLE_ACCESS_BY_PLAN.premium,
      allowedRoles: ROLE_ACCESS_BY_PLAN.premium,
      status: "active",
      isActive: true,
    },
  ];

  for (const plan of seedPlans) {
    await plans.updateOne(
      { planCode: plan.planCode },
      { $set: { ...plan, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
    console.log(`Seeded ${plan.name} plan`);
  }

  await plans.updateMany(
    { planCode: { $nin: seedPlans.map((plan) => plan.planCode) }, isActive: true },
    { $set: { status: "archived", isActive: false, updatedAt: new Date() } },
  );

  await mongoose.disconnect();
  console.log("Salon subscription plans seeded.");
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
