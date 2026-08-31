import type { SupabaseClient } from "@supabase/supabase-js";
import { loadEnv } from "../lib/env";
import { resolveAppUserId } from "./trip.service";

export type KycDocType = "aadhaar" | "dl" | "selfie";

export async function verifyKycDocument(
  client: SupabaseClient,
  supabaseAuthId: string,
  input: { docType: KycDocType; hyperVergeTxnId: string }
): Promise<{ verified: boolean; status: string }> {
  const userId = await resolveAppUserId(client, supabaseAuthId);
  const env = loadEnv();

  let verified = false;
  let status = "failed";

  if (!env.HYPERVERGE_APP_ID || !env.HYPERVERGE_APP_KEY) {
    return { verified: false, status: "pending_review" };
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
        verified = statusField === "success" || statusField === "auto_approved" || statusField === "verified";
        status = statusField ?? (verified ? "verified" : "unverified");
      } else {
        status = `http_${response.status}`;
      }
    } catch {
      status = "network_error";
    }
  }

  await client
    .from("kyc_sessions")
    .update({ status: verified ? "verified" : "failed" })
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
