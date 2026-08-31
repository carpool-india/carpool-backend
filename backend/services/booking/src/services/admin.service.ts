import { getAdminClient } from "../lib/supabase";
import { HttpError } from "../lib/errors";

function range(page: number, limit: number): [number, number] {
  const start = (page - 1) * limit;
  return [start, start + limit - 1];
}

export async function getOverview() {
  const client = getAdminClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ count: totalUsers }, { count: kycPending }, { count: activeTrips }, { count: bookingsToday }] =
    await Promise.all([
      client.from("users").select("id", { count: "exact", head: true }),
      client.from("kyc_sessions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      client.from("trips").select("id", { count: "exact", head: true }).eq("status", "active"),
      client.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
    ]);

  return {
    totalUsers: totalUsers ?? 0,
    kycPending: kycPending ?? 0,
    activeTrips: activeTrips ?? 0,
    bookingsToday: bookingsToday ?? 0,
  };
}

export type KycDocType = "aadhaar" | "dl" | "selfie";
export type KycStatus = "pending" | "verified" | "failed" | "rejected";

export interface KycSessionRow {
  id: string;
  user_id: string;
  document_type: KycDocType;
  status: KycStatus;
  storage_path: string | null;
  created_at: string;
  reviewed_at: string | null;
  review_note: string | null;
  users: { id: string; name: string | null; phone: string; photo_url: string | null } | null;
}

async function signedPreviewUrl(storagePath: string | null, userId: string, docType: string): Promise<string | null> {
  const client = getAdminClient();
  const path = storagePath && storagePath.length > 0 ? storagePath : `${userId}/${docType}.jpg`;
  const { data, error } = await client.storage.from("kyc-documents").createSignedUrl(path, 60 * 15);
  if (error || !data?.signedUrl) {
    return null;
  }
  return data.signedUrl;
}

export async function listKycSessions(
  page: number,
  limit: number,
  status?: string,
  docType?: string,
  userId?: string
) {
  const client = getAdminClient();
  let query = client
    .from("kyc_sessions")
    .select(
      "id, user_id, document_type, status, storage_path, created_at, reviewed_at, review_note, users!kyc_sessions_user_id_fkey(id, name, phone, photo_url)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (docType) query = query.eq("document_type", docType);
  if (userId) query = query.eq("user_id", userId);
  const [start, end] = range(page, limit);
  const { data, error, count } = await query.range(start, end);
  if (error) {
    throw new HttpError(400, "bad_request", error.message);
  }
  return { items: (data ?? []) as unknown as KycSessionRow[], total: count ?? 0 };
}

export async function getKycSession(id: string) {
  const client = getAdminClient();
  const { data, error } = await client
    .from("kyc_sessions")
    .select(
      "id, user_id, document_type, status, storage_path, created_at, reviewed_at, review_note, users!kyc_sessions_user_id_fkey(id, name, phone, photo_url, aadhaar_verified, dl_verified, face_match_done)"
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) {
    throw new HttpError(404, "not_found", error?.message ?? "KYC document not found");
  }
  const row = data as unknown as KycSessionRow;
  const previewUrl = await signedPreviewUrl(row.storage_path, row.user_id, row.document_type);
  return { ...row, previewUrl };
}

export async function reviewKycSession(
  id: string,
  adminUserId: string,
  input: { decision: "approve" | "reject"; note?: string }
) {
  const existing = await getKycSession(id);
  const status: KycStatus = input.decision === "approve" ? "verified" : "rejected";
  const client = getAdminClient();
  const { error } = await client
    .from("kyc_sessions")
    .update({
      status,
      reviewed_by: adminUserId,
      reviewed_at: new Date().toISOString(),
      review_note: input.note?.trim() || null,
    })
    .eq("id", id);
  if (error) {
    throw new HttpError(400, "bad_request", error.message);
  }

  const flag =
    existing.document_type === "aadhaar"
      ? "aadhaar_verified"
      : existing.document_type === "dl"
        ? "dl_verified"
        : "face_match_done";
  const { error: userError } = await client
    .from("users")
    .update({ [flag]: input.decision === "approve" })
    .eq("id", existing.user_id);
  if (userError) {
    throw new HttpError(400, "bad_request", userError.message);
  }

  const { data: score } = await client.rpc("calculate_trust_score", { p_user_id: existing.user_id });
  if (typeof score === "number") {
    await client.from("users").update({ trust_score: score }).eq("id", existing.user_id);
  }

  return getKycSession(id);
}

export async function listUsers(page: number, limit: number, search?: string, role?: string) {
  const client = getAdminClient();
  let query = client
    .from("users")
    .select("id, phone, name, role, trust_score, is_admin, is_active, aadhaar_verified, dl_verified, face_match_done, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });
  if (search) {
    query = query.or(`phone.ilike.%${search}%,name.ilike.%${search}%`);
  }
  if (role) {
    query = query.eq("role", role);
  }
  const [start, end] = range(page, limit);
  const { data, error, count } = await query.range(start, end);
  if (error) {
    throw new HttpError(400, "bad_request", error.message);
  }
  return { items: data ?? [], total: count ?? 0 };
}

export async function updateUser(
  targetUserId: string,
  actingAdminId: string,
  patch: { isAdmin?: boolean; isActive?: boolean }
) {
  if (patch.isAdmin === false && targetUserId === actingAdminId) {
    throw new HttpError(400, "bad_request", "You cannot remove your own admin access");
  }
  const client = getAdminClient();
  const update: Record<string, boolean> = {};
  if (typeof patch.isAdmin === "boolean") update.is_admin = patch.isAdmin;
  if (typeof patch.isActive === "boolean") update.is_active = patch.isActive;
  const { data, error } = await client.from("users").update(update).eq("id", targetUserId).select("*").maybeSingle();
  if (error || !data) {
    throw new HttpError(400, "bad_request", error?.message ?? "Unable to update user");
  }
  return data;
}

export async function listTrips(page: number, limit: number, status?: string, tripType?: string) {
  const client = getAdminClient();
  let query = client
    .from("trips")
    .select("*, users!trips_driver_id_fkey(name, phone)", { count: "exact" })
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (tripType) query = query.eq("trip_type", tripType);
  const [start, end] = range(page, limit);
  const { data, error, count } = await query.range(start, end);
  if (error) {
    throw new HttpError(400, "bad_request", error.message);
  }
  return { items: data ?? [], total: count ?? 0 };
}

export async function listBookings(page: number, limit: number, status?: string) {
  const client = getAdminClient();
  let query = client
    .from("bookings")
    .select("*, trips(origin_name, destination_name, departure_time), passenger:users!bookings_passenger_id_fkey(name, phone)", {
      count: "exact",
    })
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const [start, end] = range(page, limit);
  const { data, error, count } = await query.range(start, end);
  if (error) {
    throw new HttpError(400, "bad_request", error.message);
  }
  return { items: data ?? [], total: count ?? 0 };
}

export async function cancelTripAsAdmin(tripId: string) {
  const client = getAdminClient();
  const { data: trip, error: loadError } = await client.from("trips").select("id, status").eq("id", tripId).maybeSingle();
  if (loadError || !trip) {
    throw new HttpError(404, "not_found", "Trip not found");
  }
  if (trip.status === "cancelled" || trip.status === "completed") {
    throw new HttpError(409, "conflict", "Trip can no longer be cancelled");
  }
  const { data, error } = await client.from("trips").update({ status: "cancelled" }).eq("id", tripId).select("*").maybeSingle();
  if (error || !data) {
    throw new HttpError(400, "bad_request", error?.message ?? "Unable to cancel trip");
  }
  return data;
}

export async function cancelBookingAsAdmin(bookingId: string) {
  const client = getAdminClient();
  const { data: booking, error: loadError } = await client
    .from("bookings")
    .select("id, trip_id, seats_booked, status")
    .eq("id", bookingId)
    .maybeSingle();
  if (loadError || !booking) {
    throw new HttpError(404, "not_found", "Booking not found");
  }
  if (booking.status === "cancelled" || booking.status === "completed") {
    throw new HttpError(409, "conflict", "Booking can no longer be cancelled");
  }
  const { data, error } = await client.from("bookings").update({ status: "cancelled" }).eq("id", bookingId).select("*").maybeSingle();
  if (error || !data) {
    throw new HttpError(400, "bad_request", error?.message ?? "Unable to cancel booking");
  }
  await client.rpc("update_seat_count", { p_trip_id: booking.trip_id, p_seats: -booking.seats_booked });
  return data;
}

export async function listVehicles(page: number, limit: number, verified?: boolean) {
  const client = getAdminClient();
  let query = client
    .from("vehicles")
    .select(
      "id, driver_id, make, model, color, registration_number, year, vehicle_type, is_verified, created_at, users!vehicles_driver_id_fkey(id, name, phone)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });
  if (typeof verified === "boolean") {
    query = query.eq("is_verified", verified);
  }
  const [start, end] = range(page, limit);
  const { data, error, count } = await query.range(start, end);
  if (error) {
    throw new HttpError(400, "bad_request", error.message);
  }
  const items = data ?? [];
  const driverIds = [...new Set(items.map((row) => row.driver_id as string))];
  const { data: profiles } =
    driverIds.length > 0
      ? await client
          .from("driver_profiles")
          .select("user_id, dl_number, dl_expiry, years_of_experience, cancellation_count, reliability_score")
          .in("user_id", driverIds)
      : { data: [] };
  const profileByUser = new Map((profiles ?? []).map((profile) => [String(profile.user_id), profile]));
  return {
    items: items.map((row) => ({
      ...row,
      driver_profile: profileByUser.get(String(row.driver_id)) ?? null,
    })),
    total: count ?? 0,
  };
}

export async function updateVehicle(vehicleId: string, isVerified: boolean) {
  const client = getAdminClient();
  const { data, error } = await client
    .from("vehicles")
    .update({ is_verified: isVerified })
    .eq("id", vehicleId)
    .select("*")
    .maybeSingle();
  if (error || !data) {
    throw new HttpError(400, "bad_request", error?.message ?? "Unable to update vehicle");
  }
  return data;
}

export async function listEmergencyContacts(userId: string) {
  const client = getAdminClient();
  const { data, error } = await client
    .from("emergency_contacts")
    .select("id, name, phone, relationship")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) {
    throw new HttpError(400, "bad_request", error.message);
  }
  return { items: data ?? [] };
}
