import { connectDB } from "@/src/lib/db";
import { resolveSalonFromRequest } from "@/src/lib/tenant/resolve-salon";
import {
  getSalonAccessTokenFromRequest,
  verifySalonAccessToken,
} from "@/src/lib/auth/salon-auth";
import {
  mapBackendSalonRoleToFrontend,
  sanitizeSalonUser,
  hasSalonRole,
  type FrontendSalonRole,
} from "@/src/lib/auth/salon-permissions";
import { SalonUser } from "@/src/models/SalonUser";
import type { SalonUserRole } from "@/src/constants/salon";

export type SalonAuthResult =
  | {
      success: true;
      salon: Record<string, unknown>;
      user: Record<string, unknown>;
      backendRole: SalonUserRole;
      frontendRole: FrontendSalonRole;
    }
  | {
      success: false;
      error: string;
      status: number;
      code?: "TOKEN_EXPIRED";
    };

type RequireSalonUserOptions = {
  allowedRoles?: FrontendSalonRole[];
  requireActiveUser?: boolean;
};

export async function requireSalonUser(
  request: Request,
  options: RequireSalonUserOptions = {},
): Promise<SalonAuthResult> {
  const { allowedRoles, requireActiveUser = true } = options;

  await connectDB();

  // 1. Resolve salon from x-salon-id header
  const salonResult = await resolveSalonFromRequest(request);
  if (!salonResult.success) {
    return {
      success: false,
      error: salonResult.error,
      status: salonResult.status,
    };
  }

  const headerSalonId = salonResult.salon.salonId as string;

  // 2. Extract and verify access token
  const token = getSalonAccessTokenFromRequest(request);
  if (!token) {
    return { success: false, error: "Unauthorized.", status: 401 };
  }

  const result = verifySalonAccessToken(token);
  if (!result.valid) {
    if (result.expired) {
      return {
        success: false,
        error: "Access token expired.",
        status: 401,
        code: "TOKEN_EXPIRED",
      };
    }
    return { success: false, error: "Invalid token.", status: 401 };
  }

  const payload = result.payload;

  // 3. Ensure token salonId matches header salonId
  if (payload.salonId !== headerSalonId) {
    return {
      success: false,
      error: "Token does not match salon.",
      status: 403,
    };
  }

  // 4. Fetch user from DB (exclude passwordHash and refreshTokenId)
  const user = await SalonUser.findOne({
    _id: payload.userId,
    salonId: headerSalonId,
  })
    .select("-passwordHash -refreshTokenId")
    .lean();

  if (!user) {
    return { success: false, error: "User not found.", status: 401 };
  }

  const userObj = user as Record<string, unknown>;

  // 5. Check active status
  if (requireActiveUser && userObj.isActive === false) {
    return {
      success: false,
      error: "User account is inactive.",
      status: 403,
    };
  }

  // 6. Map role
  const backendRole = userObj.role as SalonUserRole;
  const frontendRole = mapBackendSalonRoleToFrontend(backendRole);

  // 7. Check allowed roles
  if (allowedRoles && !hasSalonRole(frontendRole, allowedRoles)) {
    return { success: false, error: "Permission denied.", status: 403 };
  }

  return {
    success: true,
    salon: salonResult.salon,
    user: sanitizeSalonUser(userObj),
    backendRole,
    frontendRole,
  };
}
