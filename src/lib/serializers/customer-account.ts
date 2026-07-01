function asIso(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function asNumber(value: unknown): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

export function serializeCustomerAccount(customer: Record<string, unknown>) {
  return {
    id: String(customer._id ?? customer.id ?? ""),
    role: "end_user",
    customerNo: String(customer.customerNo ?? ""),
    name: String(customer.name ?? ""),
    phone: String(customer.phone ?? ""),
    email: String(customer.email ?? ""),
    gender: String(customer.gender ?? "not_specified"),
    city: String(customer.city ?? ""),
    status: String(customer.status ?? "active"),
    favoriteServices: Array.isArray(customer.favoriteServices)
      ? customer.favoriteServices.map(String)
      : [],
    preferredStylistName: String(customer.preferredStylistName ?? ""),
    allergies: String(customer.allergies ?? ""),
    hairSkinNotes: String(customer.hairSkinNotes ?? ""),
    marketingConsent: Boolean(customer.marketingConsent),
    totalVisits: asNumber(customer.totalVisits),
    totalSpent: asNumber(customer.totalSpent),
    dueAmount: asNumber(customer.dueAmount),
    lastVisitAt: asIso(customer.lastVisitAt),
    nextAppointmentAt: asIso(customer.nextAppointmentAt),
    accountCreatedAt: asIso(customer.accountCreatedAt),
    lastLoginAt: asIso(customer.lastLoginAt),
  };
}
