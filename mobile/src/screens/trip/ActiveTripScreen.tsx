import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LiveMap } from "../../components/LiveMap";
import { SosButton } from "../../components/SosButton";
import { useLiveGps } from "../../hooks/useLiveGps";
import { useLocation } from "../../hooks/useLocation";
import { useRealtimeTrip } from "../../hooks/useRealtimeTrip";
import { bookingPost } from "../../services/api";
import { t } from "../../i18n/translations";
import { useAuthStore } from "../../store/authStore";
import { useLocationStore } from "../../store/locationStore";
import { useTripStore } from "../../store/tripStore";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { GhostButton } from "../../components/ui/PrimaryButton";
import { RouteTimeline } from "../../components/ui/RouteTimeline";
import { Screen } from "../../components/ui/Screen";

export function ActiveTripScreen({
  navigation,
}: {
  navigation: { navigate: (name: string, params?: { tripId: string }) => void };
}) {
  const language = useAuthStore((state) => state.language);
  const role = useAuthStore((state) => state.user?.role);
  const trip = useTripStore((state) => state.activeTrip);
  const booking = useTripStore((state) => state.activeBooking);
  const tripId = trip?.id ?? booking?.tripId ?? null;
  const lat = useLocationStore((state) => state.lat) ?? 12.9716;
  const lng = useLocationStore((state) => state.lng) ?? 77.5946;
  const isDriver = role === "driver" || role === "both";

  useLocation(true);
  useLiveGps(tripId, isDriver, trip?.routePolyline);
  useRealtimeTrip(isDriver ? null : tripId);

  async function startTrip() {
    if (!booking) {
      return;
    }
    await bookingPost(`/bookings/${booking.id}/start`, {});
  }

  return (
    <Screen variant="stacked" scroll>
      <View className="px-4 pt-3">
      <LiveMap
        lat={lat}
        lng={lng}
        origin={trip?.originPoint}
        destination={trip?.destinationPoint}
        polyline={trip?.routePolyline}
      />
      {trip ? (
        <View className="-mt-6 mx-1 rounded-[24px] bg-white p-4" style={{ elevation: 6, shadowColor: "#0F172A", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}>
          <RouteTimeline origin={trip.originName} destination={trip.destinationName} />
        </View>
      ) : null}
      <View className="mt-4 items-center">
        <SosButton tripId={booking?.tripId ?? trip?.id ?? ""} bookingId={booking?.id} />
        <Text className="mt-2 text-xs text-slate-500">{t(language, "sosHold")}</Text>
      </View>
      {tripId ? (
        <Pressable
          onPress={() => navigation.navigate("Chat", { tripId })}
          className="mt-4 flex-row items-center justify-center rounded-2xl bg-white py-3.5"
          style={{ elevation: 2, shadowColor: "#0F172A", shadowOpacity: 0.06, shadowRadius: 8 }}
        >
          <Ionicons name="chatbubble-ellipses" size={18} color="#0F766E" />
          <Text className="ml-2 font-bold text-brand">{t(language, "chatTitle")}</Text>
        </Pressable>
      ) : null}
      {isDriver ? (
        <View className="mt-4">
          <PrimaryButton label="Start trip" onPress={() => void startTrip()} />
        </View>
      ) : null}
      <View className="mt-4">
        <GhostButton label="Trip complete — rate" onPress={() => navigation.navigate("RateTrip")} />
      </View>
      </View>
    </Screen>
  );
}
