type ServerEnv = {
  MONGODB_URI: string;
  SUPERADMIN_JWT_SECRET: string;
  SALON_JWT_SECRET: string;
  SUPERADMIN_NAME: string;
  SUPERADMIN_EMAIL: string;
  SUPERADMIN_PHONE: string;
  SUPERADMIN_PASSWORD: string;
  NODE_ENV: string;
};

export type PublicEnv = {
  NEXT_PUBLIC_APP_NAME: string;
  NEXT_PUBLIC_API_URL: string;
};

function readRequiredEnv(key: keyof ServerEnv): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required server environment variable: ${key}`);
  }

  return value;
}

export function getServerEnv(): ServerEnv {
  return {
    MONGODB_URI: readRequiredEnv("MONGODB_URI"),
    SUPERADMIN_JWT_SECRET: readRequiredEnv("SUPERADMIN_JWT_SECRET"),
    SALON_JWT_SECRET: readRequiredEnv("SALON_JWT_SECRET"),
    SUPERADMIN_NAME: readRequiredEnv("SUPERADMIN_NAME"),
    SUPERADMIN_EMAIL: readRequiredEnv("SUPERADMIN_EMAIL"),
    SUPERADMIN_PHONE: readRequiredEnv("SUPERADMIN_PHONE"),
    SUPERADMIN_PASSWORD: readRequiredEnv("SUPERADMIN_PASSWORD"),
    NODE_ENV: process.env.NODE_ENV ?? "development",
  };
}

export function getPublicEnv(): PublicEnv {
  return {
    NEXT_PUBLIC_APP_NAME:
      process.env.NEXT_PUBLIC_APP_NAME ?? "Salon Management",
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "",
  };
}
