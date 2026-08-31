import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { HttpError } from "./errors";
import { loadEnv } from "./env";

export function getAdminClient(): SupabaseClient {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createUserClient(accessToken: string): SupabaseClient {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export async function getAuthUser(accessToken: string): Promise<User> {
  const { data, error } = await getAdminClient().auth.getUser(accessToken);
  if (error || !data.user) {
    throw new HttpError(401, "unauthorized", "Invalid or expired session");
  }
  return data.user;
}
