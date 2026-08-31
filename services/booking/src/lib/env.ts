import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BOOKING_SERVICE_PORT: z.coerce.number().default(3002),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  MATCHING_SERVICE_URL: z.string().url().default("http://localhost:8001"),
  PAYMENT_SERVICE_URL: z.string().url().default("http://localhost:3003"),
  NOTIFICATION_SERVICE_URL: z.string().url().default("http://localhost:3005"),
  GOOGLE_MAPS_API_KEY: z.string().optional().default(""),
  HYPERVERGE_APP_ID: z.string().optional().default(""),
  HYPERVERGE_APP_KEY: z.string().optional().default(""),
  CENTRIFUGO_API_URL: z.string().url().default("http://localhost:8010"),
  CENTRIFUGO_API_KEY: z.string().min(1),
  CENTRIFUGO_TOKEN_HMAC_SECRET: z.string().min(1),
});

export type BookingEnv = z.infer<typeof envSchema>;

export function loadEnv(overrides: Record<string, string | undefined> = {}): BookingEnv {
  return envSchema.parse({ ...process.env, ...overrides });
}
