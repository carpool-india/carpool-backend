import type { SupabaseClient } from "@supabase/supabase-js";
import { badRequest } from "../lib/errors";
import { getAdminClient } from "../lib/supabase";
import { resolveAppUserId } from "./trip.service";
import { cancelBooking } from "./booking.service";
import { cancelTrip } from "./trip.service";

const ACTIVE_BOOKING_STATUSES = ["pending_approval", "pending", "confirmed"];
const ACTIVE_TRIP_STATUSES = ["active", "in_progress"];

export interface DeleteAccountResult {
  cancelledBookings: number;
  cancelledTrips: number;
}

/**
 * "Delete account" can't be a hard row delete: bookings, trips, ratings,
 * messages, and payments all reference users with ON DELETE NO ACTION, since
 * they're the other trip participant's real history too. Instead this
 * auto-cancels anything still active, scrubs every piece of personally
 * identifiable data from the users row in place (so old trips/ratings/chat
 * still resolve, just showing "Deleted user"), removes the purely-private
 * rows (contacts, device tokens, subscriptions, KYC sessions + documents),
 * and finally deletes the Supabase Auth identity so the account can never
 * sign in again. The original phone number is freed up in the process, so
 * the same number can be used to create a genuinely new account later.
 */
export async function deleteAccount(
  client: SupabaseClient,
  supabaseAuthId: string
): Promise<DeleteAccountResult> {
  const userId = await resolveAppUserId(client, supabaseAuthId);

  const { data: activeBookings, error: bookingsError } = await client
    .from("bookings")
    .select("id")
    .eq("passenger_id", userId)
    .in("status", ACTIVE_BOOKING_STATUSES);
  if (bookingsError) {
    throw badRequest(bookingsError.message);
  }
  for (const booking of activeBookings ?? []) {
    await cancelBooking(client, supabaseAuthId, booking.id, "passenger", "Account deleted");
  }

  const { data: activeTrips, error: tripsError } = await client
    .from("trips")
    .select("id")
    .eq("driver_id", userId)
    .in("status", ACTIVE_TRIP_STATUSES);
  if (tripsError) {
    throw badRequest(tripsError.message);
  }
  for (const trip of activeTrips ?? []) {
    await cancelTrip(client, supabaseAuthId, trip.id);
  }

  const admin = getAdminClient();

  await admin.storage
    .from("kyc-documents")
    .remove([`${userId}/aadhaar.jpg`, `${userId}/dl.jpg`, `${userId}/selfie.jpg`]);
  await admin.storage.from("profile-photos").remove([`${userId}/profile.jpg`]);

  await admin.from("kyc_sessions").delete().eq("user_id", userId);
  await admin.from("emergency_contacts").delete().eq("user_id", userId);
  await admin.from("device_tokens").delete().eq("user_id", userId);
  await admin.from("subscriptions").delete().eq("user_id", userId);
  await admin.from("driver_profiles").delete().eq("user_id", userId);
  await admin.from("user_blocks").delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

  const { data: userRow } = await admin.from("users").select("supabase_auth_id").eq("id", userId).maybeSingle();

  const { error: scrubError } = await admin
    .from("users")
    .update({
      name: "Deleted user",
      photo_url: null,
      gender: null,
      phone: `deleted-${userId}`,
      aadhaar_verified: false,
      dl_verified: false,
      face_match_done: false,
      supabase_auth_id: null,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (scrubError) {
    throw badRequest(scrubError.message);
  }

  if (userRow?.supabase_auth_id) {
    await admin.auth.admin.deleteUser(userRow.supabase_auth_id).catch(() => undefined);
  }

  return {
    cancelledBookings: activeBookings?.length ?? 0,
    cancelledTrips: activeTrips?.length ?? 0,
  };
}
