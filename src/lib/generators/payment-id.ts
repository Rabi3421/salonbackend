import { Payment } from "@/src/models/Payment";

export async function generatePaymentId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PAY-${year}-`;

  const latest = await Payment.findOne({
    paymentId: { $regex: `^${prefix}` },
  })
    .sort({ paymentId: -1 })
    .select("paymentId")
    .lean();

  let nextNumber = 1;

  if (latest && typeof latest.paymentId === "string") {
    const lastPart = latest.paymentId.replace(prefix, "");
    const parsed = parseInt(lastPart, 10);

    if (!isNaN(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}
