import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateTripInput, Trip, TripStatus, TripType, UpdateTripInput } from "@rideshare/types";
import { geocodeIndianCity, parseGeoPoint, toGeoJsonPoint } from "@rideshare/utils";
import { badRequest, forbidden, notFound } from "../lib/errors";
import { resolveRoutePolyline } from "./directions.service";
import { reverseGeocodeState } from "./geo.service";
import { hasActiveSubscription } from "./subscription.service";

interface UserRow {
  id: string;
  supabase_auth_id: string | null;
  aadhaar_verified: boolean;
  dl_verified: boolean;
  face_match_done: boolean;
  role: "passenger" | "driver" | "both";
}

interface TripRow {
  id: string;
  driver_id: string;
  origin_name: string;
  origin_point: unknown;
  destination_name: string;
  destination_point: unknown;
  route_polyline: string | null;
  departure_time: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: TripStatus;
  is_women_only: boolean;
  luggage_policy: "none" | "small" | "large";
  cancellation_bond_paid: boolean;
  trip_type: TripType;
  instant_book: boolean;
  vehicle_id: string | null;
  created_at: string;
}

function safeCityState(name: string): string | null {
  try {
    return geocodeIndianCity(name).state;
  } catch {
    return null;
  }
}

async function upsertVehicle(
  client: SupabaseClient,
  driverId: string,
  vehicleType: "car" | "bike",
  vehicleNumber: string
): Promise<string> {
  const registrationNumber = vehicleNumber.trim().toUpperCase();
  const { data: existing, error: lookupError } = await client
    .from("vehicles")
    .select("id")
    .eq("registration_number", registrationNumber)
    .maybeSingle<{ id: string }>();
  if (lookupError) {
    throw badRequest(lookupError.message);
  }
  if (existing) {
    const { error: updateError } = await client
      .from("vehicles")
      .update({ driver_id: driverId, vehicle_type: vehicleType })
      .eq("id", existing.id);
    if (updateError) {
      throw badRequest(updateError.message);
    }
    return existing.id;
  }
  const { data: inserted, error: insertError } = await client
    .from("vehicles")
    .insert({ driver_id: driverId, vehicle_type: vehicleType, registration_number: registrationNumber })
    .select("id")
    .single<{ id: string }>();
  if (insertError || !inserted) {
    throw badRequest(insertError?.message ?? "Unable to save vehicle");
  }
  return inserted.id;
}

export async function resolveAppUserId(
  client: SupabaseClient,
  supabaseAuthId: string
): Promise<string> {
  const { data, error } = await client
    .from("users")
    .select("id")
    .eq("supabase_auth_id", supabaseAuthId)
    .maybeSingle();
  if (error) {
    throw badRequest(error.message);
  }
  if (!data) {
    throw forbidden("No RideShare profile is linked to this session");
  }
  return data.id as string;
}

export async function createTrip(
  client: SupabaseClient,
  supabaseAuthId: string,
  input: CreateTripInput
): Promise<Trip> {
  const driverId = await resolveAppUserId(client, supabaseAuthId);
  const { data: driver, error: driverError } = await client
    .from("users")
    .select("id, aadhaar_verified, dl_verified, face_match_done, role")
    .eq("id", driverId)
    .single<UserRow>();
  if (driverError || !driver) {
    throw forbidden("Driver profile not found");
  }
  if (!driver.aadhaar_verified || !driver.dl_verified || !driver.face_match_done) {
    throw forbidden("Complete Aadhaar, DL, and face match before posting a trip");
  }
  if (driver.role === "passenger") {
    throw forbidden("Switch to driver mode before posting a trip");
  }
  if (new Date(input.departureTime).getTime() <= Date.now()) {
    throw badRequest("Departure time must be in the future");
  }

  const tripType = input.tripType ?? "intracity";
  const requiredPlan = tripType === "intercity" ? "driver_outstation" : "driver_local";
  const hasPlan = await hasActiveSubscription(client, driverId, [requiredPlan]);
  if (!hasPlan) {
    throw forbidden(
      tripType === "intercity"
        ? "You need an active outstation driver plan to post intercity trips"
        : "You need an active local driver plan to post intracity trips"
    );
  }

  const vehicleId = await upsertVehicle(client, driverId, input.vehicleType, input.vehicleNumber);

  const polyline = await resolveRoutePolyline(
    input.originPoint,
    input.destinationPoint,
    input.routePolyline
  );
  const originState = safeCityState(input.originName) ?? (await reverseGeocodeState(input.originPoint));
  const destinationState =
    safeCityState(input.destinationName) ?? (await reverseGeocodeState(input.destinationPoint));

  const { data, error } = await client
    .from("trips")
    .insert({
      driver_id: driverId,
      origin_name: input.originName,
      origin_point: toGeoJsonPoint(input.originPoint),
      destination_name: input.destinationName,
      destination_point: toGeoJsonPoint(input.destinationPoint),
      route_polyline: polyline,
      departure_time: input.departureTime,
      seats_total: input.seatsTotal,
      seats_available: input.seatsTotal,
      price_per_seat: input.pricePerSeat,
      is_women_only: input.isWomenOnly ?? false,
      luggage_policy: input.luggagePolicy ?? "small",
      trip_type: tripType,
      instant_book: input.instantBook ?? true,
      origin_state: originState,
      destination_state: destinationState,
      vehicle_id: vehicleId,
    })
    .select("*")
    .single<TripRow>();

  if (error || !data) {
    throw badRequest(error?.message ?? "Unable to create trip");
  }
  return mapTrip(data, input.originPoint, input.destinationPoint);
}

export async function listTrips(
  client: SupabaseClient,
  filters: { status?: TripStatus; driverId?: string }
): Promise<Trip[]> {
  let query = client.from("trips").select("*").order("departure_time", { ascending: true });
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.driverId) {
    query = query.eq("driver_id", filters.driverId);
  }
  const { data, error } = await query;
  if (error) {
    throw badRequest(error.message);
  }
  return (data as TripRow[]).map((row) => mapTrip(row));
}

export interface TripPassenger {
  bookingId: string;
  passengerId: string;
  name: string | null;
  photoUrl: string | null;
  seatsBooked: number;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface TripBookingRow {
  id: string;
  passenger_id: string;
  seats_booked: number;
  status: string;
  total_amount: number;
  created_at: string;
  users: { name: string | null; photo_url: string | null } | { name: string | null; photo_url: string | null }[] | null;
}

export async function listTripPassengers(
  client: SupabaseClient,
  supabaseAuthId: string,
  tripId: string
): Promise<TripPassenger[]> {
  const driverId = await resolveAppUserId(client, supabaseAuthId);
  const trip = await getTrip(client, tripId);
  if (trip.driverId !== driverId) {
    throw forbidden("Only the trip driver can view its passengers");
  }
  const { data, error } = await client
    .from("bookings")
    .select("id, passenger_id, seats_booked, status, total_amount, created_at, users(name, photo_url)")
    .eq("trip_id", tripId)
    .not("status", "in", "(cancelled,rejected)")
    .order("created_at", { ascending: true });
  if (error) {
    throw badRequest(error.message);
  }
  return (data as unknown as TripBookingRow[]).map((row) => {
    const passenger = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
      bookingId: row.id,
      passengerId: row.passenger_id,
      name: passenger?.name ?? null,
      photoUrl: passenger?.photo_url ?? null,
      seatsBooked: row.seats_booked,
      status: row.status,
      totalAmount: Number(row.total_amount),
      createdAt: row.created_at,
    };
  });
}

export async function getTrip(client: SupabaseClient, tripId: string): Promise<Trip> {
  const { data, error } = await client.from("trips").select("*").eq("id", tripId).maybeSingle<TripRow>();
  if (error) {
    throw badRequest(error.message);
  }
  if (!data) {
    throw notFound("Trip not found");
  }
  return mapTrip(data);
}

export async function updateTrip(
  client: SupabaseClient,
  supabaseAuthId: string,
  tripId: string,
  input: UpdateTripInput
): Promise<Trip> {
  const driverId = await resolveAppUserId(client, supabaseAuthId);
  const existing = await getTrip(client, tripId);
  if (existing.driverId !== driverId) {
    throw forbidden("Only the trip driver can update this trip");
  }
  if (existing.status === "completed" || existing.status === "cancelled") {
    throw badRequest("Completed or cancelled trips cannot be edited");
  }

  const { data, error } = await client
    .from("trips")
    .update({
      departure_time: input.departureTime,
      seats_total: input.seatsTotal,
      price_per_seat: input.pricePerSeat,
      is_women_only: input.isWomenOnly,
      luggage_policy: input.luggagePolicy,
      trip_type: input.tripType,
      status: input.status,
      route_polyline: input.routePolyline,
      instant_book: input.instantBook,
    })
    .eq("id", tripId)
    .select("*")
    .single<TripRow>();
  if (error || !data) {
    throw badRequest(error?.message ?? "Unable to update trip");
  }
  return mapTrip(data);
}

export async function cancelTrip(
  client: SupabaseClient,
  supabaseAuthId: string,
  tripId: string
): Promise<Trip> {
  const trip = await updateTrip(client, supabaseAuthId, tripId, { status: "cancelled" });
  await recordDriverCancellation(client, trip.driverId);
  return trip;
}

async function recordDriverCancellation(client: SupabaseClient, driverId: string): Promise<void> {
  const { data: existing } = await client
    .from("driver_profiles")
    .select("id, cancellation_count")
    .eq("user_id", driverId)
    .maybeSingle<{ id: string; cancellation_count: number }>();
  const nextCount = (existing?.cancellation_count ?? 0) + 1;
  const reliabilityScore = Math.max(0, Math.min(1, 1 - nextCount * 0.1));
  if (existing) {
    await client
      .from("driver_profiles")
      .update({ cancellation_count: nextCount, reliability_score: reliabilityScore })
      .eq("id", existing.id);
  } else {
    await client.from("driver_profiles").insert({
      user_id: driverId,
      cancellation_count: nextCount,
      reliability_score: reliabilityScore,
    });
  }
}

function parsePoint(value: unknown): { lat: number; lng: number } {
  return parseGeoPoint(value) ?? { lat: 0, lng: 0 };
}

function mapTrip(
  row: TripRow,
  originFallback?: { lat: number; lng: number },
  destFallback?: { lat: number; lng: number }
): Trip {
  return {
    id: row.id,
    driverId: row.driver_id,
    originName: row.origin_name,
    originPoint: originFallback ?? parsePoint(row.origin_point),
    destinationName: row.destination_name,
    destinationPoint: destFallback ?? parsePoint(row.destination_point),
    routePolyline: row.route_polyline,
    departureTime: row.departure_time,
    seatsTotal: row.seats_total,
    seatsAvailable: row.seats_available,
    pricePerSeat: Number(row.price_per_seat),
    status: row.status,
    isWomenOnly: row.is_women_only,
    luggagePolicy: row.luggage_policy,
    cancellationBondPaid: row.cancellation_bond_paid,
    tripType: row.trip_type,
    instantBook: row.instant_book,
    createdAt: row.created_at,
  };
}
