import { getServerEnv } from "@/src/lib/env";
import { hashPassword } from "@/src/lib/auth/superadmin-auth";
import { Superadmin } from "@/src/models/Superadmin";

export async function ensureDefaultSuperadmin() {
  const {
    SUPERADMIN_EMAIL,
    SUPERADMIN_NAME,
    SUPERADMIN_PHONE,
    SUPERADMIN_PASSWORD,
  } = getServerEnv();

  const email = SUPERADMIN_EMAIL.toLowerCase().trim();
  const existingSuperadmin = await Superadmin.findOne({ email });

  if (existingSuperadmin) {
    return existingSuperadmin;
  }

  return Superadmin.create({
    name: SUPERADMIN_NAME,
    email,
    phone: SUPERADMIN_PHONE,
    passwordHash: await hashPassword(SUPERADMIN_PASSWORD),
    role: "superadmin",
    isActive: true,
  });
}
