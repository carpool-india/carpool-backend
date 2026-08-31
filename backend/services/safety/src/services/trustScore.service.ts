import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateTrustScore } from "@rideshare/utils";
import { HttpError } from "../lib/errors";

export async function recalculateTrustScore(
  client: SupabaseClient,
  userId: string
): Promise<number> {
  const { data: user, error } = await client
    .from("users")
    .select("aadhaar_verified, dl_verified, face_match_done")
    .eq("id", userId)
    .single();
  if (error || !user) {
    throw new HttpError(404, "not_found", "User not found");
  }

  const { data: ratings } = await client.from("ratings").select("stars").eq("ratee_id", userId);
  const stars = (ratings ?? []).map((row) => Number(row.stars));
  const averageStars = stars.length === 0 ? 0 : stars.reduce((sum, value) => sum + value, 0) / stars.length;

  const { count: completedAsPassenger } = await client
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("passenger_id", userId)
    .eq("status", "completed");

  const { count: completedAsDriver } = await client
    .from("trips")
    .select("id", { count: "exact", head: true })
    .eq("driver_id", userId)
    .eq("status", "completed");

  const completedTrips = (completedAsPassenger ?? 0) + (completedAsDriver ?? 0);

  const { data: profile } = await client
    .from("driver_profiles")
    .select("cancellation_count")
    .eq("user_id", userId)
    .maybeSingle();

  const { count: fraudFlags } = await client
    .from("safety_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", "fraud_flag");

  const score = calculateTrustScore({
    aadhaarVerified: Boolean(user.aadhaar_verified),
    dlVerified: Boolean(user.dl_verified),
    faceMatchDone: Boolean(user.face_match_done),
    averageStars,
    ratingCount: stars.length,
    completedTrips,
    cancellations: Number(profile?.cancellation_count ?? 0),
    fraudFlags: fraudFlags ?? 0,
  });

  await client
    .from("users")
    .update({ trust_score: score, average_stars: Math.round(averageStars * 10) / 10, rating_count: stars.length })
    .eq("id", userId);
  return score;
}
