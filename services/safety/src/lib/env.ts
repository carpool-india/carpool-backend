import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SAFETY_SERVICE_PORT: z.coerce.number().default(3006),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  NOTIFICATION_SERVICE_URL: z.string().url().default("http://localhost:3005"),
});

export function loadEnv() {
  return envSchema.parse(process.env);
}
