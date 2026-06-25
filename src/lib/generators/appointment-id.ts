import { SalonAppointment } from "@/src/models/SalonAppointment";

export async function generateAppointmentNo(
  salonId: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `APT-${year}-`;

  const latest = await SalonAppointment.findOne({
    salonId,
    appointmentNo: { $regex: `^${prefix}` },
  })
    .sort({ appointmentNo: -1 })
    .select("appointmentNo")
    .lean();

  let nextNumber = 1;

  if (
    latest &&
    typeof (latest as Record<string, unknown>).appointmentNo === "string"
  ) {
    const lastPart = (
      (latest as Record<string, unknown>).appointmentNo as string
    ).replace(prefix, "");
    const parsed = parseInt(lastPart, 10);

    if (!isNaN(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}
