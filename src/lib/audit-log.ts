import { AuditLog } from "@/src/models/AuditLog";
import type { AuditLogInput } from "@/src/types/superadmin";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordHash",
  "token",
  "jwt",
  "secret",
  "SUPERADMIN_JWT_SECRET",
  "SALON_JWT_SECRET",
  "MONGODB_URI",
  "accessToken",
  "refreshToken",
]);

export function sanitizeAuditData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(sanitizeAuditData);
  }

  const obj = data as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeAuditData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    let ip = "";
    let userAgent = "";

    if (input.request) {
      ip =
        input.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        input.request.headers.get("x-real-ip") ??
        "";
      userAgent = input.request.headers.get("user-agent") ?? "";
    }

    await AuditLog.create({
      actorType: input.actorType,
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: sanitizeAuditData(input.before) ?? null,
      after: sanitizeAuditData(input.after) ?? null,
      ip,
      userAgent,
    });
  } catch (error) {
    console.error("Audit log creation failed:", (error as Error).message);
  }
}
