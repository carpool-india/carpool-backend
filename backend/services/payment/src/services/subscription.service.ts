import type { SupabaseClient } from "@supabase/supabase-js";
import { SUBSCRIPTION_PLANS, type SubscriptionCadence, type SubscriptionPlanType } from "@rideshare/types";
import { HttpError } from "../lib/errors";
import { capturePayment, createEscrowOrder, fetchCapturedPayment } from "./razorpay.service";

const CADENCE_MS: Record<SubscriptionCadence, number> = {
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

// Extends from the later of (current expiry, now) so renewing early never wastes
// remaining time on an already-active plan, but a lapsed plan always renews from today.
export function computeNextExpiry(cadence: SubscriptionCadence, currentExpiresAt: string | null, now: Date): string {
  const currentExpiry = currentExpiresAt ? new Date(currentExpiresAt).getTime() : 0;
  const base = Math.max(now.getTime(), currentExpiry);
  return new Date(base + CADENCE_MS[cadence]).toISOString();
}

function findPlan(planType: SubscriptionPlanType, cadence: SubscriptionCadence) {
  const plan = SUBSCRIPTION_PLANS.find((item) => item.planType === planType && item.cadence === cadence);
  if (!plan) {
    throw new HttpError(400, "bad_request", "No such subscription plan");
  }
  return plan;
}

export async function createSubscriptionOrder(
  client: SupabaseClient,
  userId: string,
  planType: SubscriptionPlanType,
  cadence: SubscriptionCadence
): Promise<{ subscriptionId: string; orderId: string; amountPaise: number }> {
  const plan = findPlan(planType, cadence);
  const amountPaise = Math.round(plan.amountInr * 100);

  const { data: subscription, error: insertError } = await client
    .from("subscriptions")
    .insert({
      user_id: userId,
      plan_type: planType,
      cadence,
      amount_inr: plan.amountInr,
      status: "pending",
    })
    .select("id")
    .single<{ id: string }>();
  if (insertError || !subscription) {
    throw new HttpError(400, "bad_request", insertError?.message ?? "Unable to create subscription");
  }

  const order = await createEscrowOrder(subscription.id, amountPaise);
  await client.from("subscriptions").update({ razorpay_order_id: order.id }).eq("id", subscription.id);

  return { subscriptionId: subscription.id, orderId: order.id, amountPaise };
}

interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_type: SubscriptionPlanType;
  cadence: SubscriptionCadence;
  amount_inr: number;
  status: string;
  expires_at: string | null;
  razorpay_order_id: string | null;
}

async function loadOwnSubscription(
  client: SupabaseClient,
  userId: string,
  subscriptionId: string
): Promise<SubscriptionRow> {
  const { data: subscription, error } = await client
    .from("subscriptions")
    .select("id, user_id, plan_type, cadence, amount_inr, status, expires_at, razorpay_order_id")
    .eq("id", subscriptionId)
    .maybeSingle<SubscriptionRow>();
  if (error || !subscription || subscription.user_id !== userId) {
    throw new HttpError(404, "not_found", "Subscription not found");
  }
  return subscription;
}

async function finalizeActivation(
  client: SupabaseClient,
  subscription: SubscriptionRow,
  razorpayPaymentId: string
): Promise<{ expiresAt: string }> {
  const now = new Date();
  const expiresAt = computeNextExpiry(subscription.cadence, subscription.expires_at, now);

  const { error: updateError } = await client
    .from("subscriptions")
    .update({
      status: "active",
      starts_at: now.toISOString(),
      expires_at: expiresAt,
      razorpay_payment_id: razorpayPaymentId,
    })
    .eq("id", subscription.id);
  if (updateError) {
    throw new HttpError(400, "bad_request", updateError.message);
  }

  return { expiresAt };
}

export async function activateSubscription(
  client: SupabaseClient,
  userId: string,
  subscriptionId: string,
  razorpayPaymentId: string
): Promise<{ expiresAt: string }> {
  const subscription = await loadOwnSubscription(client, userId, subscriptionId);
  await capturePayment(razorpayPaymentId, Math.round(subscription.amount_inr * 100));
  return finalizeActivation(client, subscription, razorpayPaymentId);
}

export async function pollSubscriptionStatus(
  client: SupabaseClient,
  userId: string,
  subscriptionId: string
): Promise<{ status: string; expiresAt: string | null }> {
  const subscription = await loadOwnSubscription(client, userId, subscriptionId);
  if (subscription.status === "active" && subscription.expires_at && new Date(subscription.expires_at) > new Date()) {
    return { status: "active", expiresAt: subscription.expires_at };
  }
  if (!subscription.razorpay_order_id) {
    return { status: "pending", expiresAt: null };
  }
  const captured = await fetchCapturedPayment(subscription.razorpay_order_id);
  if (!captured) {
    return { status: "pending", expiresAt: null };
  }
  if (captured.status === "authorized") {
    await capturePayment(captured.paymentId, Math.round(subscription.amount_inr * 100));
  }
  const result = await finalizeActivation(client, subscription, captured.paymentId);
  return { status: "active", expiresAt: result.expiresAt };
}

export async function listMySubscriptions(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new HttpError(400, "bad_request", error.message);
  }
  return data ?? [];
}
