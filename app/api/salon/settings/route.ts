import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/src/lib/api-response";
import { requireSalonUser } from "@/src/lib/auth/require-salon-user";
import { validateUpdateSalonSettingsPayload } from "@/src/lib/validators/salon-settings";
import { serializeSalonSettings } from "@/src/lib/serializers/salon-settings";
import { SalonSettings } from "@/src/models/SalonSettings";

async function getOrCreateSettings(
  salonId: string,
  salon: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  let settings = await SalonSettings.findOne({ salonId }).lean();

  if (!settings) {
    const created = await SalonSettings.create({
      salonId,
      businessName: String(salon.name ?? ""),
      displayName: String(salon.name ?? ""),
      phone: String(salon.ownerPhone ?? ""),
      email: String(salon.ownerEmail ?? ""),
      address: String(salon.address ?? ""),
      city: String(salon.city ?? ""),
      state: String(salon.state ?? ""),
      pincode: String(salon.pincode ?? ""),
    });
    settings = created.toObject();
  }

  return settings as Record<string, unknown>;
}

export async function GET(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner", "manager", "receptionist", "accountant"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;
    const settings = await getOrCreateSettings(salonId, auth.salon);

    return successResponse({
      settings: serializeSalonSettings(settings),
    });
  } catch {
    return errorResponse("Unable to fetch settings.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireSalonUser(request, {
      allowedRoles: ["owner"],
    });
    if (!auth.success) return errorResponse(auth.error, auth.status);

    const salonId = auth.salon.salonId as string;

    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateUpdateSalonSettingsPayload(body);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const input = validation.data;

    // Ensure settings document exists
    await getOrCreateSettings(salonId, auth.salon);

    const updates: Record<string, unknown> = {};

    if (input.businessName !== undefined) updates.businessName = input.businessName;
    if (input.displayName !== undefined) updates.displayName = input.displayName;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.email !== undefined) updates.email = input.email;
    if (input.address !== undefined) updates.address = input.address;
    if (input.city !== undefined) updates.city = input.city;
    if (input.state !== undefined) updates.state = input.state;
    if (input.pincode !== undefined) updates.pincode = input.pincode;
    if (input.logo !== undefined) updates.logo = input.logo;
    if (input.description !== undefined) updates.description = input.description;
    if (input.businessHours !== undefined) updates.businessHours = input.businessHours;
    if (input.bookingRules !== undefined) {
      for (const [key, value] of Object.entries(input.bookingRules)) {
        updates[`bookingRules.${key}`] = value;
      }
    }
    if (input.notifications !== undefined) {
      for (const [key, value] of Object.entries(input.notifications)) {
        updates[`notifications.${key}`] = value;
      }
    }

    const settings = await SalonSettings.findOneAndUpdate(
      { salonId },
      { $set: updates },
      { new: true, runValidators: true },
    ).lean();

    if (!settings) return errorResponse("Settings not found.", 404);

    return successResponse(
      { settings: serializeSalonSettings(settings as Record<string, unknown>) },
      "Settings updated successfully.",
    );
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Invalid JSON request body.", 400);
    return errorResponse("Unable to update settings.", 500);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
