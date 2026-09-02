import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Trip } from "@rideshare/types";
import { formatInr } from "../utils/formatCurrency";
import { formatTripDate, formatTripTime } from "../utils/datetime";
import { cardShadow } from "../theme/shadows";
import { t, type AppLanguage } from "../i18n/translations";
import { TrustScoreBadge } from "./TrustScoreBadge";
import { RouteTimeline } from "./ui/RouteTimeline";
import { Avatar } from "./ui/Avatar";

export function RideCard({
  trip,
  trustScore,
  averageStars,
  ratingCount,
  driverName,
  driverPhotoUrl,
  detourKm,
  language,
  onPress,
}: {
  trip: Trip;
  trustScore: number;
  averageStars?: number;
  ratingCount?: number;
  driverName: string;
  driverPhotoUrl?: string | null;
  detourKm?: number;
  language: AppLanguage;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={cardShadow} className="mb-4 rounded-[28px] bg-white p-4">
      <View className="mb-4 flex-row items-start justify-between">
        <View>
          <Text className="text-2xl font-extrabold text-slate-900">{formatTripTime(trip.departureTime)}</Text>
          <Text className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {formatTripDate(trip.departureTime)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-2xl font-extrabold text-brand">{formatInr(trip.pricePerSeat)}</Text>
          <Text className="text-[11px] font-medium text-slate-400">per seat</Text>
        </View>
      </View>

      <RouteTimeline
        origin={trip.originName}
        destination={trip.destinationName}
        originMeta={`${trip.seatsAvailable} seats left`}
        destinationMeta={typeof detourKm === "number" ? `${detourKm.toFixed(1)} km detour` : undefined}
      />

      <View className="mt-4 flex-row items-center border-t border-slate-100 pt-3">
        <Avatar photoUrl={driverPhotoUrl} name={driverName} size={40} />
        <View className="ml-3 flex-1">
          <View className="flex-row items-center">
            <Text className="font-bold text-slate-900">{driverName}</Text>
            {ratingCount ? (
              <View className="ml-2 flex-row items-center">
                <Ionicons name="star" size={11} color="#D97706" />
                <Text className="ml-0.5 text-[11px] font-bold text-slate-500">
                  {averageStars?.toFixed(1)} ({ratingCount})
                </Text>
              </View>
            ) : null}
          </View>
          <View className="mt-1 flex-row items-center gap-1.5 self-start">
            <TrustScoreBadge score={trustScore} userId={trip.driverId} />
            <View className={`rounded-full px-2 py-1 ${trip.tripType === "intercity" ? "bg-amber-50" : "bg-brand-light"}`}>
              <Text className={`text-[10px] font-bold ${trip.tripType === "intercity" ? "text-amber-700" : "text-brand"}`}>
                {t(language, trip.tripType === "intercity" ? "intercity" : "intracity")}
              </Text>
            </View>
            {trip.instantBook === false ? (
              <View className="rounded-full bg-slate-100 px-2 py-1">
                <Text className="text-[10px] font-bold text-slate-500">{t(language, "requestToBook")}</Text>
              </View>
            ) : null}
          </View>
          {trip.vehicleRegistration ? (
            <View className="mt-1 flex-row items-center">
              <Ionicons name={trip.vehicleType === "bike" ? "bicycle" : "car-sport"} size={12} color="#94A3B8" />
              <Text className="ml-1 text-[11px] font-medium text-slate-500">{trip.vehicleRegistration}</Text>
            </View>
          ) : null}
        </View>
        {trip.isWomenOnly ? (
          <View className="mr-2 rounded-full bg-pink-50 px-2 py-1">
            <Text className="text-[10px] font-bold text-pink-700">Women</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </View>
    </Pressable>
  );
}
