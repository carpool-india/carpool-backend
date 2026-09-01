import { getAdminClient } from "../lib/supabase";
import { HttpError } from "../lib/errors";

function range(page: number, limit: number): [number, number] {
  const start = (page - 1) * limit;
  return [start, start + limit - 1];
}

export async function listSafetyEvents(
  page: number,
  limit: number,
  eventType?: string,
  severity?: string,
  resolved?: boolean
) {
  const client = getAdminClient();
  let query = client
    .from("safety_events")
    .select("*, users!safety_events_user_id_fkey(name, phone)", { count: "exact" })
    .order("created_at", { ascending: false });
  if (eventType) query = query.eq("event_type", eventType);
  if (severity) query = query.eq("severity", severity);
  if (typeof resolved === "boolean") query = query.eq("resolved", resolved);
  const [start, end] = range(page, limit);
  const { data, error, count } = await query.range(start, end);
  if (error) {
    throw new HttpError(400, "bad_request", error.message);
  }
  return { items: data ?? [], total: count ?? 0 };
}

export async function resolveSafetyEvent(eventId: string, adminUserId: string) {
  const client = getAdminClient();
  const { data, error } = await client
    .from("safety_events")
    .update({ resolved: true, resolved_by: adminUserId, resolved_at: new Date().toISOString() })
    .eq("id", eventId)
    .select("*")
    .maybeSingle();
  if (error || !data) {
    throw new HttpError(400, "bad_request", error?.message ?? "Unable to resolve event");
  }
  return data;
}

export async function listRatings(page: number, limit: number, maxStars?: number) {
  const client = getAdminClient();
  let query = client
    .from("ratings")
    .select("*, rater:users!ratings_rater_id_fkey(name, phone), ratee:users!ratings_ratee_id_fkey(name, phone)", {
      count: "exact",
    })
    .order("created_at", { ascending: false });
  if (typeof maxStars === "number") query = query.lte("stars", maxStars);
  const [start, end] = range(page, limit);
  const { data, error, count } = await query.range(start, end);
  if (error) {
    throw new HttpError(400, "bad_request", error.message);
  }
  const items = (data ?? []).filter((row) => (row as { hidden?: boolean }).hidden !== true);
  return { items, total: count ?? items.length };
}

export async function hideRating(id: string) {
  const client = getAdminClient();
  const { data, error } = await client.from("ratings").update({ hidden: true }).eq("id", id).select("*").maybeSingle();
  if (error || !data) {
    throw new HttpError(400, "bad_request", error?.message ?? "Unable to hide rating");
  }
  return data;
}

export async function flagUserAsAdmin(userId: string, reason: string) {
  const client = getAdminClient();
  const { data, error } = await client
    .from("safety_events")
    .insert({
      user_id: userId,
      event_type: "fraud_flag",
      severity: "high",
      metadata: { reason },
    })
    .select("*")
    .maybeSingle();
  if (error || !data) {
    throw new HttpError(400, "bad_request", error?.message ?? "Unable to flag user");
  }
  return data;
}
