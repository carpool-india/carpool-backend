import type { Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "../lib/errors";
import { createUserClient } from "../lib/supabase";
import type { AuthedRequest } from "../middleware/authenticate";
import { verifySignature } from "../services/razorpay.service";
import {
  activateSubscription,
  createSubscriptionOrder as createSubscriptionOrderService,
  listMySubscriptions,
  pollSubscriptionStatus,
} from "../services/subscription.service";

const orderSchema = z.object({
  planType: z.enum(["driver_local", "driver_outstation", "passenger"]),
  cadence: z.enum(["weekly", "monthly"]),
});

const verifySchema = z.object({
  subscriptionId: z.string().uuid(),
  razorpayOrderId: z.string().min(6),
  razorpayPaymentId: z.string().min(6),
  razorpaySignature: z.string().min(10),
});

async function resolveAppUserId(client: ReturnType<typeof createUserClient>, supabaseAuthId: string): Promise<string> {
  const { data, error } = await client
    .from("users")
    .select("id")
    .eq("supabase_auth_id", supabaseAuthId)
    .maybeSingle();
  if (error || !data) {
    throw new HttpError(403, "forbidden", "No RideShare profile is linked to this session");
  }
  return data.id as string;
}

export async function createSubscriptionOrder(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const input = orderSchema.parse(req.body);
  const client = createUserClient(authed.accessToken);
  const userId = await resolveAppUserId(client, authed.authUserId);
  const result = await createSubscriptionOrderService(client, userId, input.planType, input.cadence);
  res.status(201).json(result);
}

export async function verifySubscriptionPayment(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const input = verifySchema.parse(req.body);
  if (!verifySignature(input.razorpayOrderId, input.razorpayPaymentId, input.razorpaySignature)) {
    throw new HttpError(400, "invalid_signature", "Razorpay signature mismatch");
  }
  const client = createUserClient(authed.accessToken);
  const userId = await resolveAppUserId(client, authed.authUserId);
  const result = await activateSubscription(client, userId, input.subscriptionId, input.razorpayPaymentId);
  res.json({ status: "active", ...result });
}

export async function getMySubscriptions(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const client = createUserClient(authed.accessToken);
  const userId = await resolveAppUserId(client, authed.authUserId);
  const subscriptions = await listMySubscriptions(client, userId);
  res.json({ subscriptions });
}

export async function getSubscriptionStatus(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const subscriptionId = z.string().uuid().parse(req.query.subscriptionId);
  const client = createUserClient(authed.accessToken);
  const userId = await resolveAppUserId(client, authed.authUserId);
  const result = await pollSubscriptionStatus(client, userId, subscriptionId);
  res.json(result);
}
