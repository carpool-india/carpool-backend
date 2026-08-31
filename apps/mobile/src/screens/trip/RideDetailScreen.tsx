import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { haversineKm } from "@rideshare/utils";
import { Screen } from "../../components/ui/Screen";
import { containedScrollProps } from "../../components/ui/containedScroll";
import { RideCard } from "../../components/RideCard";
import { LiveMap } from "../../components/LiveMap";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { ReportBlockSheet } from "../../components/ReportBlockSheet";
import { kgCo2Saved } from "../../utils/co2Calculator";
import { useTripStore } from "../../store/tripStore";
import { t } from "../../i18n/translations";
import { useAuthStore } from "../../store/authStore";

export function RideDetailScreen({
  route,
  navigation,
}: {
  route: { params: { tripId: string } };
  navigation: { navigate: (name: string, params: { tripId: string }) => void };
}) {
  const language = useAuthStore((state) => state.language);
  const trip = useTripStore(
    (state) => state.selectedMatch ?? state.matches.find((item) => item.id === route.params.tripId)
  );
  const [showReport, setShowReport] = useState(false);
  if (!trip) {
    return (
      <Screen variant="stacked">
        <View className="flex-1 items-center justify-center">
          <Text>Trip not found</Text>
        </View>
      </Screen>
    );
  }
  const distanceKm = haversineKm(
    trip.originPoint.lat,
    trip.originPoint.lng,
    trip.destinationPoint.lat,
    trip.destinationPoint.lng
  );
  return (
    <Screen variant="stacked">
      <ScrollView className="flex-1 px-4 pt-3" contentContainerStyle={{ paddingBottom: 16 }} {...containedScrollProps}>
        <LiveMap
          lat={trip.originPoint.lat}
          lng={trip.originPoint.lng}
          origin={trip.originPoint}
          destination={trip.destinationPoint}
          polyline={trip.routePolyline}
        />
        <View className="mt-3">
          <RideCard
            trip={trip}
            trustScore={trip.trustScore}
            averageStars={trip.averageStars}
            ratingCount={trip.ratingCount}
            driverName={trip.driverName}
            driverPhotoUrl={trip.driverPhotoUrl}
            detourKm={trip.detourKm}
            language={language}
            onPress={() => undefined}
          />
        </View>
        <Pressable onPress={() => setShowReport(true)} className="mt-2 flex-row items-center self-start px-2 py-1">
          <Ionicons name="flag-outline" size={14} color="#94A3B8" />
          <Text className="ml-1.5 text-xs font-semibold text-slate-400">{t(language, "reportUser")}</Text>
        </Pressable>
        <View className="mt-1 rounded-[28px] bg-white p-5">
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
              <Ionicons name="leaf" size={18} color="#059669" />
            </View>
            <View className="ml-3">
              <Text className="text-xs font-bold uppercase tracking-wide text-slate-400">CO₂ saved</Text>
              <Text className="text-lg font-extrabold text-slate-900">{kgCo2Saved(distanceKm, 2)} kg on this trip</Text>
            </View>
          </View>
          <View className="mt-4 flex-row items-start">
            <Ionicons name="navigate-circle" size={20} color="#0F766E" />
            <Text className="ml-2 flex-1 text-sm leading-5 text-slate-600">
              Suggested pickup {trip.pickupPoint.lat.toFixed(4)}, {trip.pickupPoint.lng.toFixed(4)}. Exact pin is shared after UPI escrow.
            </Text>
          </View>
        </View>
      </ScrollView>
      <View className="border-t border-slate-100 bg-white px-4 pb-6 pt-3">
        <PrimaryButton
          label={trip.instantBook === false ? t(language, "requestToBook") : t(language, "bookSeat")}
          onPress={() => navigation.navigate("Booking", { tripId: trip.id })}
        />
      </View>
      <ReportBlockSheet
        visible={showReport}
        onClose={() => setShowReport(false)}
        language={language}
        userId={trip.driverId}
        userName={trip.driverName}
        tripId={trip.id}
      />
    </Screen>
  );
}
