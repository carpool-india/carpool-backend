import { z } from "zod";

const envSchema = z
  .object({
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
    R2_ACCOUNT_ID: z.string().optional().default(""),
    R2_ACCESS_KEY_ID: z.string().optional().default(""),
    R2_SECRET_ACCESS_KEY: z.string().optional().default(""),
    R2_BUCKET: z.string().optional().default(""),
    R2_PUBLIC_BASE_URL: z.string().optional().default(""),
    CENTRIFUGO_API_URL: z.string().url().default("http://localhost:8010"),
    CENTRIFUGO_API_KEY: z.string().min(1),
    CENTRIFUGO_TOKEN_HMAC_SECRET: z.string().min(1),
    CORS_ORIGIN: z.string().optional().default(""),
  })
  .superRefine((val, ctx) => {
    if (val.NODE_ENV !== "production") return;
    // R2 has no code-level fallback (r2.ts just throws an opaque S3/DNS error on
    // first KYC/profile-photo upload) so an unset var must fail fast at boot in
    // production rather than fail on some user's first upload attempt.
    for (const key of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_BASE_URL"] as const) {
      if (!val[key]) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${key} must be set in production`, path: [key] });
      }
    }
    // Unset CORS_ORIGIN makes the cors() middleware permit every origin --
    // fine for local dev, not something that should ever ship silently.
    if (!val.CORS_ORIGIN) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CORS_ORIGIN must be set in production", path: ["CORS_ORIGIN"] });
    }
  });

export type BookingEnv = z.infer<typeof envSchema>;

export function loadEnv(overrides: Record<string, string | undefined> = {}): BookingEnv {
  return envSchema.parse({ ...process.env, ...overrides });
}
