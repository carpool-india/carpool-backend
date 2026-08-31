import { loadEnv } from "../lib/env";
import { whatsappTemplates } from "../templates/whatsapp.templates";

export async function sendWhatsApp(destination: string, text: string): Promise<void> {
  const env = loadEnv();
  const body = new URLSearchParams({
    channel: "whatsapp",
    source: env.GUPSHUP_SOURCE_NUMBER,
    destination: destination.replace("+", ""),
    "src.name": "RideShareIndia",
    message: JSON.stringify({ type: "text", text }),
  });
  const response = await fetch("https://api.gupshup.io/wa/api/v1/msg", {
    method: "POST",
    headers: {
      apikey: env.GUPSHUP_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!response.ok) {
    throw new Error(`Gupshup WhatsApp failed: ${await response.text()}`);
  }
}

export async function sendOtpWhatsApp(destination: string, otp: string): Promise<void> {
  const env = loadEnv();
  const body = new URLSearchParams({
    channel: "whatsapp",
    source: env.GUPSHUP_SOURCE_NUMBER,
    destination: destination.replace("+", ""),
    "src.name": "RideShareIndia",
    template: JSON.stringify({ id: env.GUPSHUP_OTP_TEMPLATE_ID, params: [otp] }),
  });
  const response = await fetch("https://api.gupshup.io/wa/api/v1/template/msg", {
    method: "POST",
    headers: {
      apikey: env.GUPSHUP_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!response.ok) {
    throw new Error(`Gupshup WhatsApp OTP failed: ${await response.text()}`);
  }
}

export async function sendBookingCard(
  phone: string,
  input: Parameters<typeof whatsappTemplates.bookingCard>[0]
): Promise<void> {
  const card = whatsappTemplates.bookingCard(input);
  await sendWhatsApp(phone, card.body);
}
