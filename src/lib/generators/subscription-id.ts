import { Subscription } from "@/src/models/Subscription";

export async function generateSubscriptionId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SUB-${year}-`;

  const latest = await Subscription.findOne({
    subscriptionId: { $regex: `^${prefix}` },
  })
    .sort({ subscriptionId: -1 })
    .select("subscriptionId")
    .lean();

  let nextNumber = 1;

  if (latest && typeof latest.subscriptionId === "string") {
    const lastPart = latest.subscriptionId.replace(prefix, "");
    const parsed = parseInt(lastPart, 10);

    if (!isNaN(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}
