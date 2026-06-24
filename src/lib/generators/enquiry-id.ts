import { Enquiry } from "@/src/models/Enquiry";

export async function generateEnquiryId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ENQ-${year}-`;

  const latest = await Enquiry.findOne({
    enquiryId: { $regex: `^${prefix}` },
  })
    .sort({ enquiryId: -1 })
    .select("enquiryId")
    .lean();

  let nextNumber = 1;

  if (latest && typeof latest.enquiryId === "string") {
    const lastPart = latest.enquiryId.replace(prefix, "");
    const parsed = parseInt(lastPart, 10);

    if (!isNaN(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}
