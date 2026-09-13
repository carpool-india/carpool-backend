import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    NOTIFICATION_SERVICE_PORT: z.coerce.number().default(3005),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(20),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
    MSG91_AUTH_KEY: z.string().default(""),
    MSG91_SENDER_ID: z.string().min(3).default("RDSHAR"),
    FAST2SMS_API_KEY: z.string().min(20),
    TWOFACTOR_API_KEY: z.string().default(""),
    GUPSHUP_API_KEY: z.string().default(""),
    GUPSHUP_SOURCE_NUMBER: z.string().default(""),
    GUPSHUP_OTP_TEMPLATE_ID: z.string().default(""),
    CORS_ORIGIN: z.string().optional().default(""),
  })
  // Unset CORS_ORIGIN makes the cors() middleware permit every origin -- fine
  // for local dev, not something that should ever ship silently.
  .superRefine((val, ctx) => {
    if (val.NODE_ENV === "production" && !val.CORS_ORIGIN) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CORS_ORIGIN must be set in production", path: ["CORS_ORIGIN"] });
    }
  });

export function loadEnv() {
  return envSchema.parse(process.env);
}
