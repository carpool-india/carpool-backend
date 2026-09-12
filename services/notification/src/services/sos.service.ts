import { sendPush } from "./fcm.service";
import { sendSms } from "./sms.service";
import { smsTemplates } from "../templates/sms.templates";

export interface SosDispatchInput {
  userName: string;
  userPhone: string;
  lat: number | null;
  lng: number | null;
  tripId: string;
  emergencyContacts: Array<{ name: string; phone: string }>;
  adminFcmTokens: string[];
  userFcmToken?: string;
}

export async function dispatchSos(input: SosDispatchInput): Promise<{
  policeNotified: boolean;
  contactsNotified: number;
  adminAlerted: number;
}> {
  // No fabricated 0,0 fallback here — the reporter's app is responsible for
  // sending null when it has no real fix, and this must say so plainly rather
  // than pointing responders at a real place the reporter never was.
  const locationText =
    input.lat !== null && input.lng !== null
      ? `live location https://maps.google.com/?q=${input.lat},${input.lng}`
      : "location unavailable (no GPS fix yet)";
  const alert = `SOS RideShare India: ${input.userName} (${input.userPhone}) trip ${input.tripId} ${locationText}`;

  // There is no SMS/API gateway that dispatches police in India — MSG91/Fast2SMS/
  // Gupshup are all bulk-messaging providers, not emergency-services integrations,
  // so a text to "112" here would silently go nowhere. The one channel that
  // reliably reaches police is a real phone call, which the app prompts the user
  // to place directly (see mobile SosButton's "tap to call 112" fallback). This
  // service's real job is getting a human who can act — emergency contacts and
  // ops admins — the alert immediately.
  const contactResults = await Promise.allSettled(
    input.emergencyContacts.map((contact) => sendSms(contact.phone, `${alert}. Contact: ${contact.name}`))
  );
  const contactsNotified = contactResults.filter((result) => result.status === "fulfilled").length;
  contactResults.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`SOS: failed to SMS emergency contact ${input.emergencyContacts[index]?.phone}`, result.reason);
    }
  });

  const adminResults = await Promise.allSettled(
    input.adminFcmTokens.map((token) =>
      sendPush({
        token,
        title: "CRITICAL SOS",
        body: alert,
        highPriority: true,
        data: { type: "sos_admin", tripId: input.tripId, lat: String(input.lat ?? ""), lng: String(input.lng ?? "") },
      })
    )
  );
  const adminAlerted = adminResults.filter((result) => result.status === "fulfilled").length;
  adminResults.forEach((result) => {
    if (result.status === "rejected") {
      console.error("SOS: failed to push-alert an admin", result.reason);
    }
  });

  if (input.userFcmToken) {
    try {
      await sendPush({
        token: input.userFcmToken,
        title: "SOS sent",
        body: smsTemplates.sosAck(),
        highPriority: true,
        data: { type: "sos", tripId: input.tripId },
      });
    } catch (error) {
      console.error("SOS: failed to push acknowledgement to the reporting user", error);
    }
  }

  return {
    policeNotified: false,
    contactsNotified,
    adminAlerted,
  };
}
