import type { Request, Response } from "express";
import { getAdminClient } from "../lib/supabase";
import { HttpError } from "../lib/errors";
import { verifyWebhookSignature } from "../services/razorpay.service";

interface RazorpayWebhookBody {
  event: string;
  payload: {
    payment?: { entity: { id: string; order_id: string; status: string } };
    refund?: { entity: { id: string; payment_id: string; status: string } };
  };
}

export async function razorpayWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.header("x-razorpay-signature");
  const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    throw new HttpError(401, "invalid_signature", "Invalid Razorpay webhook signature");
  }
  const event = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) as RazorpayWebhookBody;
  const admin = getAdminClient();

  if (event.event === "payment.captured") {
    const payment = event.payload.payment?.entity;
    if (payment) {
      await admin
        .from("payments")
        .update({ status: "captured", razorpay_payment_id: payment.id })
        .eq("razorpay_order_id", payment.order_id);
      await admin
        .from("bookings")
        .update({ status: "confirmed", razorpay_payment_id: payment.id })
        .eq("razorpay_order_id", payment.order_id);
    }
  }

  if (event.event === "refund.processed") {
    const refund = event.payload.refund?.entity;
    if (refund) {
      await admin
        .from("payments")
        .update({ status: "refunded" })
        .eq("razorpay_payment_id", refund.payment_id);
    }
  }

  res.json({ accepted: true });
}
