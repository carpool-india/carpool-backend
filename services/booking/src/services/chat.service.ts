import type { SupabaseClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { loadEnv } from "../lib/env";
import { badRequest, forbidden } from "../lib/errors";
import { pushToUsers } from "../lib/push";
import { getAdminClient } from "../lib/supabase";
import { resolveAppUserId } from "./trip.service";

export interface ChatMessage {
  id: string;
  tripId: string;
  senderId: string;
  senderName: string | null;
  senderPhotoUrl: string | null;
  body: string;
  createdAt: string;
}

interface MessageRow {
  id: string;
  trip_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

interface PublicProfile {
  name: string | null;
  photo_url: string | null;
}

function tripChannel(tripId: string): string {
  return `trip:${tripId}`;
}

// `users` only exposes a caller's own row via RLS -- a display name/photo for
// someone else (a trip's other party) has to come from this narrow, unrestricted
// view instead of embedding `users(...)` directly in a PostgREST select.
async function fetchPublicProfiles(
  client: SupabaseClient,
  userIds: Iterable<string>
): Promise<Map<string, PublicProfile>> {
  const ids = Array.from(new Set(userIds));
  const profiles = new Map<string, PublicProfile>();
  if (ids.length === 0) {
    return profiles;
  }
  const { data } = await client.from("user_public_profiles").select("id, name, photo_url").in("id", ids);
  for (const row of (data ?? []) as Array<{ id: string; name: string | null; photo_url: string | null }>) {
    profiles.set(row.id, { name: row.name, photo_url: row.photo_url });
  }
  return profiles;
}

function mapMessage(row: MessageRow, profile: PublicProfile | undefined): ChatMessage {
  return {
    id: row.id,
    tripId: row.trip_id,
    senderId: row.sender_id,
    senderName: profile?.name ?? null,
    senderPhotoUrl: profile?.photo_url ?? null,
    body: row.body,
    createdAt: row.created_at,
  };
}

async function assertTripParty(client: SupabaseClient, tripId: string): Promise<void> {
  const { data, error } = await client.rpc("is_trip_party", { p_trip_id: tripId });
  if (error) {
    throw badRequest(error.message);
  }
  if (!data) {
    throw forbidden("You are not a driver or passenger on this trip");
  }
}

export async function issueChatToken(
  client: SupabaseClient,
  supabaseAuthId: string,
  tripId: string
): Promise<{ token: string; wsUrl: string; channel: string }> {
  const env = loadEnv();
  const appUserId = await resolveAppUserId(client, supabaseAuthId);
  await assertTripParty(client, tripId);
  const channel = tripChannel(tripId);
  const token = jwt.sign(
    { sub: appUserId, channels: [channel] },
    env.CENTRIFUGO_TOKEN_HMAC_SECRET,
    { expiresIn: "1h" }
  );
  return { token, wsUrl: env.CENTRIFUGO_API_URL.replace(/^http/, "ws") + "/connection/websocket", channel };
}

export async function listMessages(
  client: SupabaseClient,
  supabaseAuthId: string,
  tripId: string
): Promise<ChatMessage[]> {
  await resolveAppUserId(client, supabaseAuthId);
  await assertTripParty(client, tripId);
  const { data, error } = await client
    .from("messages")
    .select("id, trip_id, sender_id, body, created_at")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) {
    throw badRequest(error.message);
  }
  const rows = data as unknown as MessageRow[];
  const profiles = await fetchPublicProfiles(
    client,
    rows.map((row) => row.sender_id)
  );
  return rows.map((row) => mapMessage(row, profiles.get(row.sender_id)));
}

export interface ChatPreview {
  tripId: string;
  originName: string;
  destinationName: string;
  lastMessageBody: string;
  lastMessageSenderName: string | null;
  lastMessageAt: string;
}

interface PreviewRow {
  trip_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  trips: { origin_name: string; destination_name: string } | { origin_name: string; destination_name: string }[] | null;
}

export async function listMyChatPreviews(client: SupabaseClient, supabaseAuthId: string): Promise<ChatPreview[]> {
  await resolveAppUserId(client, supabaseAuthId);
  const { data, error } = await client
    .from("messages")
    .select("trip_id, sender_id, body, created_at, trips(origin_name, destination_name)")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    throw badRequest(error.message);
  }

  const rows = data as unknown as PreviewRow[];
  const seen = new Set<string>();
  const latestPerTrip: PreviewRow[] = [];
  for (const row of rows) {
    if (seen.has(row.trip_id)) {
      continue;
    }
    seen.add(row.trip_id);
    latestPerTrip.push(row);
  }
  const profiles = await fetchPublicProfiles(
    client,
    latestPerTrip.map((row) => row.sender_id)
  );

  return latestPerTrip.map((row) => {
    const trip = Array.isArray(row.trips) ? row.trips[0] : row.trips;
    return {
      tripId: row.trip_id,
      originName: trip?.origin_name ?? "",
      destinationName: trip?.destination_name ?? "",
      lastMessageBody: row.body,
      lastMessageSenderName: profiles.get(row.sender_id)?.name ?? null,
      lastMessageAt: row.created_at,
    };
  });
}

export async function sendMessage(
  client: SupabaseClient,
  supabaseAuthId: string,
  tripId: string,
  body: string
): Promise<ChatMessage> {
  const env = loadEnv();
  const appUserId = await resolveAppUserId(client, supabaseAuthId);
  await assertTripParty(client, tripId);

  const { data, error } = await client
    .from("messages")
    .insert({ trip_id: tripId, sender_id: appUserId, body })
    .select("id, trip_id, sender_id, body, created_at")
    .single();
  if (error || !data) {
    throw badRequest(error?.message ?? "Unable to send message");
  }
  const profiles = await fetchPublicProfiles(client, [appUserId]);
  const message = mapMessage(data as unknown as MessageRow, profiles.get(appUserId));

  await fetch(`${env.CENTRIFUGO_API_URL}/api/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": env.CENTRIFUGO_API_KEY,
    },
    body: JSON.stringify({
      channel: tripChannel(tripId),
      data: message,
    }),
  }).catch(() => undefined);

  void notifyTripPartyOfMessage(tripId, appUserId, message.senderName, message.body).catch(() => undefined);

  return message;
}

async function notifyTripPartyOfMessage(
  tripId: string,
  senderId: string,
  senderName: string | null,
  body: string
): Promise<void> {
  const admin = getAdminClient();
  const [{ data: trip }, { data: bookings }] = await Promise.all([
    admin.from("trips").select("driver_id").eq("id", tripId).maybeSingle(),
    admin.from("bookings").select("passenger_id").eq("trip_id", tripId).eq("status", "confirmed"),
  ]);

  const recipientIds = new Set<string>();
  if (trip?.driver_id) {
    recipientIds.add(trip.driver_id as string);
  }
  for (const booking of (bookings ?? []) as Array<{ passenger_id: string }>) {
    recipientIds.add(booking.passenger_id);
  }
  recipientIds.delete(senderId);

  const preview = body.length > 80 ? `${body.slice(0, 77)}...` : body;
  await pushToUsers(Array.from(recipientIds), senderName ?? "New message", preview, { type: "chat", tripId });
}
