import mongoose from "mongoose";

import { addTrialPeriod } from "@/src/lib/subscription-billing-dates";
import {
  buildInitialSubscriptionFields,
  syncSalonAccessFromSubscription,
} from "@/src/lib/subscription-access-service";
import { normalizePlanCode } from "@/src/lib/subscription-policy";

function subscriptionIdFor(salonId: string): string {
  const suffix = salonId.replace(/[^A-Z0-9]/gi, "").slice(-8).padStart(8, "0");
  return `SUB-${suffix}`;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set.");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const db = mongoose.connection.db!;
  const salons = await db.collection("salons").find({}).toArray();
  const subscriptions = db.collection("subscriptions");

  let created = 0;
  let updated = 0;

  for (const salon of salons) {
    const salonId = String(salon.salonId);
    const existing = await subscriptions.findOne({ salonId });

    const trialStartDate = salon.trialStartDate ? new Date(salon.trialStartDate) : new Date(salon.createdAt ?? new Date());
    const trialEndDate = salon.trialEndDate ? new Date(salon.trialEndDate) : addTrialPeriod(trialStartDate);
    const planCode = normalizePlanCode(salon.currentPlanCode || salon.subscriptionPlan || "premium");
    const fields = buildInitialSubscriptionFields({
      planCode,
      trialStartDate,
      trialEndDate,
      finalMonthlyPrice: Number(salon.finalMonthlyPrice || 0) || undefined,
    });

    const base = {
      salonId,
      ...fields,
      status: salon.accessStatus || salon.subscriptionStatus || "trial",
      accessStatus: salon.accessStatus || salon.subscriptionStatus || "trial",
      paymentStatus: salon.lastPaymentDate ? "paid" : "pending",
      billingCycle: salon.subscriptionStatus === "active" ? "monthly" : "trial",
      startDate: trialStartDate,
      endDate: trialEndDate,
      updatedAt: new Date(),
    };

    if (!existing) {
      const doc = {
        subscriptionId: subscriptionIdFor(salonId),
        ...base,
        createdAt: new Date(),
      };
      await subscriptions.insertOne(doc);
      await syncSalonAccessFromSubscription(doc);
      created++;
    } else {
      await subscriptions.updateOne(
        { _id: existing._id },
        {
          $set: {
            planCode: existing.planCode || base.planCode,
            planName: existing.planName || base.planName,
            standardMonthlyPrice: existing.standardMonthlyPrice || base.standardMonthlyPrice,
            minimumMonthlyPrice: existing.minimumMonthlyPrice || base.minimumMonthlyPrice,
            finalMonthlyPrice: existing.finalMonthlyPrice || base.finalMonthlyPrice,
            amount: existing.amount || base.amount,
            billingCollectionDay: existing.billingCollectionDay || base.billingCollectionDay,
            graceEndDay: existing.graceEndDay || base.graceEndDay,
            trialStartDate: existing.trialStartDate || base.trialStartDate,
            trialEndDate: existing.trialEndDate || base.trialEndDate,
            currentDueDate: existing.currentDueDate || base.currentDueDate,
            currentGraceEndDate: existing.currentGraceEndDate || base.currentGraceEndDate,
            nextDueDate: existing.nextDueDate || base.nextDueDate,
            nextGraceEndDate: existing.nextGraceEndDate || base.nextGraceEndDate,
            accessStatus: existing.accessStatus || base.accessStatus,
            paymentStatus: existing.paymentStatus || base.paymentStatus,
            updatedAt: new Date(),
          },
        },
      );
      const refreshed = await subscriptions.findOne({ _id: existing._id });
      if (refreshed) await syncSalonAccessFromSubscription(refreshed);
      updated++;
    }
  }

  await mongoose.disconnect();
  console.log(`Backfill complete. Created: ${created}, Updated: ${updated}`);
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
