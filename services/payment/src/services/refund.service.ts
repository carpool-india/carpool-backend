import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../lib/errors";
import { refundPayment } from "./razorpay.service";

export async function refundBooking(
  client: SupabaseClient,
  bookingId: string,
  reason: string,
  amountPaise?: number
): Promise<{ refundId: string }> {
  const { data: booking, error } = await client
    .from("bookings")
    .select("id, razorpay_payment_id, total_amount, status")
    .eq("id", bookingId)
    .maybeSingle();
  if (error || !booking) {
    throw new HttpError(404, "not_found", "Booking not found");
  }
  if (!booking.razorpay_payment_id) {
    throw new HttpError(409, "conflict", "No captured payment to refund");
  }
  // Guard against double-refunding a booking (retry, double-tap, or two admins
  // acting at once). A SELECT-then-call-Razorpay-then-INSERT order (the first
  // version of this fix) still let two concurrent requests both pass the check
  // and both call Razorpay before either INSERT landed — the unique index only
  // protects the database row, not the external call. Claiming the row FIRST
  // (before Razorpay is ever called) makes the INSERT itself the lock: only one
  // concurrent request can win it, and the loser never touches Razorpay at all.
  const refundAmountPaise = amountPaise ?? Math.round(Number(booking.total_amount) * 100);
  const { data: claim, error: claimError } = await client
    .from("payments")
    .insert({
      booking_id: bookingId,
      payer_id: await payerId(client, bookingId),
      amount: refundAmountPaise / 100,
      service_fee: 0,
      provider: "razorpay",
      type: "refund",
      status: "refunded",
      razorpay_payment_id: null,
    })
    .select("id")
    .single();
  if (claimError) {
    if (claimError.code === "23505") {
      // Lost the race (or this booking was already refunded earlier): a refund
      // row already exists for this booking. Fetch it instead of calling
      // Razorpay again — the winner may not have filled in razorpay_payment_id
      // yet, so this can legitimately report "in progress".
      const { data: existingRefund } = await client
        .from("payments")
        .select("razorpay_payment_id")
        .eq("booking_id", bookingId)
        .eq("type", "refund")
        .maybeSingle();
      return { refundId: `${existingRefund?.razorpay_payment_id ?? "pending"}:already_refunded` };
    }
    throw claimError;
  }
  try {
    const refundId = await refundPayment(booking.razorpay_payment_id as string, refundAmountPaise);
    await client.from("payments").update({ razorpay_payment_id: refundId }).eq("id", claim.id);
    await client.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
    return { refundId: `${refundId}:${reason}` };
  } catch (error) {
    // The Razorpay call itself failed after we claimed the slot — release it so
    // a retry isn't permanently blocked by our own claim row.
    await client.from("payments").delete().eq("id", claim.id);
    throw error;
  }
}

async function payerId(client: SupabaseClient, bookingId: string): Promise<string> {
  const { data } = await client.from("bookings").select("passenger_id").eq("id", bookingId).single();
  return data?.passenger_id as string;
}
