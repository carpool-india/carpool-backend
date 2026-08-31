import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateReportInput, UserReport } from "@rideshare/types";
import { badRequest } from "../lib/errors";
import { resolveAppUserId } from "./trip.service";

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
  const { data, error } = await client
    .from("user_blocks")
    .select("blocked_id, users!user_blocks_blocked_id_fkey(id, name, photo_url)")
    .eq("blocker_id", blockerId);
  if (error) {
    throw badRequest(error.message);
  }
  return (data ?? []).map((row: unknown) => {
    const r = row as { blocked_id: string; users: { id: string; name: string | null; photo_url: string | null } | { id: string; name: string | null; photo_url: string | null }[] | null };
    const u = Array.isArray(r.users) ? r.users[0] : r.users;
    return { id: r.blocked_id, name: u?.name ?? null, photoUrl: u?.photo_url ?? null };
  });
}
