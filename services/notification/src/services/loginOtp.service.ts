import { randomInt, createHash, timingSafeEqual } from "node:crypto";
import type { Session } from "@supabase/supabase-js";
import { getAdminClient, getAnonClient } from "../lib/supabase";
import { smsTemplates } from "../templates/sms.templates";
import { sendFast2Sms, sendSms } from "./sms.service";
import { sendOtpWhatsApp } from "./whatsapp.service";

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

// Dev/QA-only bypass so testing doesn't burn real SMS credit. Never active in production —
// gated on NODE_ENV so this can't accidentally ship as a real auth bypass.
const TEST_OTP = "123456";
const TEST_PHONES = process.env.NODE_ENV === "production" ? new Set<string>() : new Set(["+919789631081"]);

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

function syntheticEmailFor(phone: string): string {
  return `${phone.replace(/\D/g, "")}@phone.rideshareindia.internal`;
}

export async function requestLoginOtp(phone: string): Promise<void> {
  const client = getAdminClient();
  const { data: existing } = await client
    .from("login_otps")
    .select("last_sent_at")
    .eq("phone", phone)
    .maybeSingle();

  if (existing && Date.now() - new Date(existing.last_sent_at).getTime() < RESEND_COOLDOWN_MS) {
    throw new Error("Please wait before requesting another OTP");
  }

  const isTestPhone = TEST_PHONES.has(phone);
  const otp = isTestPhone ? TEST_OTP : randomInt(0, 1000000).toString().padStart(6, "0");
  const now = new Date();

  const { error } = await client.from("login_otps").upsert({
    phone,
    otp_hash: hashOtp(otp),
    expires_at: new Date(now.getTime() + OTP_TTL_MS).toISOString(),
    attempts: 0,
    last_sent_at: now.toISOString(),
  });
  if (error) {
    throw new Error(`Unable to store OTP: ${error.message}`);
  }

  if (isTestPhone) {
    console.log(`[login-otp] test phone bypass — using fixed OTP, no SMS sent to ${phone}`);
    return;
  }

  const message = smsTemplates.otp(otp);
  try {
    await sendOtpWhatsApp(phone, otp);
    console.log(`[login-otp] delivered via WhatsApp to ${phone}`);
    return;
  } catch (whatsappError) {
    console.log(`[login-otp] WhatsApp failed: ${(whatsappError as Error).message}`);
  }
  try {
    await sendFast2Sms(phone, message);
    console.log(`[login-otp] delivered via Fast2SMS to ${phone}`);
    return;
  } catch (fast2smsError) {
    console.log(`[login-otp] Fast2SMS failed: ${(fast2smsError as Error).message}`);
  }
  await sendSms(phone, message);
  console.log(`[login-otp] delivered via MSG91 to ${phone}`);
}

export async function verifyLoginOtp(phone: string, otp: string): Promise<Session> {
  const client = getAdminClient();
  const { data: row, error } = await client
    .from("login_otps")
    .select("otp_hash, expires_at, attempts")
    .eq("phone", phone)
    .maybeSingle();
  if (error || !row) {
    throw new Error("No OTP request found for this number");
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new Error("OTP has expired, please request a new one");
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    throw new Error("Too many incorrect attempts, please request a new OTP");
  }

  const providedHash = Buffer.from(hashOtp(otp));
  const storedHash = Buffer.from(row.otp_hash);
  const matches = providedHash.length === storedHash.length && timingSafeEqual(providedHash, storedHash);

  if (!matches) {
    await client
      .from("login_otps")
      .update({ attempts: row.attempts + 1 })
      .eq("phone", phone);
    throw new Error("Incorrect OTP");
  }

  await client.from("login_otps").delete().eq("phone", phone);

  return mintSupabaseSession(phone);
}

async function mintSupabaseSession(phone: string): Promise<Session> {
  const adminClient = getAdminClient();

  let authUserId: string | null = null;

  const { data: existingRow } = await adminClient
    .from("users")
    .select("supabase_auth_id")
    .eq("phone", phone)
    .maybeSingle();
  if (existingRow?.supabase_auth_id) {
    authUserId = existingRow.supabase_auth_id as string;
  }

  if (!authUserId) {
    const created = await adminClient.auth.admin.createUser({ phone, phone_confirm: true });
    if (created.data.user) {
      authUserId = created.data.user.id;
    } else {
      const normalized = phone.replace(/^\+/, "");
      for (let page = 1; page <= 20 && !authUserId; page += 1) {
        const { data: list, error: listError } = await adminClient.auth.admin.listUsers({ page, perPage: 200 });
        if (listError || !list || list.users.length === 0) {
          break;
        }
        const match = list.users.find((user) => user.phone === normalized || user.phone === phone);
        if (match) {
          authUserId = match.id;
        }
      }
      if (!authUserId) {
        throw new Error(created.error?.message ?? "Unable to resolve auth user for this phone");
      }
    }
  }

  const syntheticEmail = syntheticEmailFor(phone);
  const { error: updateError } = await adminClient.auth.admin.updateUserById(authUserId, {
    email: syntheticEmail,
    email_confirm: true,
    phone,
    phone_confirm: true,
  });
  if (updateError) {
    throw new Error(`Unable to prepare session: ${updateError.message}`);
  }

  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: syntheticEmail,
  });
  if (linkError || !linkData) {
    throw new Error(linkError?.message ?? "Unable to generate session link");
  }

  const anonClient = getAnonClient();
  const { data: verifyData, error: verifyError } = await anonClient.auth.verifyOtp({
    type: "email",
    token_hash: linkData.properties.hashed_token,
  });
  if (verifyError || !verifyData.session) {
    throw new Error(verifyError?.message ?? "Unable to mint session");
  }

  return verifyData.session;
}
