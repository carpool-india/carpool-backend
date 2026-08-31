import { useCallback, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { Booking } from "@rideshare/types";
import { bookingGet } from "../../services/api";
import { formatInr } from "../../utils/formatCurrency";
import { formatTripWhen } from "../../utils/datetime";
import { t } from "../../i18n/translations";
import { useAuthStore } from "../../store/authStore";
import { ErrorRetry } from "../../components/ui/ErrorRetry";
import { Screen } from "../../components/ui/Screen";
import { containedScrollProps } from "../../components/ui/containedScroll";
import { softShadow } from "../../theme/shadows";

export function PaymentsScreen() {
  const language = useAuthStore((state) => state.language);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    bookingGet<{ bookings: Booking[] }>("/bookings/me")
      .then((payload) => setBookings(payload.bookings))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen variant="stacked">
      <View className="flex-1 bg-canvas px-4 pt-4">
      <Text className="mb-3 text-sm text-slate-500">{t(language, "paymentsSubtitle")}</Text>
      {loadError ? (
        <ErrorRetry language={language} onRetry={load} />
      ) : (
      <FlatList
        className="flex-1"
        data={bookings}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        contentContainerStyle={{ paddingBottom: 16 }}
        {...containedScrollProps}
        ListEmptyComponent={
          !loading ? (
            <View className="mt-16 items-center px-6">
              <Ionicons name="card-outline" size={28} color="#94A3B8" />
              <Text className="mt-3 text-center text-sm text-slate-500">{t(language, "noPayments")}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={softShadow} className="mb-3 rounded-[24px] bg-white p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-slate-900">
                {item.trip ? `${item.trip.originName} → ${item.trip.destinationName}` : "Ride"}
              </Text>
              <Text className="text-lg font-extrabold text-brand">{formatInr(item.totalAmount)}</Text>
            </View>
            {item.trip ? (
              <Text className="mt-0.5 text-xs text-slate-500">{formatTripWhen(item.trip.departureTime)}</Text>
            ) : null}
            <View className="mt-3 flex-row justify-between border-t border-slate-100 pt-3">
              <PaymentStat label={t(language, "fare")} value={formatInr(item.subtotal)} />
              <PaymentStat label={t(language, "serviceFee")} value={formatInr(item.serviceFee)} />
            </View>
            <View className="mt-3 self-start rounded-full bg-slate-100 px-2.5 py-1">
              <Text className="text-[11px] font-bold capitalize text-slate-600">{item.status.replace("_", " ")}</Text>
            </View>
          </View>
        )}
      />
      )}
      </View>
    </Screen>
  );
}

function PaymentStat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</Text>
      <Text className="mt-0.5 text-sm font-bold text-slate-800">{value}</Text>
    </View>
  );
}
