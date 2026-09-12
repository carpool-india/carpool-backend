import type { Request, Response } from "express";
import { z } from "zod";
import { loadEnv } from "../lib/env";
import { HttpError } from "../lib/errors";
import { createUserClient } from "../lib/supabase";
import type { AuthedRequest } from "../middleware/authenticate";
import { refundBooking } from "../services/refund.service";
import { capturePayment, createEscrowOrder, fetchCapturedPayment, verifySignature } from "../services/razorpay.service";

const orderSchema = z.object({
  bookingId: z.string().uuid(),
});

const verifySchema = z.object({
  bookingId: z.string().uuid(),
  razorpayOrderId: z.string().min(6),
  razorpayPaymentId: z.string().min(6),
  razorpaySignature: z.string().min(10),
});

const refundSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().min(3).max(240),
  amountPaise: z.number().int().positive().optional(),
});

export async function createOrder(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const { bookingId } = orderSchema.parse(req.body);
  const client = createUserClient(authed.accessToken);
  const { data: booking, error } = await client
    .from("bookings")
    .select("id, service_fee, status, passenger_id, razorpay_order_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (error || !booking) {
    throw new HttpError(404, "not_found", "Booking not found");
  }
  if (booking.status !== "pending") {
    throw new HttpError(409, "conflict", "Booking is not awaiting payment");
  }
  // Only the platform fee is ever charged through the app — the ride fare is
  // settled directly between passenger and driver via UPI/cash.
  const amountPaise = Math.round(Number(booking.service_fee) * 100);
  if (amountPaise <= 0) {
    await client.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);
    res.status(201).json({ orderId: null, amountPaise: 0, currency: "INR", bookingId, alreadyConfirmed: true });
    return;
  }
  // A retried request (double-tap, timed-out response the client never saw) would
  // otherwise create a second Razorpay order + a second `payments` row for the
  // same booking, since status only flips to "confirmed" after verifyPayment.
  // Booking stays "pending" in between, so re-serve the order already on file.
  if (booking.razorpay_order_id) {
    const env = loadEnv();
    res.status(200).json({
      orderId: booking.razorpay_order_id,
      amountPaise,
      currency: "INR",
      keyId: env.RAZORPAY_KEY_ID,
      bookingId,
      alreadyConfirmed: false,
    });
    return;
  }
  const env = loadEnv();
  // Claim the escrow row BEFORE calling Razorpay, not after: the earlier version
  // of this fix called Razorpay first and relied on migration 029's unique index
  // to catch the duplicate INSERT afterward, but that still let two concurrent
  // requests both create a live Razorpay order before either INSERT landed —
  // the DB index protects the row, not the external call. Inserting first makes
  // the INSERT itself the lock, so only one concurrent request ever reaches
  // Razorpay for a given booking.
  const { data: claim, error: claimError } = await client
    .from("payments")
    .insert({
      booking_id: bookingId,
      payer_id: booking.passenger_id,
      amount: amountPaise / 100,
      service_fee: Number(booking.service_fee),
      provider: "razorpay",
      type: "escrow",
      status: "created",
      razorpay_order_id: null,
    })
    .select("id")
    .single();
  if (claimError) {
    if (claimError.code === "23505") {
      // Lost the race: another request already claimed this booking's escrow
      // slot and is (or just finished) creating the real order. Poll briefly
      // for it to land rather than immediately failing the client.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const { data: refreshed } = await client
          .from("bookings")
          .select("razorpay_order_id")
          .eq("id", bookingId)
          .maybeSingle();
        if (refreshed?.razorpay_order_id) {
          res.status(200).json({
            orderId: refreshed.razorpay_order_id,
            amountPaise,
            currency: "INR",
            keyId: env.RAZORPAY_KEY_ID,
            bookingId,
            alreadyConfirmed: false,
          });
          return;
        }
      }
      throw new HttpError(409, "conflict", "Another request is creating this order — try again in a moment");
    }
    throw claimError;
  }
  try {
    const order = await createEscrowOrder(bookingId, amountPaise);
    await client.from("bookings").update({ razorpay_order_id: order.id }).eq("id", bookingId);
    await client.from("payments").update({ razorpay_order_id: order.id }).eq("id", claim.id);
    res.status(201).json({
      orderId: order.id,
      amountPaise: order.amount,
      currency: "INR",
      keyId: env.RAZORPAY_KEY_ID,
      bookingId,
      alreadyConfirmed: false,
    });
  } catch (err) {
    // Razorpay's create-order call itself failed after we claimed the slot —
    // release it so a retry isn't permanently blocked by our own claim row.
    await client.from("payments").delete().eq("id", claim.id);
    throw err;
  }
}

export async function verifyPayment(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const input = verifySchema.parse(req.body);
  if (!verifySignature(input.razorpayOrderId, input.razorpayPaymentId, input.razorpaySignature)) {
    throw new HttpError(400, "invalid_signature", "Razorpay signature mismatch");
  }
  const client = createUserClient(authed.accessToken);
  const { data: booking, error } = await client
    .from("bookings")
    .select("id, total_amount, service_fee, razorpay_order_id")
    .eq("id", input.bookingId)
    .maybeSingle<{
      id: string;
      total_amount: number;
      service_fee: number;
      razorpay_order_id: string | null;
    }>();
  if (error || !booking || booking.razorpay_order_id !== input.razorpayOrderId) {
    throw new HttpError(404, "not_found", "Order does not match booking");
  }
  const chargedPaise = Math.round(Number(booking.service_fee) * 100);
  await capturePayment(input.razorpayPaymentId, chargedPaise);
  await client
    .from("bookings")
    .update({
      razorpay_payment_id: input.razorpayPaymentId,
      status: "confirmed",
    })
    .eq("id", input.bookingId);
  await client
    .from("payments")
    .update({ status: "captured", razorpay_payment_id: input.razorpayPaymentId })
    .eq("razorpay_order_id", input.razorpayOrderId);
  await notifyBookingPaid(client, input.bookingId);
  res.json({ status: "captured" });
}

export async function pollOrderStatus(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const bookingId = z.string().uuid().parse(req.query.bookingId);
  const client = createUserClient(authed.accessToken);
  const { data: booking, error } = await client
    .from("bookings")
    .select("id, status, razorpay_order_id, razorpay_payment_id, service_fee")
    .eq("id", bookingId)
    .maybeSingle();
  if (error || !booking) {
    throw new HttpError(404, "not_found", "Booking not found");
  }
  if (booking.status === "confirmed" && booking.razorpay_payment_id) {
    res.json({ status: "captured", bookingId, paymentId: booking.razorpay_payment_id });
    return;
  }
  if (!booking.razorpay_order_id) {
    res.json({ status: "created", bookingId });
    return;
  }
  const captured = await fetchCapturedPayment(booking.razorpay_order_id as string);
  if (!captured) {
    res.json({ status: "pending", bookingId });
    return;
  }
  if (captured.status === "authorized") {
    const chargedPaise = Math.round(Number(booking.service_fee) * 100);
    await capturePayment(captured.paymentId, chargedPaise);
  }
  await client
    .from("bookings")
    .update({ razorpay_payment_id: captured.paymentId, status: "confirmed" })
    .eq("id", bookingId);
  await client
    .from("payments")
    .update({ status: "captured", razorpay_payment_id: captured.paymentId })
    .eq("razorpay_order_id", booking.razorpay_order_id);
  await notifyBookingPaid(client, bookingId);
  res.json({ status: "captured", bookingId, paymentId: captured.paymentId });
}

async function notifyBookingPaid(client: ReturnType<typeof createUserClient>, bookingId: string): Promise<void> {
  const env = loadEnv();
  const { data: booking } = await client
    .from("bookings")
    .select("id, total_amount, passenger_id, trip_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) {
    return;
  }
  const { data: trip } = await client
    .from("trips")
    .select("origin_name, destination_name, departure_time, driver_id, vehicles(vehicle_type, registration_number)")
    .eq("id", booking.trip_id)
    .maybeSingle<{
      origin_name: string;
      destination_name: string;
      departure_time: string;
      driver_id: string;
      vehicles: { vehicle_type: string; registration_number: string } | null;
    }>();
  const { data: passenger } = await client.from("users").select("name, phone").eq("id", booking.passenger_id).maybeSingle();
  const { data: driver } = await client.from("users").select("name").eq("id", trip?.driver_id).maybeSingle();
  if (!passenger?.phone || !trip) {
    return;
  }
  const vehicle = trip.vehicles
    ? `${trip.vehicles.vehicle_type === "bike" ? "Bike" : "Car"} · ${trip.vehicles.registration_number}`
    : "Verified vehicle";
  await fetch(`${env.NOTIFICATION_SERVICE_URL ?? "http://localhost:3005"}/whatsapp/booking`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.INTERNAL_SERVICE_SECRET ? { "x-internal-secret": process.env.INTERNAL_SERVICE_SECRET } : {}),
    },
    body: JSON.stringify({
      phone: passenger.phone,
      passengerName: passenger.name ?? "Passenger",
      origin: trip.origin_name,
      destination: trip.destination_name,
      departure: trip.departure_time,
      driverName: driver?.name ?? "Driver",
      vehicle,
      amount: String(booking.total_amount),
    }),
  }).catch(() => undefined);
}

export async function refund(req: Request, res: Response): Promise<void> {
  const authed = req as AuthedRequest;
  const input = refundSchema.parse(req.body);
  const result = await refundBooking(
    createUserClient(authed.accessToken),
    input.bookingId,
    input.reason,
    input.amountPaise
  );
  res.json(result);
}
