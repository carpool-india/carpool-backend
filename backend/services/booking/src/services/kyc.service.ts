import type { SupabaseClient } from "@supabase/supabase-js";
import { loadEnv } from "../lib/env";
import { pushToUsers } from "../lib/push";
import { getAdminClient } from "../lib/supabase";
import { resolveAppUserId } from "./trip.service";

export type KycDocType = "aadhaar" | "dl" | "selfie";

const DOC_LABEL: Record<KycDocType, string> = {
  aadhaar: "Aadhaar",
  dl: "driving licence",
  selfie: "selfie",
};

async function notifyAdminsOfPendingKyc(userId: string, docType: KycDocType): Promise<void> {
  const admin = getAdminClient();
  const { data: admins } = await admin.from("device_tokens").select("user_id, users!inner(is_admin)").eq("users.is_admin", true);
  const adminUserIds = Array.from(new Set(((admins ?? []) as Array<{ user_id: string }>).map((row) => row.user_id)));
  await pushToUsers(adminUserIds, "KYC review needed", `New ${DOC_LABEL[docType]} document awaiting manual review`, {
    type: "kyc_review",
    userId,
  });
}

export async function verifyKycDocument(
  client: SupabaseClient,
  supabaseAuthId: string,
  input: { docType: KycDocType; hyperVergeTxnId: string }
): Promise<{ verified: boolean; status: string }> {
  const userId = await resolveAppUserId(client, supabaseAuthId);
  const env = loadEnv();

  let verified = false;
  // "pending_review" (not "failed") is the fallback for everything that isn't an
  // explicit pass/fail verdict from HyperVerge itself — keys unset, a transient
  // HTTP/network error, or a response shape we don't recognize. A transient
  // HyperVerge outage rejecting someone's real Aadhaar/DL would be far worse
  // than routing it to manual admin review instead.
  let status = "pending_review";
  let needsAdminReview = true;

  if (!env.HYPERVERGE_APP_ID || !env.HYPERVERGE_APP_KEY) {
    // keys unset: fall through with the pending_review default above.
  } else {
    try {
      const response = await fetch("https://ind.idv.hyperverge.co/v1/verify", {
        method: "POST",
        headers: {
          appId: env.HYPERVERGE_APP_ID,
          appKey: env.HYPERVERGE_APP_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId: input.hyperVergeTxnId,
          documentType: input.docType,
          userId,
        }),
      });
      if (response.ok) {
        const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        // HyperVerge's exact success field depends on the product/flow configured on your
        // account — confirm the real field name against your HyperVerge dashboard/docs.
        // Checked defensively here against the common shapes their APIs use.
        const nested = (body.result ?? body.data ?? {}) as Record<string, unknown>;
        const statusField = (body.status ?? nested.status) as string | undefined;
        if (statusField === "success" || statusField === "auto_approved" || statusField === "verified") {
          verified = true;
          status = statusField;
          needsAdminReview = false;
        } else if (statusField === "failed" || statusField === "rejected" || statusField === "auto_declined") {
          // An explicit rejection verdict from HyperVerge — not a plumbing error —
          // so it's safe to fail the document outright instead of queuing review.
          status = statusField;
          needsAdminReview = false;
        }
        // Any other/unrecognized statusField falls through to pending_review.
      }
      // A non-2xx response falls through to pending_review; the specific HTTP
      // status isn't actionable to the user and shouldn't fail their document.
    } catch {
      // network_error falls through to pending_review too.
    }
  }

  if (needsAdminReview) {
    void notifyAdminsOfPendingKyc(userId, input.docType).catch(() => undefined);
  }

  await client
    .from("kyc_sessions")
    .update({ status: verified ? "verified" : status === "pending_review" ? "pending" : "failed" })
    .eq("hyperverge_txn_id", input.hyperVergeTxnId);

  if (verified) {
    const patch =
      input.docType === "aadhaar"
        ? { aadhaar_verified: true }
        : input.docType === "dl"
          ? { dl_verified: true }
          : { face_match_done: true };
    await client.from("users").update(patch).eq("id", userId);
  }

  return { verified, status };
}
