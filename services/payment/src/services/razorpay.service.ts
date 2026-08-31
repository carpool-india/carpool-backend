import crypto from "node:crypto";
import Razorpay from "razorpay";
import { loadEnv } from "../lib/env";
import { HttpError } from "../lib/errors";

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

function client(): Razorpay {
  const env = loadEnv();
  return new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
}

export async function createEscrowOrder(
  bookingId: string,
  amountPaise: number
): Promise<RazorpayOrder> {
  if (amountPaise < 100) {
    throw new HttpError(400, "bad_request", "Amount must be at least ₹1");
  }
  const order = await client().orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: bookingId.slice(0, 40),
    notes: { bookingId, product: "rideshare_india_escrow" },
    payment_capture: false,
  });
  return {
    id: String(order.id),
    amount: Number(order.amount),
    currency: String(order.currency),
    receipt: String(order.receipt),
    status: String(order.status),
  };
}

export function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const env = loadEnv();
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(signature);
  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

export async function capturePayment(paymentId: string, amountPaise: number): Promise<void> {
  await client().payments.capture(paymentId, amountPaise, "INR");
}

export async function fetchCapturedPayment(orderId: string): Promise<{ paymentId: string; status: string } | null> {
  const payload = (await client().orders.fetchPayments(orderId)) as {
    items?: Array<{ id: string; status: string }>;
  };
  const captured = payload.items?.find((item) => item.status === "captured" || item.status === "authorized");
  if (!captured) {
    return null;
  }
  return { paymentId: captured.id, status: captured.status };
}

export async function refundPayment(paymentId: string, amountPaise?: number): Promise<string> {
  const refund = await client().payments.refund(paymentId, {
    amount: amountPaise,
    notes: { reason: "rideshare_auto_refund" },
  });
  return String(refund.id);
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const env = loadEnv();
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(signature);
  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}
