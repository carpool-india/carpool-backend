import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    SAFETY_SERVICE_PORT: z.coerce.number().default(3006),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(20),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
    NOTIFICATION_SERVICE_URL: z.string().url().default("http://localhost:3005"),
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
