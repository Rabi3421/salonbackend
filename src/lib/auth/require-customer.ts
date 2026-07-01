import { connectDB } from "@/src/lib/db";
import {
  getCustomerAccessTokenFromRequest,
  verifyCustomerAccessToken,
} from "@/src/lib/auth/customer-auth";
import { resolveSalonFromRequest } from "@/src/lib/tenant/resolve-salon";
import { SalonCustomer } from "@/src/models/SalonCustomer";

type RequireCustomerResult =
  | {
      success: true;
      customer: Record<string, unknown>;
      salon: Record<string, unknown>;
      salonId: string;
    }
  | { success: false; error: string; status: number };

export async function requireCustomer(
  request: Request,
): Promise<RequireCustomerResult> {
  const salonResult = await resolveSalonFromRequest(request);
  if (!salonResult.success) {
    return {
      success: false,
      error: salonResult.error,
      status: salonResult.status,
    };
  }

  const token = getCustomerAccessTokenFromRequest(request);
  if (!token) {
    return { success: false, error: "Customer login required.", status: 401 };
  }

  const verified = verifyCustomerAccessToken(token);
  if (!verified.valid) {
    return {
      success: false,
      error: verified.expired ? "Customer session expired." : "Invalid customer session.",
      status: 401,
    };
  }

  const salonId = String(salonResult.salon.salonId ?? "");
  if (verified.payload.salonId !== salonId) {
    return { success: false, error: "Invalid customer session.", status: 401 };
  }

  await connectDB();

  const customer = await SalonCustomer.findOne({
    _id: verified.payload.customerId,
    salonId,
    hasAccount: true,
  }).lean();

  if (!customer) {
    return { success: false, error: "Customer account not found.", status: 404 };
  }

  if (customer.status === "blocked") {
    return { success: false, error: "This customer account is blocked.", status: 403 };
  }

  return {
    success: true,
    customer: customer as Record<string, unknown>,
    salon: salonResult.salon,
    salonId,
  };
}
