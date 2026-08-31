import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../lib/errors";
import { recalculateTrustScore } from "./trustScore.service";

export async function submitRating(
  client: SupabaseClient,
  raterAuthId: string,
  input: { bookingId: string; rateeId: string; stars: number; comment?: string; tags?: string[] }
): Promise<{ ratingId: string; trustScore: number }> {
  const { data: rater } = await client
    .from("users")
    .select("id")
    .eq("supabase_auth_id", raterAuthId)
    .single();
  if (!rater) {
    throw new HttpError(403, "forbidden", "Rater profile not found");
  }
  if (input.rateeId === rater.id) {
    throw new HttpError(400, "bad_request", "You cannot rate yourself");
  }
  const { data: booking } = await client
    .from("bookings")
    .select("id, passenger_id, trip_id, status")
    .eq("id", input.bookingId)
    .maybeSingle();
  if (!booking) {
    throw new HttpError(404, "not_found", "Booking not found");
  }
  const { data: trip } = await client.from("trips").select("driver_id").eq("id", booking.trip_id).single();
  const allowed = booking.passenger_id === rater.id || trip?.driver_id === rater.id;
  if (!allowed) {
    throw new HttpError(403, "forbidden", "Only trip participants can rate");
  }
  const { data: rating, error } = await client
    .from("ratings")
    .insert({
      booking_id: input.bookingId,
      rater_id: rater.id,
      ratee_id: input.rateeId,
      stars: input.stars,
      comment: input.comment ?? null,
      tags: input.tags ?? [],
    })
    .select("id")
    .single();
  if (error || !rating) {
    throw new HttpError(409, "conflict", error?.message ?? "Rating already submitted");
  }
  const trustScore = await recalculateTrustScore(client, input.rateeId);
  return { ratingId: rating.id as string, trustScore };
}
