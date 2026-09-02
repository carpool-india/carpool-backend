import { loadEnv } from "../lib/env";

const PROVIDER_TIMEOUT_MS = 8000;

export async function sendSms(phone: string, message: string): Promise<void> {
  const env = loadEnv();
  const params = new URLSearchParams({
    authkey: env.MSG91_AUTH_KEY,
    mobiles: phone.replace("+", ""),
    message,
    sender: env.MSG91_SENDER_ID,
    route: "4",
    country: "91",
  });
  const response = await fetch(`https://api.msg91.com/api/sendhttp.php?${params.toString()}`, {
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  });
  const text = await response.text();
  // MSG91's legacy endpoint returns HTTP 200 even on failure — the real result is a
  // plain-text numeric request ID on success, or an error message otherwise.
  if (!response.ok || !/^\d+$/.test(text.trim())) {
    throw new Error(`MSG91 SMS failed: ${response.status} ${text}`);
  }
}

interface TwoFactorResponse {
  Status: string;
  Details?: string;
}

export async function sendTwoFactorSms(phone: string, otp: string): Promise<void> {
  const env = loadEnv();
  const number = phone.startsWith("+") ? phone : `+91${phone}`;
  const response = await fetch(
    `https://2factor.in/API/V1/${env.TWOFACTOR_API_KEY}/SMS/${encodeURIComponent(number)}/${otp}`,
    { signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS) },
  );
  const data = (await response.json().catch(() => null)) as TwoFactorResponse | null;
  if (!response.ok || data?.Status !== "Success") {
    throw new Error(`2Factor SMS failed: ${response.status} ${data?.Details ?? ""}`);
  }
}

interface Fast2SmsResponse {
  return: boolean;
  message?: string | string[];
  request_id?: string;
}

function fast2SmsMessage(data: Fast2SmsResponse | null): string {
  if (!data?.message) {
    return "";
  }
  return Array.isArray(data.message) ? data.message.join(", ") : data.message;
}

export async function sendFast2Sms(phone: string, message: string): Promise<void> {
  const env = loadEnv();
  const number = phone.replace(/^\+91/, "");
  const params = new URLSearchParams({
    authorization: env.FAST2SMS_API_KEY,
    route: "q",
    message,
    numbers: number,
  });
  const response = await fetch(`https://www.fast2sms.com/dev/bulkV2?${params.toString()}`, {
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  });
  const data = (await response.json().catch(() => null)) as Fast2SmsResponse | null;
  console.log(`[fast2sms] response: ${JSON.stringify(data)}`);
  if (!response.ok || !data?.return) {
    throw new Error(`Fast2SMS failed: ${response.status} ${fast2SmsMessage(data)}`);
  }
}
