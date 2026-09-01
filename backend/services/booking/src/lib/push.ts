import { loadEnv } from "./env";
import { getAdminClient } from "./supabase";

export async function pushToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (userIds.length === 0) {
    return;
  }
  try {
    const env = loadEnv();
    const admin = getAdminClient();
    const { data: tokens } = await admin.from("device_tokens").select("token").in("user_id", userIds);
    if (!tokens || tokens.length === 0) {
      return;
    }
    await Promise.all(
      (tokens as Array<{ token: string }>).map((row) =>
        fetch(`${env.NOTIFICATION_SERVICE_URL}/push`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.INTERNAL_SERVICE_SECRET ? { "x-internal-secret": process.env.INTERNAL_SERVICE_SECRET } : {}),
          },
          body: JSON.stringify({ token: row.token, title, body, data }),
        }).catch(() => undefined)
      )
    );
  } catch {
    // Best-effort: a failed push must never affect the caller's own success path.
  }
}

export function pushToUser(userId: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
  return pushToUsers([userId], title, body, data);
}
