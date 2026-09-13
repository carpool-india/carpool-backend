import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../lib/errors";

// The actual computation lives in the recalculate_and_store_trust_score SQL
// function (SECURITY DEFINER): it recomputes from real ratings/bookings/
// safety-event data and writes the result itself, rather than trusting a
// score computed here and handed back for an UPDATE -- the ratee is usually a
// different user than the caller (the rater), and `users` only allows a
// self-UPDATE, so a client-side compute-then-write always silently no-op'd.
export async function recalculateTrustScore(client: SupabaseClient, userId: string): Promise<number> {
  const { data, error } = await client.rpc("recalculate_and_store_trust_score", { p_user_id: userId });
  if (error) {
    throw new HttpError(404, "not_found", "User not found");
  }
  return data as number;
}
