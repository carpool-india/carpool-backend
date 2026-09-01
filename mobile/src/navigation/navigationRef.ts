import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateFromNotification(data: Record<string, string> | undefined): void {
  if (!data?.type || !navigationRef.isReady()) {
    return;
  }
  switch (data.type) {
    case "chat":
      if (data.tripId) {
        navigationRef.navigate("Chat", { tripId: data.tripId });
      }
      break;
    case "sos":
    case "trip_started":
      navigationRef.navigate("ActiveTrip");
      break;
    case "booking_request":
      if (data.tripId) {
        navigationRef.navigate("TripPassengers", { tripId: data.tripId });
      }
      break;
    case "booking_accepted":
    case "booking_rejected":
    case "booking_cancelled":
      navigationRef.navigate("Main", { screen: "RidesTab" });
      break;
    default:
      break;
  }
}
