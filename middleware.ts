import { NextResponse, type NextRequest } from "next/server";

import { SUPERADMIN_COOKIE_NAME } from "@/src/lib/auth/constants";

function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  return atob(padded);
}

function bytesToBase64Url(bytes: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(bytes));

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function verifyHs256Jwt(token: string, secret: string) {
  const [encodedHeader, encodedPayload, signature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !signature) {
    return false;
  }

  const header = JSON.parse(base64UrlDecode(encodedHeader)) as {
    alg?: string;
    typ?: string;
  };

  if (header.alg !== "HS256") {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expectedSignature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
  );

  if (bytesToBase64Url(expectedSignature) !== signature) {
    return false;
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as {
    exp?: number;
    role?: string;
  };

  if (payload.role !== "superadmin") {
    return false;
  }

  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return false;
  }

  return true;
}

function unauthorizedApiResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Unauthorized.",
    },
    { status: 401 },
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isSuperadminApi = pathname.startsWith("/api/superadmin");
  const isSuperadminDashboard = pathname.startsWith("/superadmin/dashboard");
  const isPublicAuthApi =
    pathname === "/api/superadmin/auth/login" ||
    pathname === "/api/superadmin/auth/logout" ||
    pathname === "/api/superadmin/auth/me";

  if (!isSuperadminApi && !isSuperadminDashboard) {
    return NextResponse.next();
  }

  if (isPublicAuthApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SUPERADMIN_COOKIE_NAME)?.value;
  const secret = process.env.SUPERADMIN_JWT_SECRET;
  const isValidToken =
    Boolean(token && secret) && (await verifyHs256Jwt(token!, secret!));

  if (isValidToken) {
    return NextResponse.next();
  }

  if (isSuperadminApi) {
    return unauthorizedApiResponse();
  }

  const loginUrl = new URL("/", request.url);
  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/superadmin/dashboard/:path*", "/api/superadmin/:path*"],
};
