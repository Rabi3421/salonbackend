import { connectDB } from "@/src/lib/db";
import mongoose from "mongoose";
import { Plan } from "@/src/models/Plan";

const SIMPLE_PLANS = [
  {
    planCode: "BASIC",
    name: "Basic",
    description: "Frontend website, owner dashboard, stylist dashboard",
    monthlyPrice: 2000,
    minimumMonthlyPrice: 1000,
    yearlyPrice: 0,
    trialDays: 30,
    maxStaff: 10,
    maxBranches: 1,
    maxAppointmentsPerMonth: 500,
    modules: {
      website: true,
      appointments: true,
      customers: true,
      staff: true,
      services: true,
      packages: true,
      pos: false,
      inventory: false,
      expenses: false,
      marketing: false,
      reports: false,
      multi_branch: false,
    },
    allowedRoles: [
      "salon_owner",
      "manager",
      "staff",
      "beautician",
      "stylist",
    ],
    isActive: true,
  },
  {
    planCode: "PREMIUM",
    name: "Premium",
    description: "All dashboards and full permissions",
    monthlyPrice: 3000,
    minimumMonthlyPrice: 2000,
    yearlyPrice: 0,
    trialDays: 30,
    maxStaff: 100,
    maxBranches: 5,
    maxAppointmentsPerMonth: 5000,
    modules: {
      website: true,
      appointments: true,
      customers: true,
      staff: true,
      services: true,
      packages: true,
      pos: true,
      inventory: true,
      expenses: true,
      marketing: true,
      reports: true,
      multi_branch: true,
    },
    allowedRoles: [
      "salon_owner",
      "salon_admin",
      "manager",
      "receptionist",
      "staff",
      "beautician",
      "stylist",
      "cashier",
      "accountant",
      "inventory_manager",
    ],
    isActive: true,
  },
];

async function main() {
  await connectDB();
  console.log("Seeding simple plans...");

  for (const plan of SIMPLE_PLANS) {
    const existing = await Plan.findOne({ planCode: plan.planCode });

    if (existing) {
      await Plan.updateOne({ planCode: plan.planCode }, { $set: plan });
      console.log(`  Updated: ${plan.planCode}`);
    } else {
      await Plan.create(plan);
      console.log(`  Created: ${plan.planCode}`);
    }
  }

  const archiveResult = await Plan.updateMany(
    { planCode: { $nin: SIMPLE_PLANS.map((p) => p.planCode) }, isActive: true },
    { $set: { isActive: false, status: "archived" } },
  );

  if (archiveResult.modifiedCount > 0) {
    console.log(`  Archived ${archiveResult.modifiedCount} other plan(s).`);
  }

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
