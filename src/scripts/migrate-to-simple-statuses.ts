import { connectDB } from "@/src/lib/db";
import mongoose from "mongoose";
import { Salon } from "@/src/models/Salon";
import { Subscription } from "@/src/models/Subscription";

const STATUS_MAP: Record<string, string> = {
  payment_due: "unpaid",
  grace_period: "unpaid",
  access_blocked: "blocked",
  suspended: "blocked",
  expired: "cancelled",
};

async function main() {
  await connectDB();
  console.log("Migrating to simple subscription statuses...");

  for (const [oldStatus, newStatus] of Object.entries(STATUS_MAP)) {
    const salonResult = await Salon.updateMany(
      {
        $or: [
          { accountStatus: oldStatus },
          { accessStatus: oldStatus },
          { subscriptionStatus: oldStatus },
        ],
      },
      {
        $set: {
          accountStatus: newStatus,
          accessStatus: newStatus,
          subscriptionStatus: newStatus,
          ...(newStatus === "blocked" || newStatus === "cancelled"
            ? { isActive: false }
            : {}),
        },
      },
    );

    if (salonResult.modifiedCount > 0) {
      console.log(`  Salon: ${oldStatus} → ${newStatus}: ${salonResult.modifiedCount} updated`);
    }

    const subResult = await Subscription.updateMany(
      {
        $or: [
          { status: oldStatus },
          { accessStatus: oldStatus },
        ],
      },
      {
        $set: {
          status: newStatus,
          accessStatus: newStatus,
        },
      },
    );

    if (subResult.modifiedCount > 0) {
      console.log(`  Subscription: ${oldStatus} → ${newStatus}: ${subResult.modifiedCount} updated`);
    }
  }

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
