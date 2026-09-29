import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().min(1).default("7d"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://localhost:8080,http://localhost:3000"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("[env] Invalid environment configuration:");
  for (const [key, errors] of Object.entries(parsed.error.flatten().fieldErrors)) {
    console.error(`  - ${key}: ${(errors ?? []).join(", ")}`);
  }
  console.error("[env] Copy server/.env.example to server/.env and fill in the values.");
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  CORS_ORIGINS: raw.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  isProduction: raw.NODE_ENV === "production",
  isTest: raw.NODE_ENV === "test",
};
