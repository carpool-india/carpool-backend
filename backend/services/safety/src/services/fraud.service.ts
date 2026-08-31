import type { SupabaseClient } from "@supabase/supabase-js";

export function scoreFraudSignals(input: {
  otpFailures: number;
  cancellations: number;
  offRouteEvents: number;
  unverifiedKyc: boolean;
}): { flag: boolean; scoreDelta: number; reason: string } {
  let risk = 0;
  const reasons: string[] = [];
  if (input.unverifiedKyc) {
    risk += 25;
    reasons.push("KYC incomplete");
  }
  if (input.otpFailures >= 3) {
    risk += 20;
    reasons.push("Repeated OTP failures");
  }
  if (input.cancellations >= 5) {
    risk += 20;
    reasons.push("High cancellation count");
  }
  if (input.offRouteEvents >= 2) {
    risk += 25;
    reasons.push("Repeated route deviation");
  }
  return {
    flag: risk >= 40,
    scoreDelta: -Math.min(20, Math.floor(risk / 5)),
    reason: reasons.join("; ") || "No fraud signal",
  };
}

export async function flagUser(
  client: SupabaseClient,
  userId: string,
  reason: string
): Promise<void> {
  await client.from("safety_events").insert({
    user_id: userId,
    event_type: "fraud_flag",
    severity: "high",
    metadata: { reason },
  });
}
