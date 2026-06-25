type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type BusinessHourInput = {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStart: string;
  breakEnd: string;
};

type BookingRulesInput = {
  allowOnlineBooking?: boolean;
  requireApproval?: boolean;
  advanceBookingDays?: number;
  minAdvanceHours?: number;
  slotIntervalMinutes?: number;
  cancellationWindowHours?: number;
  allowWalkIns?: boolean;
};

type NotificationsInput = {
  appointmentConfirmation?: boolean;
  appointmentReminder?: boolean;
  paymentReceipt?: boolean;
  enquiryAlert?: boolean;
  lowStockAlert?: boolean;
  whatsappEnabled?: boolean;
  smsEnabled?: boolean;
  emailEnabled?: boolean;
};

export type UpdateSettingsInput = {
  businessName?: string;
  displayName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  logo?: string;
  description?: string;
  businessHours?: BusinessHourInput[];
  bookingRules?: BookingRulesInput;
  notifications?: NotificationsInput;
};

export function validateUpdateSalonSettingsPayload(
  body: Record<string, unknown>,
): ValidationResult<UpdateSettingsInput> {
  const data: UpdateSettingsInput = {};

  if (body.businessName !== undefined)
    data.businessName = String(body.businessName).trim().slice(0, 200);
  if (body.displayName !== undefined)
    data.displayName = String(body.displayName).trim().slice(0, 200);
  if (body.address !== undefined)
    data.address = String(body.address).trim().slice(0, 500);
  if (body.city !== undefined)
    data.city = String(body.city).trim().slice(0, 100);
  if (body.state !== undefined)
    data.state = String(body.state).trim().slice(0, 100);
  if (body.pincode !== undefined)
    data.pincode = String(body.pincode).trim().slice(0, 20);
  if (body.logo !== undefined)
    data.logo = String(body.logo).trim().slice(0, 500);
  if (body.description !== undefined)
    data.description = String(body.description).trim().slice(0, 1000);

  if (body.phone !== undefined) {
    const phone = String(body.phone).trim();
    if (phone && (phone.length < 7 || phone.length > 20)) {
      return { valid: false, error: "phone must be 7–20 characters." };
    }
    data.phone = phone;
  }

  if (body.email !== undefined) {
    const email = String(body.email).toLowerCase().trim();
    if (email && !EMAIL_REGEX.test(email)) {
      return { valid: false, error: "Invalid email format." };
    }
    data.email = email;
  }

  if (body.businessHours !== undefined && Array.isArray(body.businessHours)) {
    data.businessHours = (body.businessHours as Record<string, unknown>[]).map(
      (h) => ({
        day: String(h.day ?? "").trim(),
        isOpen: h.isOpen === true,
        openTime: String(h.openTime ?? "10:00").trim(),
        closeTime: String(h.closeTime ?? "20:00").trim(),
        breakStart: h.breakStart ? String(h.breakStart).trim() : "",
        breakEnd: h.breakEnd ? String(h.breakEnd).trim() : "",
      }),
    );
  }

  if (body.bookingRules !== undefined && typeof body.bookingRules === "object") {
    const br = body.bookingRules as Record<string, unknown>;
    const rules: BookingRulesInput = {};
    if (br.allowOnlineBooking !== undefined) rules.allowOnlineBooking = br.allowOnlineBooking === true;
    if (br.requireApproval !== undefined) rules.requireApproval = br.requireApproval === true;
    if (br.allowWalkIns !== undefined) rules.allowWalkIns = br.allowWalkIns === true;
    if (br.advanceBookingDays !== undefined) {
      const v = Number(br.advanceBookingDays);
      if (isNaN(v) || v < 0 || v > 365) return { valid: false, error: "advanceBookingDays must be 0–365." };
      rules.advanceBookingDays = v;
    }
    if (br.minAdvanceHours !== undefined) {
      const v = Number(br.minAdvanceHours);
      if (isNaN(v) || v < 0 || v > 168) return { valid: false, error: "minAdvanceHours must be 0–168." };
      rules.minAdvanceHours = v;
    }
    if (br.slotIntervalMinutes !== undefined) {
      const v = Number(br.slotIntervalMinutes);
      if (isNaN(v) || v < 5 || v > 240) return { valid: false, error: "slotIntervalMinutes must be 5–240." };
      rules.slotIntervalMinutes = v;
    }
    if (br.cancellationWindowHours !== undefined) {
      const v = Number(br.cancellationWindowHours);
      if (isNaN(v) || v < 0 || v > 168) return { valid: false, error: "cancellationWindowHours must be 0–168." };
      rules.cancellationWindowHours = v;
    }
    data.bookingRules = rules;
  }

  if (body.notifications !== undefined && typeof body.notifications === "object") {
    const n = body.notifications as Record<string, unknown>;
    const notif: NotificationsInput = {};
    if (n.appointmentConfirmation !== undefined) notif.appointmentConfirmation = n.appointmentConfirmation === true;
    if (n.appointmentReminder !== undefined) notif.appointmentReminder = n.appointmentReminder === true;
    if (n.paymentReceipt !== undefined) notif.paymentReceipt = n.paymentReceipt === true;
    if (n.enquiryAlert !== undefined) notif.enquiryAlert = n.enquiryAlert === true;
    if (n.lowStockAlert !== undefined) notif.lowStockAlert = n.lowStockAlert === true;
    if (n.whatsappEnabled !== undefined) notif.whatsappEnabled = n.whatsappEnabled === true;
    if (n.smsEnabled !== undefined) notif.smsEnabled = n.smsEnabled === true;
    if (n.emailEnabled !== undefined) notif.emailEnabled = n.emailEnabled === true;
    data.notifications = notif;
  }

  return { valid: true, data };
}
