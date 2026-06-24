import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { NextRequest } from "next/server";

import { getServerEnv } from "@/src/lib/env";
import { Superadmin } from "@/src/models/Superadmin";
import {
  SUPERADMIN_COOKIE_NAME,
  SUPERADMIN_TOKEN_MAX_AGE_SECONDS,
} from "@/src/lib/auth/constants";

export { SUPERADMIN_COOKIE_NAME, SUPERADMIN_TOKEN_MAX_AGE_SECONDS };

export type SuperadminTokenPayload = {
  id: string;
  email: string;
  role: "superadmin";
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signSuperadminToken(payload: SuperadminTokenPayload) {
  const { SUPERADMIN_JWT_SECRET } = getServerEnv();

  return jwt.sign(payload, SUPERADMIN_JWT_SECRET, {
    expiresIn: SUPERADMIN_TOKEN_MAX_AGE_SECONDS,
  });
}

export function verifySuperadminToken(token: string): SuperadminTokenPayload {
  const { SUPERADMIN_JWT_SECRET } = getServerEnv();
  const decoded = jwt.verify(token, SUPERADMIN_JWT_SECRET) as JwtPayload;

  if (
    typeof decoded.id !== "string" ||
    typeof decoded.email !== "string" ||
    decoded.role !== "superadmin"
  ) {
    throw new Error("Invalid superadmin token payload");
  }

  return {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
  };
}

export async function getSuperadminFromRequest(request: NextRequest) {
  const token = request.cookies.get(SUPERADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = verifySuperadminToken(token);
  const superadmin = await Superadmin.findById(payload.id).select(
    "-passwordHash",
  );

  if (!superadmin || !superadmin.isActive) {
    return null;
  }

  return superadmin;
}
