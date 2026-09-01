import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";
import { loadEnv } from "./env";

// None of these clients use Supabase Realtime, but createClient() eagerly
// validates WebSocket support on Node < 22 and throws if it can't find one.
// Passing the `ws` package as the transport satisfies that check.
const realtime = { transport: ws as unknown as never };

export function getAdminClient(): SupabaseClient {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime,
  });
}

export function createUserClient(accessToken: string): SupabaseClient {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    realtime,
  });
}

export function getAnonClient(): SupabaseClient {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime,
  });
}
