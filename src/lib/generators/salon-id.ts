import { Salon } from "@/src/models/Salon";

export async function generateSalonId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SALON-${year}-`;

  const latest = await Salon.findOne({
    salonId: { $regex: `^${prefix}` },
  })
    .sort({ salonId: -1 })
    .select("salonId")
    .lean();

  let nextNumber = 1;

  if (latest && typeof latest.salonId === "string") {
    const lastPart = latest.salonId.replace(prefix, "");
    const parsed = parseInt(lastPart, 10);

    if (!isNaN(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}
