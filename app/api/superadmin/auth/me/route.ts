import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { getSuperadminFromRequest } from "@/src/lib/auth/superadmin-auth";
import { connectDB } from "@/src/lib/db";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const superadmin = await getSuperadminFromRequest(request);

    if (!superadmin) {
      return errorResponse("Unauthorized.", 401);
    }

    return successResponse({
      user: {
        id: String(superadmin._id),
        name: superadmin.name,
        email: superadmin.email,
        phone: superadmin.phone,
        role: superadmin.role,
      },
    });
  } catch {
    return errorResponse("Unauthorized.", 401);
  }
}
