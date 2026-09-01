import type { SupabaseClient } from "@supabase/supabase-js";
import type { Booking, CreateBookingInput, PriceBreakdown } from "@rideshare/types";
import { parseGeoPoint, toGeoJsonPoint } from "@rideshare/utils";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors";
import { pushToUser, pushToUsers } from "../lib/push";
import { evaluateCancellationBond, hoursUntil } from "./cancellationBond.service";
import { buildPriceBreakdown } from "./invoice.service";
import { getTrip, resolveAppUserId } from "./trip.service";
import { hasActiveSubscription } from "./subscription.service";

interface BookingRow {
  id: string;
  trip_id: string;
  passenger_id: string;
  seats_booked: number;
  subtotal: number;
  total_amount: number;
  service_fee: number;
  status: Booking["status"];
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  pickup_point: string | null;
  dropoff_point: string | null;
  created_at: string;
  trips?: { origin_name: string; destination_name: string; departure_time: string } | null;
}

export async function createBooking(
  client: SupabaseClient,
  supabaseAuthId: string,
  input: CreateBookingInput
): Promise<{ booking: Booking; breakdown: PriceBreakdown }> {
  const passengerId = await resolveAppUserId(client, supabaseAuthId);
  const { data: passenger, error: passengerError } = await client
    .from("users")
    .select("id, aadhaar_verified, face_match_done, gender")
    .eq("id", passengerId)
    .single();
  if (passengerError || !passenger) {
    throw forbidden("Passenger profile not found");
  }
  if (!passenger.aadhaar_verified || !passenger.face_match_done) {
    throw forbidden("Complete Aadhaar and face match before booking");
  }

  const trip = await getTrip(client, input.tripId);
  if (trip.driverId === passengerId) {
    throw badRequest("Drivers cannot book their own trip");
  }
  if (trip.status !== "active") {
    throw conflict("Trip is not open for booking");
  }
  if (trip.seatsAvailable < input.seatsBooked) {
    throw conflict("Not enough seats remaining");
  }
  if (trip.isWomenOnly && passenger.gender !== "female") {
    throw forbidden("This trip is women-only");
  }
  if (await isBlocked(client, trip.driverId, passengerId)) {
    throw forbidden("You're unable to book this driver's trips");
  }

  const feeWaived = await hasActiveSubscription(client, passengerId, ["passenger"]);
  const breakdown = buildPriceBreakdown(trip.pricePerSeat, input.seatsBooked, feeWaived);
  const initialStatus = trip.instantBook ? "pending" : "pending_approval";

  const { data, error } = await client
    .from("bookings")
    .insert({
      trip_id: input.tripId,
      passenger_id: passengerId,
      seats_booked: input.seatsBooked,
      subtotal: breakdown.subtotal,
      total_amount: breakdown.totalAmount,
      service_fee: breakdown.serviceFee,
      status: initialStatus,
      pickup_point: toGeoJsonPoint(input.pickupPoint),
      dropoff_point: toGeoJsonPoint(input.dropoffPoint),
    })
    .select("*")
    .single<BookingRow>();
  if (error || !data) {
    throw conflict(error?.message ?? "Unable to create booking");
  }

  if (initialStatus === "pending") {
    const { error: seatError } = await client.rpc("update_seat_count", {
      p_trip_id: input.tripId,
      p_seats: input.seatsBooked,
    });
    if (seatError) {
      await client.from("bookings").delete().eq("id", data.id);
      throw conflict(seatError.message);
    }
  }

  if (initialStatus === "pending_approval") {
    void pushToUser(
      trip.driverId,
      "New booking request",
      `${input.seatsBooked} seat(s) requested for ${trip.originName} → ${trip.destinationName}`,
      { type: "booking_request", tripId: input.tripId }
    ).catch(() => undefined);
  }

  return { booking: mapBooking(data, input.pickupPoint, input.dropoffPoint), breakdown };
}

async function isBlocked(client: SupabaseClient, userAId: string, userBId: string): Promise<boolean> {
  const { data } = await client
    .from("user_blocks")
    .select("id")
    .or(
      `and(blocker_id.eq.${userAId},blocked_id.eq.${userBId}),and(blocker_id.eq.${userBId},blocked_id.eq.${userAId})`
    )
    .maybeSingle();
  return Boolean(data);
}

export async function respondToBooking(
  client: SupabaseClient,
  supabaseAuthId: string,
  bookingId: string,
  decision: "accept" | "reject"
): Promise<Booking> {
  const driverId = await resolveAppUserId(client, supabaseAuthId);
  const booking = await getBooking(client, bookingId);
  const trip = await getTrip(client, booking.tripId);
  if (trip.driverId !== driverId) {
    throw forbidden("Only the trip driver can respond to this request");
  }
  if (booking.status !== "pending_approval") {
    throw conflict("This booking is not awaiting approval");
  }

  if (decision === "reject") {
    const { data, error } = await client
      .from("bookings")
      .update({ status: "rejected" })
      .eq("id", bookingId)
      .select("*")
      .single<BookingRow>();
    if (error || !data) {
      throw badRequest(error?.message ?? "Unable to reject booking");
    }
    void pushToUser(
      booking.passengerId,
      "Booking declined",
      `Your request for ${trip.originName} → ${trip.destinationName} was declined`,
      { type: "booking_rejected", bookingId }
    ).catch(() => undefined);
    return mapBooking(data);
  }

  if (trip.seatsAvailable < booking.seatsBooked) {
    throw conflict("Not enough seats remaining to accept this request");
  }
  const { error: seatError } = await client.rpc("update_seat_count", {
    p_trip_id: booking.tripId,
    p_seats: booking.seatsBooked,
  });
  if (seatError) {
    throw conflict(seatError.message);
  }
  const { data, error } = await client
    .from("bookings")
    .update({ status: "pending" })
    .eq("id", bookingId)
    .select("*")
    .single<BookingRow>();
  if (error || !data) {
    throw badRequest(error?.message ?? "Unable to accept booking");
  }
  void pushToUser(
    booking.passengerId,
    "Booking accepted",
    `Complete payment to confirm your seat on ${trip.originName} → ${trip.destinationName}`,
    { type: "booking_accepted", bookingId }
  ).catch(() => undefined);
  return mapBooking(data);
}

export async function cancelBooking(
  client: SupabaseClient,
  supabaseAuthId: string,
  bookingId: string,
  cancelledBy: "passenger" | "driver",
  reason: string
): Promise<{
  booking: Booking;
  bondForfeited: boolean;
  amountInr: number;
  reason: string;
  feeRefundPaise: number;
  feeRefundPolicy: string;
}> {
  const actorId = await resolveAppUserId(client, supabaseAuthId);
  const booking = await getBooking(client, bookingId);
  const trip = await getTrip(client, booking.tripId);

  if (cancelledBy === "passenger" && booking.passengerId !== actorId) {
    throw forbidden("Only the passenger can cancel this booking");
  }
  if (cancelledBy === "driver" && trip.driverId !== actorId) {
    throw forbidden("Only the driver can cancel this booking");
  }
  if (booking.status === "cancelled" || booking.status === "completed" || booking.status === "rejected") {
    throw conflict("Booking can no longer be cancelled");
  }

  const hadReservedSeat = booking.status === "pending" || booking.status === "confirmed";
  const bond = evaluateCancellationBond(
    cancelledBy,
    hoursUntil(trip.departureTime),
    trip.cancellationBondPaid
  );
  const fee = evaluateFeeRefund(cancelledBy, hoursUntil(trip.departureTime), booking.status, booking.serviceFee);

  const { data, error } = await client
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .select("*")
    .single<BookingRow>();
  if (error || !data) {
    throw badRequest(error?.message ?? "Unable to cancel booking");
  }

  if (hadReservedSeat) {
    const { error: seatError } = await client.rpc("update_seat_count", {
      p_trip_id: booking.tripId,
      p_seats: -booking.seatsBooked,
    });
    if (seatError) {
      throw badRequest(seatError.message);
    }
  }

  const otherPartyId = cancelledBy === "passenger" ? trip.driverId : booking.passengerId;
  void pushToUser(
    otherPartyId,
    "Booking cancelled",
    `${cancelledBy === "passenger" ? "Passenger" : "Driver"} cancelled ${trip.originName} → ${trip.destinationName}. ${reason}`,
    { type: "booking_cancelled", tripId: booking.tripId }
  ).catch(() => undefined);

  return {
    booking: mapBooking(data),
    bondForfeited: bond.forfeited,
    amountInr: bond.amountInr,
    reason: `${reason}. ${bond.reason}`,
    feeRefundPaise: fee.refundPaise,
    feeRefundPolicy: fee.policy,
  };
}

function evaluateFeeRefund(
  cancelledBy: "passenger" | "driver",
  hoursUntilDeparture: number,
  bookingStatus: Booking["status"],
  serviceFee: number
): { refundPaise: number; policy: string } {
  if (bookingStatus !== "confirmed") {
    return { refundPaise: 0, policy: "No platform fee was charged yet" };
  }
  const feePaise = Math.round(serviceFee * 100);
  if (cancelledBy === "driver") {
    return { refundPaise: feePaise, policy: "Driver cancelled — full platform fee refunded" };
  }
  if (hoursUntilDeparture >= 24) {
    return { refundPaise: feePaise, policy: "Cancelled 24h+ before departure — full platform fee refunded" };
  }
  if (hoursUntilDeparture >= 12) {
    return {
      refundPaise: Math.round(feePaise * 0.5),
      policy: "Cancelled 12-24h before departure — 50% platform fee refunded",
    };
  }
  return { refundPaise: 0, policy: "Cancelled within 12h of departure — platform fee not refunded" };
}

export async function startTrip(
  client: SupabaseClient,
  supabaseAuthId: string,
  bookingId: string
): Promise<Booking> {
  const driverId = await resolveAppUserId(client, supabaseAuthId);
  const booking = await getBooking(client, bookingId);
  const trip = await getTrip(client, booking.tripId);
  if (trip.driverId !== driverId) {
    throw forbidden("Only the driver can start the trip");
  }
  if (booking.status !== "confirmed") {
    throw conflict("Payment must be confirmed before trip start");
  }

  const { error } = await client.from("trips").update({ status: "in_progress" }).eq("id", trip.id);
  if (error) {
    throw badRequest(error.message);
  }

  const { data: confirmedBookings } = await client
    .from("bookings")
    .select("passenger_id")
    .eq("trip_id", trip.id)
    .eq("status", "confirmed");
  const passengerIds = ((confirmedBookings ?? []) as Array<{ passenger_id: string }>).map((row) => row.passenger_id);
  void pushToUsers(passengerIds, "Trip started", `Your driver has started the trip to ${trip.destinationName}`, {
    type: "trip_started",
    tripId: trip.id,
  }).catch(() => undefined);

  return booking;
}

export async function getBooking(client: SupabaseClient, bookingId: string): Promise<Booking> {
  const { data, error } = await client
    .from("bookings")
    .select("*, trips(origin_name, destination_name, departure_time)")
    .eq("id", bookingId)
    .maybeSingle<BookingRow>();
  if (error) {
    throw badRequest(error.message);
  }
  if (!data) {
    throw notFound("Booking not found");
  }
  return mapBooking(data);
}

export async function listMyBookings(
  client: SupabaseClient,
  supabaseAuthId: string
): Promise<Booking[]> {
  const userId = await resolveAppUserId(client, supabaseAuthId);
  const { data, error } = await client
    .from("bookings")
    .select("*, trips(origin_name, destination_name, departure_time)")
    .eq("passenger_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    throw badRequest(error.message);
  }
  return (data as BookingRow[]).map((row) => mapBooking(row));
}

function parsePoint(value: unknown): { lat: number; lng: number } | null {
  return parseGeoPoint(value);
}

function mapBooking(
  row: BookingRow,
  pickupFallback?: { lat: number; lng: number },
  dropoffFallback?: { lat: number; lng: number }
): Booking {
  return {
    id: row.id,
    tripId: row.trip_id,
    passengerId: row.passenger_id,
    seatsBooked: row.seats_booked,
    subtotal: Number(row.subtotal),
    totalAmount: Number(row.total_amount),
    serviceFee: Number(row.service_fee),
    status: row.status,
    razorpayOrderId: row.razorpay_order_id,
    razorpayPaymentId: row.razorpay_payment_id,
    pickupPoint: pickupFallback ?? parsePoint(row.pickup_point),
    dropoffPoint: dropoffFallback ?? parsePoint(row.dropoff_point),
    createdAt: row.created_at,
    trip: row.trips
      ? {
          originName: row.trips.origin_name,
          destinationName: row.trips.destination_name,
          departureTime: row.trips.departure_time,
        }
      : null,
  };
}
