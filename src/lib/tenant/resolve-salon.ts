import { connectDB } from "@/src/lib/db";
import { Salon } from "@/src/models/Salon";

type ResolveSalonResult =
  | { success: true; salon: Record<string, unknown> }
  | { success: false; error: string; status: number };

export async function resolveSalonFromRequest(
  request: Request,
): Promise<ResolveSalonResult> {
  const salonId = request.headers.get("x-salon-id");

  if (!salonId) {
    return { success: false, error: "Missing x-salon-id header.", status: 400 };
  }

  await connectDB();

  const salon = await Salon.findOne({ salonId }).lean();

  if (!salon) {
    return { success: false, error: "Salon not found.", status: 404 };
  }

  const salonObj = salon as Record<string, unknown>;

  if (salonObj.accountStatus === "cancelled") {
    return {
      success: false,
      error: "Salon account has been cancelled.",
      status: 403,
    };
  }

  if (
    salonObj.accountStatus !== "active" &&
    salonObj.accountStatus !== "trial"
  ) {
    return {
      success: false,
      error: "Salon account is not active.",
      status: 403,
    };
  }

  return { success: true, salon: salonObj };
}
