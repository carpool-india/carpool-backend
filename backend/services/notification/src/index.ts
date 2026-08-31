import path from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { loadEnv } from "./lib/env";
import { createUserClient, getAdminClient } from "./lib/supabase";
import { sendPush } from "./services/fcm.service";
import { sendSms } from "./services/sms.service";
import { requestLoginOtp, verifyLoginOtp } from "./services/loginOtp.service";
import { dispatchSos } from "./services/sos.service";
import { sendBookingCard } from "./services/whatsapp.service";

const app = express();
// Behind ngrok in dev and a reverse proxy/load balancer in production — trust one hop
// so rate limiting keys off the real client IP (X-Forwarded-For) instead of the proxy.
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors());
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});
app.use(express.json({ limit: "1mb" }));

const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limited", message: "Too many OTP requests from this network. Try again later." },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limited", message: "Too many verification attempts from this network. Try again later." },
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "notification", ts: Date.now() });
});

const pushSchema = z.object({
  token: z.string().min(10),
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.string()).optional(),
  highPriority: z.boolean().optional(),
});

const smsSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
  message: z.string().min(1),
});

const otpRequestSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
});

const otpVerifySchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
  otp: z.string().regex(/^\d{6}$/),
});

const bookingCardSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
  passengerName: z.string(),
  origin: z.string(),
  destination: z.string(),
  departure: z.string(),
  driverName: z.string(),
  vehicle: z.string(),
  amount: z.string(),
});

const sosSchema = z.object({
  userName: z.string(),
  userPhone: z.string(),
  lat: z.number(),
  lng: z.number(),
  tripId: z.string().uuid(),
  emergencyContacts: z.array(z.object({ name: z.string(), phone: z.string() })),
  adminFcmTokens: z.array(z.string()),
  userFcmToken: z.string().optional(),
});

app.post("/push/register", async (req, res, next) => {
  try {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ error: "unauthorized", message: "Missing bearer token" });
      return;
    }
    const input = z.object({
      token: z.string().min(10),
      platform: z.enum(["ios", "android", "unknown"]).optional().default("unknown"),
    }).parse(req.body);
    const accessToken = header.slice(7).trim();
    const { data: authData, error: authError } = await getAdminClient().auth.getUser(accessToken);
    if (authError || !authData.user) {
      res.status(401).json({ error: "unauthorized", message: "Invalid session" });
      return;
    }
    const client = createUserClient(accessToken);
    const { data: user } = await client
      .from("users")
      .select("id")
      .eq("supabase_auth_id", authData.user.id)
      .maybeSingle();
    if (!user) {
      res.status(403).json({ error: "forbidden", message: "Profile not found" });
      return;
    }
    await client.from("device_tokens").upsert(
      { user_id: user.id, token: input.token, platform: input.platform },
      { onConflict: "user_id,token" }
    );
    res.json({ registered: true });
  } catch (error) {
    next(error);
  }
});

app.post("/push", async (req, res, next) => {
  try {
    const input = pushSchema.parse(req.body);
    const id = await sendPush(input);
    res.json({ id });
  } catch (error) {
    next(error);
  }
});

app.post("/sms", async (req, res, next) => {
  try {
    const input = smsSchema.parse(req.body);
    await sendSms(input.phone, input.message);
    res.json({ sent: true });
  } catch (error) {
    next(error);
  }
});

app.post("/whatsapp/booking", async (req, res, next) => {
  try {
    const input = bookingCardSchema.parse(req.body);
    await sendBookingCard(input.phone, input);
    res.json({ sent: true });
  } catch (error) {
    next(error);
  }
});

app.post("/sos", async (req, res, next) => {
  try {
    const input = sosSchema.parse(req.body);
    const result = await dispatchSos(input);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/auth/otp/request", otpRequestLimiter, async (req, res, next) => {
  try {
    const input = otpRequestSchema.parse(req.body);
    await requestLoginOtp(input.phone);
    res.json({ sent: true });
  } catch (error) {
    next(error);
  }
});

app.post("/auth/otp/verify", otpVerifyLimiter, async (req, res, next) => {
  try {
    const input = otpVerifySchema.parse(req.body);
    const session = await verifyLoginOtp(input.phone, input.otp);
    res.json({ session });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(400).json({ error: "request_failed", message });
});

if (process.env.NODE_ENV !== "test") {
  const env = loadEnv();
  app.listen(env.NOTIFICATION_SERVICE_PORT, () => {
    console.log(`notification service listening on ${env.NOTIFICATION_SERVICE_PORT}`);
  });
}

export { app };
