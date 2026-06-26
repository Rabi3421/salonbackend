import type {
  SalonCurrentSubscription,
  SalonDashboardMeta,
  SalonSubscriptionPaymentsResponse,
} from "@/src/types/salon-frontend";

type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

export class SalonApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SalonApiError";
    this.status = status;
  }
}

function salonHeaders(headers?: HeadersInit) {
  const merged: Record<string, string> = { "Content-Type": "application/json" };
  const salonId = process.env.NEXT_PUBLIC_SALON_ID;
  if (salonId) merged["x-salon-id"] = salonId;

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      merged[key] = value;
    });
  } else if (Array.isArray(headers)) {
    for (const [key, value] of headers) merged[key] = value;
  } else if (headers) {
    Object.assign(merged, headers);
  }

  return merged;
}

async function salonRequest<T>(url: string, options?: RequestInit) {
  let res: Response;

  try {
    res = await fetch(url, {
      credentials: "include",
      ...options,
      headers: salonHeaders(options?.headers),
    });
  } catch {
    throw new SalonApiError("Network error. Please check your connection.", 0);
  }

  const json = (await res.json().catch(() => ({
    success: false,
    message: "Unexpected response from server.",
  }))) as ApiResponse<T>;

  if (res.status === 401 && typeof window !== "undefined") {
    const next = encodeURIComponent(window.location.pathname);
    window.location.assign(`/salon/login?next=${next}`);
  }

  if (!res.ok || !json.success) {
    throw new SalonApiError(json.message || "Something went wrong.", res.status);
  }

  return json;
}

export function fetchSalonDashboardMeta() {
  return salonRequest<SalonDashboardMeta>("/api/salon/dashboard/meta");
}

export function fetchCurrentSubscription() {
  return salonRequest<SalonCurrentSubscription>("/api/salon/subscription/current");
}

export function fetchSubscriptionPayments(params?: { page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();

  return salonRequest<SalonSubscriptionPaymentsResponse>(
    `/api/salon/subscription/payments${query ? `?${query}` : ""}`,
  );
}
