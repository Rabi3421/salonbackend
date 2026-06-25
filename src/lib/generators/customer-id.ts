import { SalonCustomer } from "@/src/models/SalonCustomer";

export async function generateCustomerNo(salonId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CUST-${year}-`;

  const latest = await SalonCustomer.findOne({
    salonId,
    customerNo: { $regex: `^${prefix}` },
  })
    .sort({ customerNo: -1 })
    .select("customerNo")
    .lean();

  let nextNumber = 1;

  if (latest && typeof (latest as Record<string, unknown>).customerNo === "string") {
    const lastPart = ((latest as Record<string, unknown>).customerNo as string).replace(prefix, "");
    const parsed = parseInt(lastPart, 10);

    if (!isNaN(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}
