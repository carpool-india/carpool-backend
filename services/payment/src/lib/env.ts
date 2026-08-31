import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PAYMENT_SERVICE_PORT: z.coerce.number().default(3003),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  RAZORPAY_KEY_ID: z.string().default(""),
  RAZORPAY_KEY_SECRET: z.string().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(""),
  NOTIFICATION_SERVICE_URL: z.string().url().default("http://localhost:3005"),
});

export type PaymentEnv = z.infer<typeof envSchema>;

export function loadEnv(): PaymentEnv {
  return envSchema.parse(process.env);
}
