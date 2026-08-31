import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionPlanType } from "@rideshare/types";

export async function hasActiveSubscription(
  client: SupabaseClient,
  userId: string,
  planTypes: SubscriptionPlanType[]
): Promise<boolean> {
  const { data, error } = await client
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .in("plan_type", planTypes)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();
  if (error) {
    return false;
  }
  return Boolean(data);
}
