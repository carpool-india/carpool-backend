import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateReportInput, UserReport } from "@rideshare/types";
import { badRequest, notFound } from "../lib/errors";
import { resolveAppUserId } from "./trip.service";

export interface TrustScoreBreakdown {
  total: number;
  kycPoints: number;
  kycMax: number;
  aadhaarVerified: boolean;
  dlVerified: boolean;
  faceMatchDone: boolean;
  ratingPoints: number;
  ratingMax: number;
  averageStars: number;
  ratingCount: number;
  completionPoints: number;
  completionMax: number;
  completedTrips: number;
  cancellationPenalty: number;
  cancellations: number;
  fraudPenalty: number;
  fraudFlags: number;
}

export async function getTrustScoreBreakdown(
  client: SupabaseClient,
  supabaseAuthId: string,
  targetUserId?: string
): Promise<TrustScoreBreakdown> {
  const selfId = await resolveAppUserId(client, supabaseAuthId);
  const userId = targetUserId || selfId;
  const { data, error } = await client.rpc("get_trust_score_breakdown", { p_user_id: userId });
  if (error) {
    throw badRequest(error.message);
  }
  if (!data) {
    throw notFound("User not found");
  }
  return data as TrustScoreBreakdown;
}

export async function createReport(
  client: SupabaseClient,
  supabaseAuthId: string,
  input: CreateReportInput
): Promise<UserReport> {
  const reporterId = await resolveAppUserId(client, supabaseAuthId);
  if (input.reportedId === reporterId) {
    throw badRequest("You cannot report yourself");
  }
  const { data, error } = await client
    .from("user_reports")
    .insert({
      reporter_id: reporterId,
      reported_id: input.reportedId,
      reason: input.reason,
      details: input.details ?? null,
      trip_id: input.tripId ?? null,
      booking_id: input.bookingId ?? null,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw badRequest(error?.message ?? "Unable to submit report");
  }
  return {
    id: data.id,
    reporterId: data.reporter_id,
    reportedId: data.reported_id,
    reason: data.reason,
    details: data.details,
    status: data.status,
    createdAt: data.created_at,
  };
}

export async function blockUser(
  client: SupabaseClient,
  supabaseAuthId: string,
  blockedId: string
): Promise<void> {
  const blockerId = await resolveAppUserId(client, supabaseAuthId);
  if (blockedId === blockerId) {
    throw badRequest("You cannot block yourself");
  }
  const { error } = await client
    .from("user_blocks")
    .upsert({ blocker_id: blockerId, blocked_id: blockedId }, { onConflict: "blocker_id,blocked_id" });
  if (error) {
    throw badRequest(error.message);
  }
}

export async function unblockUser(
  client: SupabaseClient,
  supabaseAuthId: string,
  blockedId: string
): Promise<void> {
  const blockerId = await resolveAppUserId(client, supabaseAuthId);
  const { error } = await client
    .from("user_blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) {
    throw badRequest(error.message);
  }
}

export async function listBlockedUsers(
  client: SupabaseClient,
  supabaseAuthId: string
): Promise<Array<{ id: string; name: string | null; photoUrl: string | null }>> {
  const blockerId = await resolveAppUserId(client, supabaseAuthId);
  const { data, error } = await client.from("user_blocks").select("blocked_id").eq("blocker_id", blockerId);
  if (error) {
    throw badRequest(error.message);
  }
  const blockedIds = (data ?? []).map((row) => row.blocked_id as string);
  if (blockedIds.length === 0) {
    return [];
  }
  const { data: profileRows } = await client
    .from("user_public_profiles")
    .select("id, name, photo_url")
    .in("id", blockedIds);
  const profiles = new Map(
    ((profileRows ?? []) as Array<{ id: string; name: string | null; photo_url: string | null }>).map((row) => [
      row.id,
      row,
    ])
  );
  return blockedIds.map((id) => {
    const profile = profiles.get(id);
    return { id, name: profile?.name ?? null, photoUrl: profile?.photo_url ?? null };
  });
}
