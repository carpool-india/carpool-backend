import path from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../../../.env"), override: true });
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { z } from "zod";
import { loadEnv } from "./lib/env";
import { HttpError } from "./lib/errors";
import { authenticate } from "./middleware/authenticate";
import { validate } from "./middleware/validate";
import { createOrder, pollOrderStatus, refund, verifyPayment } from "./routes/payment.routes";
import {
  createSubscriptionOrder,
  getMySubscriptions,
  getSubscriptionStatus,
  verifySubscriptionPayment,
} from "./routes/subscription.routes";
import { createTripBondOrder, getTripBondStatus } from "./routes/tripBond.routes";
import { adminRouter } from "./routes/admin.routes";
import { razorpayWebhook } from "./webhooks/razorpay.webhook";

const env = process.env.NODE_ENV === "test" ? null : loadEnv();
const app = express();

app.use(helmet());
// CORS_ORIGIN unset -> permissive (current/dev behavior). Set it once the console's
// domain is known to restrict browser access to just that origin; mobile isn't
// subject to CORS so this never affects the app.
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin.split(",").map((value) => value.trim()) } : undefined));
app.post(
  "/webhooks/razorpay",
  express.raw({ type: "application/json" }),
  (req, _res, next) => {
    if (Buffer.isBuffer(req.body)) {
      req.body = req.body.toString("utf8");
    }
    next();
  },
  (req, res, next) => {
    razorpayWebhook(req, res).catch(next);
  }
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "payment", ts: Date.now() });
});

const orderSchema = z.object({ bookingId: z.string().uuid() });
const verifySchema = z.object({
  bookingId: z.string().uuid(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});
const refundSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().min(3),
  amountPaise: z.number().int().positive().optional(),
});
const subscriptionOrderSchema = z.object({
  planType: z.enum(["driver_local", "driver_outstation", "passenger"]),
  cadence: z.enum(["weekly", "monthly"]),
});
const subscriptionVerifySchema = z.object({
  subscriptionId: z.string().uuid(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

app.post("/order", authenticate, validate(orderSchema), (req, res, next) => {
  createOrder(req, res).catch(next);
});
app.post("/verify", authenticate, validate(verifySchema), (req, res, next) => {
  verifyPayment(req, res).catch(next);
});
app.post("/refund", authenticate, validate(refundSchema), (req, res, next) => {
  refund(req, res).catch(next);
});
app.get("/status", authenticate, (req, res, next) => {
  pollOrderStatus(req, res).catch(next);
});
app.post("/subscriptions/order", authenticate, validate(subscriptionOrderSchema), (req, res, next) => {
  createSubscriptionOrder(req, res).catch(next);
});
app.post("/subscriptions/verify", authenticate, validate(subscriptionVerifySchema), (req, res, next) => {
  verifySubscriptionPayment(req, res).catch(next);
});
app.get("/subscriptions/me", authenticate, (req, res, next) => {
  getMySubscriptions(req, res).catch(next);
});
app.get("/subscriptions/status", authenticate, (req, res, next) => {
  getSubscriptionStatus(req, res).catch(next);
});
app.post("/trip-bond/order", authenticate, validate(z.object({ tripId: z.string().uuid() })), (req, res, next) => {
  createTripBondOrder(req, res).catch(next);
});
app.get("/trip-bond/status", authenticate, (req, res, next) => {
  getTripBondStatus(req, res).catch(next);
});
app.use("/admin", adminRouter);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code, message: error.message });
    return;
  }
  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({ error: "internal_error", message });
});

if (env) {
  app.listen(env.PAYMENT_SERVICE_PORT, () => {
    console.log(`payment service listening on ${env.PAYMENT_SERVICE_PORT}`);
  });
}

export { app };
