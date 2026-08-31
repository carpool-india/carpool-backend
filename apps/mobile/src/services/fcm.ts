import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { serviceUrls } from "./api";
import { useAuthStore } from "../store/authStore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerFcmToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") {
    return null;
  }
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("sos", {
      name: "SOS",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    undefined;
  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  const session = useAuthStore.getState().sessionToken;
  if (session) {
    await fetch(`${serviceUrls.notification}/push/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session}` },
      body: JSON.stringify({ token: token.data, platform: Platform.OS === "ios" ? "ios" : "android" }),
    }).catch(() => undefined);
  }
  return token.data;
}
