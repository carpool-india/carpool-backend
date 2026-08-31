import { haversineKm } from "@rideshare/utils";
import { loadEnv } from "../lib/env";
import { createUserClient, getAdminClient } from "../lib/supabase";
import { HttpError } from "../lib/errors";

export async function triggerSos(
  accessToken: string,
  supabaseAuthId: string,
  input: { tripId: string; bookingId?: string; lat: number; lng: number; holdDurationMs: number }
): Promise<{ eventId: string; dispatched: boolean }> {
  if (input.holdDurationMs < 2000) {
    throw new HttpError(400, "hold_too_short", "SOS requires a 2 second hold");
  }
  const client = createUserClient(accessToken);
  const { data: user, error: userError } = await client
    .from("users")
    .select("id, name, phone")
    .eq("supabase_auth_id", supabaseAuthId)
    .single();
  if (userError || !user) {
    throw new HttpError(403, "forbidden", "User profile not found");
  }

  const { data: event, error } = await client
    .from("safety_events")
    .insert({
      trip_id: input.tripId,
      booking_id: input.bookingId ?? null,
      user_id: user.id,
      event_type: "sos",
      severity: "critical",
      lat: input.lat,
      lng: input.lng,
      metadata: { holdDurationMs: input.holdDurationMs },
    })
    .select("id")
    .single();
  if (error || !event) {
    throw new HttpError(400, "bad_request", error?.message ?? "Unable to log SOS");
  }

  const { data: contacts } = await client
    .from("emergency_contacts")
    .select("name, phone")
    .eq("user_id", user.id);

  const { data: admins } = await getAdminClient()
    .from("device_tokens")
    .select("token, users!inner(is_admin)")
    .eq("users.is_admin", true);
  const adminFcmTokens = (admins ?? []).map((row) => row.token as string);

  const env = loadEnv();
  const response = await fetch(`${env.NOTIFICATION_SERVICE_URL}/sos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: user.name ?? "Rider",
      userPhone: user.phone,
      lat: input.lat,
      lng: input.lng,
      tripId: input.tripId,
      emergencyContacts: contacts ?? [],
      adminFcmTokens,
    }),
  });
  if (!response.ok) {
    throw new HttpError(502, "dispatch_failed", "SOS logged but notification dispatch failed");
  }
  return { eventId: event.id as string, dispatched: true };
}

export { haversineKm };
