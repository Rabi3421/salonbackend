import { SalonStaff } from "@/src/models/SalonStaff";

export async function generateStaffNo(salonId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `STF-${year}-`;

  const latest = await SalonStaff.findOne({
    salonId,
    staffNo: { $regex: `^${prefix}` },
  })
    .sort({ staffNo: -1 })
    .select("staffNo")
    .lean();

  let nextNumber = 1;

  if (latest && typeof (latest as Record<string, unknown>).staffNo === "string") {
    const lastPart = ((latest as Record<string, unknown>).staffNo as string).replace(prefix, "");
    const parsed = parseInt(lastPart, 10);

    if (!isNaN(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}
