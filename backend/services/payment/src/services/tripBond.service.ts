import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../lib/errors";
import { capturePayment, createEscrowOrder, fetchCapturedPayment } from "./razorpay.service";

export const CANCELLATION_BOND_PAISE = 15000;

interface TripBondRow {
  id: string;
  driver_id: string;
  cancellation_bond_paid: boolean;
}

async function loadOwnTrip(client: SupabaseClient, userId: string, tripId: string): Promise<TripBondRow> {
  const { data: trip, error } = await client
    .from("trips")
    .select("id, driver_id, cancellation_bond_paid")
    .eq("id", tripId)
    .maybeSingle<TripBondRow>();
  if (error || !trip || trip.driver_id !== userId) {
    throw new HttpError(404, "not_found", "Trip not found");
  }
  return trip;
}

export async function createBondOrder(
  client: SupabaseClient,
  userId: string,
  tripId: string
): Promise<{ orderId: string; amountPaise: number }> {
  const trip = await loadOwnTrip(client, userId, tripId);
  if (trip.cancellation_bond_paid) {
    throw new HttpError(409, "conflict", "Cancellation bond is already paid for this trip");
  }

  const order = await createEscrowOrder(tripId, CANCELLATION_BOND_PAISE);
  await client.from("payments").insert({
    trip_id: tripId,
    payer_id: userId,
    amount: CANCELLATION_BOND_PAISE / 100,
    provider: "razorpay",
    type: "cancellation_bond",
    status: "created",
    razorpay_order_id: order.id,
  });
  return { orderId: order.id, amountPaise: CANCELLATION_BOND_PAISE };
}

export async function pollBondStatus(
  client: SupabaseClient,
  userId: string,
  tripId: string
): Promise<{ status: "paid" | "pending" }> {
  const trip = await loadOwnTrip(client, userId, tripId);
  if (trip.cancellation_bond_paid) {
    return { status: "paid" };
  }

  const { data: payment } = await client
    .from("payments")
    .select("razorpay_order_id")
    .eq("trip_id", tripId)
    .eq("type", "cancellation_bond")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ razorpay_order_id: string | null }>();
  if (!payment?.razorpay_order_id) {
    return { status: "pending" };
  }

  const captured = await fetchCapturedPayment(payment.razorpay_order_id);
  if (!captured) {
    return { status: "pending" };
  }
  if (captured.status === "authorized") {
    await capturePayment(captured.paymentId, CANCELLATION_BOND_PAISE);
  }
  await client
    .from("payments")
    .update({ status: "captured", razorpay_payment_id: captured.paymentId })
    .eq("razorpay_order_id", payment.razorpay_order_id);
  await client.from("trips").update({ cancellation_bond_paid: true }).eq("id", tripId);
  return { status: "paid" };
}
