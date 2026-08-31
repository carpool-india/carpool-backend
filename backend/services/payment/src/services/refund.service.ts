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
  const refundId = await refundPayment(
    booking.razorpay_payment_id as string,
    amountPaise ?? Math.round(Number(booking.total_amount) * 100)
  );
  await client.from("payments").insert({
    booking_id: bookingId,
    payer_id: (await payerId(client, bookingId)),
    amount: (amountPaise ?? Math.round(Number(booking.total_amount) * 100)) / 100,
    service_fee: 0,
    provider: "razorpay",
    type: "refund",
    status: "refunded",
    razorpay_payment_id: booking.razorpay_payment_id,
  });
  await client.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
  return { refundId: `${refundId}:${reason}` };
}

async function payerId(client: SupabaseClient, bookingId: string): Promise<string> {
  const { data } = await client.from("bookings").select("passenger_id").eq("id", bookingId).single();
  return data?.passenger_id as string;
}
