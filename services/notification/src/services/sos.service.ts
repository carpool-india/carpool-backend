import { sendPush } from "./fcm.service";
import { sendSms } from "./sms.service";
import { smsTemplates } from "../templates/sms.templates";

export interface SosDispatchInput {
  userName: string;
  userPhone: string;
  lat: number;
  lng: number;
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
  const maps = `https://maps.google.com/?q=${input.lat},${input.lng}`;
  const alert = `SOS RideShare India: ${input.userName} (${input.userPhone}) trip ${input.tripId} live location ${maps}`;

  await sendSms("112", alert);

  for (const contact of input.emergencyContacts) {
    await sendSms(contact.phone, `${alert}. Contact: ${contact.name}`);
  }

  if (input.userFcmToken) {
    await sendPush({
      token: input.userFcmToken,
      title: "SOS sent",
      body: smsTemplates.sosAck(),
      highPriority: true,
      data: { type: "sos", tripId: input.tripId },
    });
  }

  for (const token of input.adminFcmTokens) {
    await sendPush({
      token,
      title: "CRITICAL SOS",
      body: alert,
      highPriority: true,
      data: { type: "sos_admin", tripId: input.tripId, lat: String(input.lat), lng: String(input.lng) },
    });
  }

  return {
    policeNotified: true,
    contactsNotified: input.emergencyContacts.length,
    adminAlerted: input.adminFcmTokens.length,
  };
}
