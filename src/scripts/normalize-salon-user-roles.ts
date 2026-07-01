import { connectDB } from "@/src/lib/db";
import { normalizeBackendSalonRole } from "@/src/lib/auth/salon-permissions";
import { SalonUser } from "@/src/models/SalonUser";
import mongoose from "mongoose";

async function main() {
  await connectDB();
  console.log("Normalizing salon user roles...");

  const legacyRoles = [
    "salon_admin",
    "cashier",
    "staff",
    "beautician",
    "inventory_manager",
  ];

  let modified = 0;

  for (const legacyRole of legacyRoles) {
    const canonicalRole = normalizeBackendSalonRole(legacyRole);
    const result = await SalonUser.updateMany(
      { role: legacyRole },
      { $set: { role: canonicalRole } },
    );

    if (result.modifiedCount > 0) {
      modified += result.modifiedCount;
      console.log(
        `  ${legacyRole} -> ${canonicalRole}: ${result.modifiedCount} updated`,
      );
    }
  }

  console.log(`Done. ${modified} salon users updated.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Role normalization error:", err);
  process.exit(1);
});
